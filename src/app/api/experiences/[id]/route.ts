import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { revalidateExperienceCaches } from "@/lib/revalidate-experience";
import { buildExperiencePayload } from "@/lib/experience-payload";

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json();
  const { id } = await params;

  const { data: existing, error: existingError } = await supabaseAdmin
    .from("experiences")
    .select("trashed_at, published_at")
    .eq("id", id)
    .single();

  if (existingError || !existing) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  if (existing.trashed_at) {
    return NextResponse.json(
      { error: "Experience is in trash. Restore it before editing." },
      { status: 400 }
    );
  }

  let payload;
  try {
    payload = buildExperiencePayload(body, existing.published_at);
  } catch (e: unknown) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Invalid experience data" },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from("experiences")
    .update(payload)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateExperienceCaches();
  return NextResponse.json(data);
}

/** Partial update: the publish flag and ordering, for quick edits. */
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: { published?: unknown; sort_order?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  if (typeof body.published === "boolean") {
    update.published = body.published;
    if (body.published) {
      // Keep the original date if there already is one.
      const { data: current } = await supabaseAdmin
        .from("experiences")
        .select("published_at")
        .eq("id", id)
        .maybeSingle();
      if (!current?.published_at) update.published_at = new Date().toISOString();
    }
  }
  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    update.sort_order = Math.trunc(body.sort_order);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("experiences")
    .update(update)
    .eq("id", id)
    .is("trashed_at", null)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateExperienceCaches();
  return NextResponse.json(data);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: experience, error: fetchError } = await supabaseAdmin
    .from("experiences")
    .select("id, trashed_at")
    .eq("id", id)
    .single();

  if (fetchError || !experience) {
    return NextResponse.json({ error: "Experience not found" }, { status: 404 });
  }

  if (!experience.trashed_at) {
    const { error } = await supabaseAdmin
      .from("experiences")
      .update({
        trashed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidateExperienceCaches();
    return NextResponse.json({ success: true, action: "trashed" });
  }

  const { error } = await supabaseAdmin.from("experiences").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidateExperienceCaches();
  return NextResponse.json({ success: true, action: "deleted_permanently" });
}
