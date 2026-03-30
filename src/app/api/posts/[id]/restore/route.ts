import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateBlogCaches } from "@/lib/revalidate-blog";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("id, trashed_at, slug")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!existing.trashed_at) {
    return NextResponse.json(
      { error: "Post is not in trash" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update({ trashed_at: null })
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateBlogCaches(data?.slug ?? existing.slug);
  return NextResponse.json(data);
}