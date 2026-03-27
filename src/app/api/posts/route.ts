import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

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

  return NextResponse.json(post);
}