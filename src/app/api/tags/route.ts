import { NextResponse } from "next/server";
import slugify from "slugify";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const body = await req.json();
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  const slug = slugify(name, { lower: true, strict: true });

  const { data, error } = await supabaseAdmin
    .from("tags")
    .insert([{ name, slug }])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}