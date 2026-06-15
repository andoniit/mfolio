import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { isValidColor } from "@/lib/recommendations";

type Patch = {
  status?: string;
  color?: string;
  sort_order?: number;
};

// Admin: approve / reject, recolor, or reorder a recommendation.
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

  if (typeof body.color === "string") {
    if (!isValidColor(body.color)) {
      return NextResponse.json({ error: "Invalid color." }, { status: 400 });
    }
    update.color = body.color;
  }

  if (typeof body.sort_order === "number" && Number.isFinite(body.sort_order)) {
    update.sort_order = Math.trunc(body.sort_order);
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .update(update)
    .eq("id", id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/recommendations");
  revalidatePath("/admin");

  return NextResponse.json(data);
}

// Admin: permanently delete a recommendation.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error } = await supabaseAdmin.from("recommendations").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  revalidatePath("/admin/recommendations");
  revalidatePath("/admin");

  return NextResponse.json({ ok: true });
}
