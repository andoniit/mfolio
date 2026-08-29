import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest } from "@/lib/api-auth";
import {
  parseRecommendationInput,
  normalizeColor,
  DEFAULT_NOTE_COLOR,
  type PublicRecommendation,
} from "@/lib/recommendations";

const PUBLIC_COLUMNS = "id, name, role, message, avatar_url, color, created_at";

function missingConfig() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

// Public: approved recommendations for the home page wall.
// `?status=all` with an admin token returns pending ones awaiting review.
export async function GET(req: Request) {
  const wantsAll = new URL(req.url).searchParams.get("status") === "all";
  const asAdmin = wantsAll && (await isAdminRequest(req));

  const columns: string = asAdmin ? "*" : PUBLIC_COLUMNS;
  let query = supabaseAdmin.from("recommendations").select(columns);

  if (!asAdmin) query = query.eq("status", "approved");

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json((data ?? []) as unknown as PublicRecommendation[]);
}

// Public: submit a recommendation. Stored as 'pending' until approved.
export async function POST(req: Request) {
  if (missingConfig()) {
    return NextResponse.json(
      {
        ok: false,
        error: "config",
        message: "Server configuration error. Please try again later.",
      },
      { status: 503 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "invalid_json", message: "Invalid request body." },
      { status: 400 }
    );
  }

  const parsed = parseRecommendationInput(body);
  if (!parsed.ok) {
    return NextResponse.json(
      { ok: false, error: "invalid_input", message: parsed.error },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .insert({
      name: parsed.value.name,
      role: parsed.value.role,
      message: parsed.value.message,
      avatar_url: parsed.value.avatar_url,
      color: normalizeColor(DEFAULT_NOTE_COLOR),
      status: "pending",
    })
    .select(PUBLIC_COLUMNS)
    .single();

  if (error) {
    console.error("[recommendations] insert failed", error);
    return NextResponse.json(
      { ok: false, error: "server", message: "Could not save your recommendation. Please try again." },
      { status: 500 }
    );
  }

  revalidatePath("/admin/recommendations");
  revalidatePath("/admin");

  return NextResponse.json({
    ok: true,
    message: "Thanks! Your note is pending review and will appear once approved.",
    recommendation: data as PublicRecommendation,
  });
}
