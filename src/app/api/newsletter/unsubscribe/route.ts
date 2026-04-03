import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

function siteUrlFromRequest(req: Request): string {
  try {
    const u = new URL(req.url);
    return u.origin;
  } catch {
    return "";
  }
}

/** GET: one-click unsubscribe from email links (redirects to home with query). */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token")?.trim();
  const origin = siteUrlFromRequest(req);

  const redirect = (path: string) =>
    NextResponse.redirect(new URL(path, origin || "http://localhost:3000"));

  if (!token) {
    return redirect("/?newsletter=error&reason=missing_token");
  }

  const { data: row, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !row) {
    return redirect("/?newsletter=error&reason=invalid_token");
  }

  if (row.status === "unsubscribed") {
    return redirect("/?newsletter=already_unsubscribed");
  }

  const { error: updateError } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateError) {
    return redirect("/?newsletter=error&reason=server");
  }

  revalidatePath("/admin/newsletter");
  revalidatePath("/admin");
  return redirect("/?newsletter=unsubscribed");
}

/** POST: same logic, JSON response (for fetch clients). */
export async function POST(req: Request) {
  let token: string | undefined;
  try {
    const body = await req.json();
    token = typeof body.token === "string" ? body.token.trim() : undefined;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  if (!token) {
    return NextResponse.json({ ok: false, error: "missing_token" }, { status: 400 });
  }

  const { data: row, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, status")
    .eq("unsubscribe_token", token)
    .maybeSingle();

  if (error || !row) {
    return NextResponse.json({ ok: false, error: "invalid_token" }, { status: 404 });
  }

  if (row.status === "unsubscribed") {
    return NextResponse.json({ ok: true, alreadyUnsubscribed: true });
  }

  const { error: updateError } = await supabaseAdmin
    .from("newsletter_subscribers")
    .update({
      status: "unsubscribed",
      unsubscribed_at: new Date().toISOString(),
    })
    .eq("id", row.id);

  if (updateError) {
    return NextResponse.json({ ok: false, error: "server" }, { status: 500 });
  }

  revalidatePath("/admin/newsletter");
  revalidatePath("/admin");
  return NextResponse.json({ ok: true });
}
