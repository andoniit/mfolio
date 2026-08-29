/**
 * Admin token verification, shared by `src/middleware.ts` (which guards every
 * write) and by the GET routes that can return unpublished rows for the admin
 * dashboard and the iOS app.
 *
 * Edge-safe on purpose: plain `fetch` and string work only, no Node APIs and no
 * Supabase SDK, so `middleware.ts` can import it.
 */

export type AdminAuth =
  | { ok: true; email: string }
  | { ok: false; status: number; error: string };

export async function verifyAdmin(authHeader: string | null): Promise<AdminAuth> {
  const header = authHeader ?? "";
  const token = /^bearer /i.test(header) ? header.slice(7).trim() : "";
  if (!token) return { ok: false, status: 401, error: "Sign in to make changes." };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    console.error("[api-auth] Supabase env missing — refusing the request.");
    return { ok: false, status: 503, error: "Server is not configured for authentication." };
  }

  // Supabase validates the JWT's signature and expiry and tells us who it is.
  let email = "";
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: { apikey: anonKey, Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!res.ok) {
      return { ok: false, status: 401, error: "Your session has expired. Sign in again." };
    }
    const user = (await res.json()) as { email?: string | null };
    email = (user.email ?? "").toLowerCase();
  } catch {
    return { ok: false, status: 503, error: "Could not verify your session. Please try again." };
  }

  const allowed = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  // Being signed in is not enough: this Supabase project has open signups, so
  // anyone could mint a valid token. Without an allowlist we cannot tell the
  // owner from a stranger, so refuse rather than wave the request through.
  if (allowed.length === 0) {
    console.error(
      "[api-auth] ADMIN_EMAILS is not set — refusing. " +
        "Add ADMIN_EMAILS=you@example.com to .env.local and to your production env."
    );
    return {
      ok: false,
      status: 503,
      error: "Admin access is not configured on the server (ADMIN_EMAILS is unset).",
    };
  }

  if (!allowed.includes(email)) {
    return { ok: false, status: 403, error: "This account is not allowed to make changes." };
  }

  return { ok: true, email };
}

/**
 * For GET handlers that widen their results for the owner (drafts, pending
 * submissions, hidden items). Public reads never call this.
 */
export async function isAdminRequest(req: Request): Promise<boolean> {
  const result = await verifyAdmin(req.headers.get("authorization"));
  return result.ok;
}
