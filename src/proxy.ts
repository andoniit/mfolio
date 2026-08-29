import { NextResponse, type NextRequest } from "next/server";
import { verifyAdmin } from "@/lib/api-auth";

/**
 * Gate for every write that reaches `/api`.
 *
 * This is Next 16's `proxy` convention (what used to be `middleware`).
 *
 * The route handlers all talk to Supabase with the service-role key, which
 * bypasses row-level security — so the only thing standing between the public
 * internet and the database is this check. It deliberately fails closed: any
 * new route is protected the moment it exists, and opening one up means adding
 * it to PUBLIC_WRITE_PATHS on purpose.
 */

/** Writes the public site legitimately makes without anyone being signed in. */
const PUBLIC_WRITE_PATHS = new Set([
  "/api/photo-wall", // a visitor pins a Polaroid (lands as 'pending')
  "/api/recommendations", // a visitor leaves a sticky note (lands as 'pending')
  "/api/newsletter/subscribe",
  "/api/newsletter/unsubscribe",
  "/api/ai-copilot", // the portfolio copilot answers for visitors
]);

/** Reads are public: the site renders itself from these. Routes that can widen
 *  their results for the owner check the token themselves via isAdminRequest. */
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export const config = { matcher: "/api/:path*" };

export async function proxy(req: NextRequest) {
  if (SAFE_METHODS.has(req.method)) return NextResponse.next();

  const path = req.nextUrl.pathname.replace(/\/+$/, "");
  if (PUBLIC_WRITE_PATHS.has(path)) return NextResponse.next();

  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  return NextResponse.next();
}
