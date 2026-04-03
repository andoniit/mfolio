import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  logNewsletterDbError,
  userFacingNewsletterError,
} from "@/lib/supabase-newsletter-errors";
import { isValidEmailFormat, normalizeEmail } from "@/lib/newsletter";

export type SubscribeResultCode =
  | "subscribed"
  | "already_subscribed"
  | "reactivated";

export async function POST(req: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() || !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()) {
    console.error("[newsletter] Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    return NextResponse.json(
      {
        ok: false,
        error: "config",
        message: "Server configuration error. Add SUPABASE_SERVICE_ROLE_KEY to your environment.",
      },
      { status: 503 }
    );
  }

  let body: { email?: string; name?: string | null };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const raw = typeof body.email === "string" ? body.email : "";
  if (!raw.trim()) {
    return NextResponse.json(
      { ok: false, error: "missing_email", message: "Please enter your email address." },
      { status: 400 }
    );
  }

  if (!isValidEmailFormat(raw)) {
    return NextResponse.json(
      {
        ok: false,
        error: "invalid_email",
        message: "Please enter a valid email address.",
      },
      { status: 400 }
    );
  }

  const email = normalizeEmail(raw);
  const name =
    typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 200) : null;
  const source = "footer";

  const { data: existing, error: findError } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, status, email")
    .eq("email", email)
    .maybeSingle();

  if (findError) {
    logNewsletterDbError("subscribe select", findError);
    return NextResponse.json(
      {
        ok: false,
        error: "server",
        message: userFacingNewsletterError(findError),
        ...(process.env.NODE_ENV === "development" && { debug: findError.message }),
      },
      { status: 500 }
    );
  }

  if (existing) {
    if (existing.status === "active") {
      return NextResponse.json({
        ok: true,
        code: "already_subscribed" as const,
        message: "You're already subscribed.",
      });
    }

    const { error: updateError } = await supabaseAdmin
      .from("newsletter_subscribers")
      .update({
        status: "active",
        name,
        source,
        subscribed_at: new Date().toISOString(),
        unsubscribed_at: null,
      })
      .eq("id", existing.id);

    if (updateError) {
      logNewsletterDbError("subscribe reactivate", updateError);
      return NextResponse.json(
        {
          ok: false,
          error: "server",
          message: userFacingNewsletterError(updateError),
          ...(process.env.NODE_ENV === "development" && { debug: updateError.message }),
        },
        { status: 500 }
      );
    }

    revalidatePath("/admin/newsletter");
    revalidatePath("/admin");
    return NextResponse.json({
      ok: true,
      code: "reactivated" as const,
      message: "Thanks — you're back on the list.",
    });
  }

  const { error: insertError } = await supabaseAdmin.from("newsletter_subscribers").insert({
    email,
    name,
    status: "active",
    source,
    subscribed_at: new Date().toISOString(),
  });

  if (insertError) {
    if (insertError.code === "23505") {
      return NextResponse.json({
        ok: true,
        code: "already_subscribed" as const,
        message: "You're already subscribed.",
      });
    }
    logNewsletterDbError("subscribe insert", insertError);
    return NextResponse.json(
      {
        ok: false,
        error: "server",
        message: userFacingNewsletterError(insertError),
        ...(process.env.NODE_ENV === "development" && { debug: insertError.message }),
      },
      { status: 500 }
    );
  }

  revalidatePath("/admin/newsletter");
  revalidatePath("/admin");
  return NextResponse.json({
    ok: true,
    code: "subscribed" as const,
    message: "Thanks — you're on the list.",
  });
}
