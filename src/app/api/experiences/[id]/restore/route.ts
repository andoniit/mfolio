import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateExperienceCaches } from "@/lib/revalidate-experience";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("experiences")
    .select("id, trashed_at")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  if (!existing.trashed_at) {
    return NextResponse.json({ error: "Experience is not in trash" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("experiences")
    .update({ trashed_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateExperienceCaches();
  return NextResponse.json(data);
}
