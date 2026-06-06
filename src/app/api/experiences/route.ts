import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateExperienceCaches } from "@/lib/revalidate-experience";
import { buildExperiencePayload, parsePositiveInt } from "@/lib/experience-payload";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = parsePositiveInt(searchParams.get("limit"), 100);
  const category = searchParams.get("category");

  let query = supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("published", true)
    .is("trashed_at", null);

  if (category === "work" || category === "volunteer") {
    query = query.eq("category", category);
  }

  const { data, error } = await query
    .order("sort_order", { ascending: true })
    .order("start_date", { ascending: false, nullsFirst: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  const body = await req.json();

  let payload;
  try {
    payload = buildExperiencePayload(body, null);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid experience data" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("experiences")
    .insert([payload])
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateExperienceCaches();
  return NextResponse.json(data);
}
