import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateProjectCaches } from "@/lib/revalidate-project";

function normalizeHomeFeatureOrder(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number.parseInt(String(value), 10);
  if (!Number.isFinite(parsed) || parsed < 1 || parsed > 4) {
    throw new Error("Home feature order must be 1, 2, 3, 4, or empty");
  }
  return parsed;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id } = await params;
    const nextOrder = normalizeHomeFeatureOrder(body?.home_feature_order);

    // If assigning a slot, clear any other project currently using it.
    if (nextOrder !== null) {
      const { error: clearError } = await supabaseAdmin
        .from("projects")
        .update({ home_feature_order: null, updated_at: new Date().toISOString() })
        .eq("home_feature_order", nextOrder)
        .neq("id", id);

      if (clearError) {
        return NextResponse.json({ error: clearError.message }, { status: 400 });
      }
    }

    const { data, error } = await supabaseAdmin
      .from("projects")
      .update({ home_feature_order: nextOrder, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select("id, slug, home_feature_order")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateProjectCaches(data?.slug);
    return NextResponse.json(data);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to update home feature order" },
      { status: 400 }
    );
  }
}

