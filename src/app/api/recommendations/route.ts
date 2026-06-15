import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  parseRecommendationInput,
  normalizeColor,
  DEFAULT_NOTE_COLOR,
  type PublicRecommendation,
} from "@/lib/recommendations";

const PUBLIC_COLUMNS = "id, name, role, message, color, created_at";

function missingConfig() {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  );
}

// Public: approved recommendations for the home page wall.
export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select(PUBLIC_COLUMNS)
    .eq("status", "approved")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json((data ?? []) as PublicRecommendation[]);
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
