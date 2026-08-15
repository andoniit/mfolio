import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { MESSAGE_MAX, PHOTO_WALL_BUCKET } from "@/lib/photo-wall";

type Patch = {
  status?: string;
  message?: string;
  sort_order?: number;
};

// Admin: approve / reject, edit the caption, or reorder a Polaroid.
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  let body: Patch;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const update: Record<string, unknown> = {};

  if (typeof body.status === "string") {
    if (!["pending", "approved", "rejected"].includes(body.status)) {
      return NextResponse.json({ error: "Invalid status." }, { status: 400 });
    }
    update.status = body.status;
    update.approved_at = body.status === "approved" ? new Date().toISOString() : null;
  }

  if (typeof body.message === "string") {
    const message = body.message.trim();
    if (!message) {
      return NextResponse.json({ error: "Message cannot be empty." }, { status: 400 });
    }
    if (message.length > MESSAGE_MAX) {
      return NextResponse.json(
        { error: `Message must be ${MESSAGE_MAX} characters or fewer.` },
        { status: 400 }
      );
    }
    update.message = message;
  }

  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    update.sort_order = Math.trunc(body.sort_order);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("photo_wall_posts")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/photo-wall");
  revalidatePath("/admin");

  return NextResponse.json(data);
}

// Admin: permanently delete a Polaroid (row + its uploaded file).
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { data: existing } = await supabaseAdmin
    .from("photo_wall_posts")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabaseAdmin.from("photo_wall_posts").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  const storagePath = (existing as { storage_path: string | null } | null)?.storage_path;
  if (storagePath) {
    const { error: removeError } = await supabaseAdmin.storage
      .from(PHOTO_WALL_BUCKET)
      .remove([storagePath]);
    // The row is already gone; a stranded file is worth a log, not a failed request.
    if (removeError) console.error("[photo-wall] file cleanup failed", removeError);
  }

  revalidatePath("/admin/photo-wall");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
