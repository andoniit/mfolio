import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { verifyAdmin } from "@/lib/api-auth";

/**
 * Admin: the subscriber list.
 *
 * Unlike the other GETs this one is not public at all — these are real email
 * addresses, so it refuses rather than falling back to a public view.
 */
export async function GET(req: Request) {
  const auth = await verifyAdmin(req.headers.get("authorization"));
  if (!auth.ok) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const { data, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, email, name, status, source, subscribed_at, unsubscribed_at")
    .order("subscribed_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}
