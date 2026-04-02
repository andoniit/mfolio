import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateProjectCaches } from "@/lib/revalidate-project";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("projects")
    .select("id, trashed_at, slug")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  if (!existing.trashed_at) {
    return NextResponse.json({ error: "Project is not in trash" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("projects")
    .update({ trashed_at: null, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateProjectCaches(data?.slug ?? existing.slug);
  return NextResponse.json(data);
}
