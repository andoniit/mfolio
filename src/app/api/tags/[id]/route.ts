import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

// Admin: delete a tag. `post_tags` rows referencing it go with it, so the
// join table is cleared first rather than relying on a cascade being present.
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const { error: linkError } = await supabaseAdmin
    .from("post_tags")
    .delete()
    .eq("tag_id", id);

  if (linkError) {
    return NextResponse.json({ error: linkError.message }, { status: 400 });
  }

  const { error } = await supabaseAdmin.from("tags").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
