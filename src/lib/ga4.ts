import crypto from "node:crypto";

/**
 * The bit of the Google Analytics 4 Data API the dashboard actually needs.
 *
 * Hand-rolled rather than pulling in `@google-analytics/data`: that package
 * drags gRPC and protobuf into the bundle to send what are, in the end, two
 * JSON POSTs. Everything here is `fetch` plus one RS256 signature, which is
 * the same shape as the Supabase calls in `api-auth.ts`.
 *
 * Node runtime only — `node:crypto` signing is not available on the edge, so
 * any route importing this must declare `export const runtime = "nodejs"`.
 */

const TOKEN_URL = "https://oauth2.googleapis.com/token";
const DATA_API = "https://analyticsdata.googleapis.com/v1beta";
const SCOPE = "https://www.googleapis.com/auth/analytics.readonly";

/** GA4 refuses more than five reports in one batch. */
const BATCH_LIMIT = 5;

export type GA4Credentials = {
  /** Numeric property id — *not* the `G-XXXX` measurement id. */
  propertyId: string;
  clientEmail: string;
  privateKey: string;
};

export type GA4Config =
  | { ok: true; creds: GA4Credentials }
  | { ok: false; reason: string };

export class GA4Error extends Error {
  constructor(message: string, readonly status = 502) {
    super(message);
    this.name = "GA4Error";
  }
}

/**
 * Reads credentials from the environment.
 *
 * Two accepted shapes, because the two places this runs want different things:
 * a whole service-account JSON blob (what Google hands you, easiest to paste
 * into Vercel) or the email/key pair split across two variables.
 *
 * Returns a reason rather than throwing — an unconfigured server is a state the
 * app renders as setup instructions, not an error.
 */
export function ga4Config(): GA4Config {
  const propertyId = (process.env.GA4_PROPERTY_ID ?? "")
    .trim()
    .replace(/^properties\//, "");

  let clientEmail = (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? "").trim();
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "";

  const blob = (process.env.GOOGLE_SERVICE_ACCOUNT_JSON ?? "").trim();
  if (blob) {
    try {
      // Some hosts mangle multi-line values, so a base64 blob is allowed too.
      const raw = blob.startsWith("{") ? blob : Buffer.from(blob, "base64").toString("utf8");
      const parsed = JSON.parse(raw) as { client_email?: string; private_key?: string };
      clientEmail = (parsed.client_email ?? clientEmail).trim();
      privateKey = parsed.private_key ?? privateKey;
    } catch {
      return { ok: false, reason: "GOOGLE_SERVICE_ACCOUNT_JSON is set but is not valid JSON (or base64-encoded JSON)." };
    }
  }

  // Env files store the PEM with literal backslash-n; PEM parsers want real ones.
  privateKey = privateKey.replace(/\\n/g, "\n").trim();

  const missing: string[] = [];
  if (!propertyId) missing.push("GA4_PROPERTY_ID");
  if (!clientEmail) missing.push("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  if (!privateKey) missing.push("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY");
  if (missing.length > 0) {
    return { ok: false, reason: `Analytics is not configured on the server: ${missing.join(", ")} ${missing.length === 1 ? "is" : "are"} unset.` };
  }

  if (!/^\d+$/.test(propertyId)) {
    return {
      ok: false,
      reason: `GA4_PROPERTY_ID must be the numeric property id from Admin → Property details, not "${propertyId}".`,
    };
  }

  return { ok: true, creds: { propertyId, clientEmail, privateKey } };
}

/* ---------------------------------------------------------------- access token */

let cachedToken: { key: string; token: string; expiresAt: number } | null = null;

function base64url(input: Buffer | string): string {
  const bytes = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return bytes
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

/**
 * Signed-JWT grant: sign a short assertion with the service account key and
 * swap it for an access token. Tokens last an hour; this keeps one in module
 * memory and re-mints it a minute early so a request never races the expiry.
 */
async function accessToken(creds: GA4Credentials): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedToken && cachedToken.key === creds.clientEmail && cachedToken.expiresAt > now + 60) {
    return cachedToken.token;
  }

  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({
      iss: creds.clientEmail,
      scope: SCOPE,
      aud: TOKEN_URL,
      iat: now,
      exp: now + 3600,
    })
  );

  let signature: string;
  try {
    const signer = crypto.createSign("RSA-SHA256");
    signer.update(`${header}.${claims}`);
    signature = base64url(signer.sign(creds.privateKey));
  } catch {
    throw new GA4Error(
      "The service-account private key could not be read. Copy it verbatim, including the BEGIN/END lines.",
      500
    );
  }

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claims}.${signature}`,
    }),
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as
    | { access_token?: string; expires_in?: number; error_description?: string; error?: string }
    | null;

  if (!res.ok || !payload?.access_token) {
    const detail = payload?.error_description || payload?.error || `HTTP ${res.status}`;
    throw new GA4Error(`Google refused the service-account sign-in: ${detail}`, 502);
  }

  cachedToken = {
    key: creds.clientEmail,
    token: payload.access_token,
    expiresAt: now + (payload.expires_in ?? 3600),
  };
  return cachedToken.token;
}

/* --------------------------------------------------------------------- reports */

export type GA4ReportRequest = {
  dateRanges: { startDate: string; endDate: string }[];
  dimensions?: { name: string }[];
  metrics: { name: string }[];
  orderBys?: unknown[];
  limit?: number;
  keepEmptyRows?: boolean;
};

export type GA4Row = {
  dimensionValues?: { value?: string }[];
  metricValues?: { value?: string }[];
};

export type GA4Report = {
  rows?: GA4Row[];
  totals?: GA4Row[];
  rowCount?: number;
};

async function call<T>(creds: GA4Credentials, method: string, body: unknown): Promise<T> {
  const token = await accessToken(creds);
  const res = await fetch(`${DATA_API}/properties/${creds.propertyId}:${method}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  const payload = (await res.json().catch(() => null)) as { error?: { message?: string; status?: string } } | null;

  if (!res.ok) {
    const message = payload?.error?.message ?? `HTTP ${res.status}`;
    // 403 here is nearly always the one setup step people miss, so say so
    // instead of forwarding Google's rather generic wording.
    if (res.status === 403) {
      throw new GA4Error(
        `Google denied access to property ${creds.propertyId}. Add the service account (${creds.clientEmail}) as a Viewer under Admin → Property access management. (${message})`,
        403
      );
    }
    if (res.status === 429) {
      throw new GA4Error("Google Analytics is rate-limiting this property. Try again in a minute.", 429);
    }
    throw new GA4Error(`Google Analytics said: ${message}`, 502);
  }

  return payload as T;
}

/** Runs reports, five at a time — GA4's batch ceiling. */
export async function ga4BatchRunReports(
  creds: GA4Credentials,
  requests: GA4ReportRequest[]
): Promise<GA4Report[]> {
  const batches: GA4ReportRequest[][] = [];
  for (let i = 0; i < requests.length; i += BATCH_LIMIT) {
    batches.push(requests.slice(i, i + BATCH_LIMIT));
  }

  const results = await Promise.all(
    batches.map((requests) =>
      call<{ reports?: GA4Report[] }>(creds, "batchRunReports", { requests })
    )
  );

  return results.flatMap((r) => r.reports ?? []);
}

export async function ga4RunRealtimeReport(
  creds: GA4Credentials,
  request: Omit<GA4ReportRequest, "dateRanges">
): Promise<GA4Report> {
  return call<GA4Report>(creds, "runRealtimeReport", request);
}

/* ----------------------------------------------------------------- row helpers */

export function dim(row: GA4Row, index: number): string {
  return row.dimensionValues?.[index]?.value ?? "";
}

export function metric(row: GA4Row, index: number): number {
  const value = Number(row.metricValues?.[index]?.value ?? 0);
  return Number.isFinite(value) ? value : 0;
}

/** GA4 hands back `(not set)` / `(other)` for anything it could not resolve. */
export function label(value: string, fallback = "Unknown"): string {
  const trimmed = value.trim();
  if (!trimmed || /^\((not set|none|other|not provided)\)$/i.test(trimmed)) return fallback;
  return trimmed;
}

/** `20260908` → `2026-09-08`. */
export function isoDate(compact: string): string {
  return /^\d{8}$/.test(compact)
    ? `${compact.slice(0, 4)}-${compact.slice(4, 6)}-${compact.slice(6, 8)}`
    : compact;
}
