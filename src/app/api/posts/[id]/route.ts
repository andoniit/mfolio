import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;
  const { tag_ids = [], ...postData } = body;

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(postData)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const { error: deleteTagsError } = await supabaseAdmin
    .from("post_tags")
    .delete()
    .eq("post_id", id);

  if (deleteTagsError) {
    return NextResponse.json({ error: deleteTagsError.message }, { status: 400 });
  }

  if (tag_ids.length > 0) {
    const rows = tag_ids.map((tagId: string) => ({
      post_id: id,
      tag_id: tagId,
    }));

    const { error: insertTagsError } = await supabaseAdmin
      .from("post_tags")
      .insert(rows);

    if (insertTagsError) {
      return NextResponse.json({ error: insertTagsError.message }, { status: 400 });
    }
  }

  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: post, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("id, trashed_at")
    .eq("id", id)
    .single();

  if (fetchError || !post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (!post.trashed_at) {
    const { error } = await supabaseAdmin
      .from("posts")
      .update({ trashed_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, action: "trashed" });
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true, action: "deleted_permanently" });
}