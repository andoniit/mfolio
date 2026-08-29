import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateBlogCaches } from "@/lib/revalidate-blog";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;
  const {
    tag_ids = [],
    trashed_at: _ignoredTrash,
    id: _ignoredBodyId,
    ...postData
  } = body;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("posts")
    .select("trashed_at")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  if (existing.trashed_at) {
    return NextResponse.json(
      { error: "Post is in trash. Restore it from Trash before editing." },
      { status: 400 }
    );
  }

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

  revalidateBlogCaches(data?.slug);

  return NextResponse.json(data);
}

/**
 * Partial update — currently just the publish flag, for the iOS app and any
 * quick toggle. Deliberately separate from PUT: PUT rewrites `post_tags` from
 * the request body, so using it to flip one boolean would strip every tag.
 */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { published?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  if (typeof body.published !== "boolean") {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const update: Record<string, unknown> = { published: body.published };

  // Stamp the publish date only the first time. Re-publishing something that
  // already has a date must keep it, or the ordering silently changes.
  if (body.published) {
    const { data: current } = await supabaseAdmin
      .from("posts")
      .select("published_at")
      .eq("id", id)
      .maybeSingle();
    if (!current?.published_at) update.published_at = new Date().toISOString();
  }

  const { data, error } = await supabaseAdmin
    .from("posts")
    .update(update)
    .eq("id", id)
    .is("trashed_at", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateBlogCaches(data?.slug);
  return NextResponse.json(data);
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: post, error: fetchError } = await supabaseAdmin
    .from("posts")
    .select("id, trashed_at, slug")
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

    revalidateBlogCaches(post.slug);
    return NextResponse.json({ success: true, action: "trashed" });
  }

  const { error } = await supabaseAdmin
    .from("posts")
    .delete()
    .eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateBlogCaches(post.slug);
  return NextResponse.json({ success: true, action: "deleted_permanently" });
}