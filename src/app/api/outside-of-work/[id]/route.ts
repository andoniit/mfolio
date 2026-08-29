import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { OUTSIDE_BUCKET, parseOutsideItemInput } from "@/lib/outside-of-work";

// Admin: edit one item, toggle publish, or reorder it.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const parsed = parseOutsideItemInput(body, { partial: true });
  if (!parsed.ok) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const update = { ...parsed.value, updated_at: new Date().toISOString() };
  if (Object.keys(parsed.value).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("outside_of_work_items")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/outside-of-work");
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json(data);
}

// Admin: delete an item (row + its uploaded image, when we own the file).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("outside_of_work_items")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("outside_of_work_items").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const storagePath = (existing as { storage_path: string | null } | null)?.storage_path;
  if (storagePath) {
    const { error: removeError } = await supabaseAdmin.storage
      .from(OUTSIDE_BUCKET)
      .remove([storagePath]);
    // The row is already gone; a stranded file is worth a log, not a failed request.
    if (removeError) console.error("[outside-of-work] file cleanup failed", removeError);
  }

  revalidatePath("/admin/outside-of-work");
  revalidatePath("/admin");
  revalidatePath("/");

  return NextResponse.json({ ok: true });
}
