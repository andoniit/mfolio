import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isAdminRequest } from "@/lib/api-auth";
import { revalidateBlogCaches } from "@/lib/revalidate-blog";

export async function GET(req: Request) {
  // `?all=1` returns drafts and trashed posts too, but only for the owner —
  // the public blog keeps getting published, untrashed posts and nothing else.
  const wantsAll = new URL(req.url).searchParams.get("all") === "1";
  const isAdmin = wantsAll && (await isAdminRequest(req));

  // The admin list only needs enough to draw a row. Selecting `*` here meant
  // shipping content_json and content_html — ~75KB of post bodies — to a screen
  // that shows titles.
  const ADMIN_LIST_COLUMNS =
    "id, title, slug, excerpt, cover_image_url, published, published_at, trashed_at, category_id";

  let query = isAdmin
    ? supabaseAdmin.from("posts").select(ADMIN_LIST_COLUMNS)
    : supabaseAdmin.from("posts").select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `);

  if (!isAdmin) {
    query = query.eq("published", true).is("trashed_at", null);
  }

  const { data, error } = await query.order("published_at", {
    ascending: false,
    nullsFirst: false,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const body = await req.json();
  const { tag_ids = [], ...postData } = body;

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .insert([postData])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (tag_ids.length > 0) {
    const rows = tag_ids.map((tagId: string) => ({
      post_id: post.id,
      tag_id: tagId,
    }));

    const { error: tagsError } = await supabaseAdmin.from("post_tags").insert(rows);

    if (tagsError) {
      return NextResponse.json({ error: tagsError.message }, { status: 400 });
    }
  }

  revalidateBlogCaches(post?.slug);
  return NextResponse.json(post);
}