import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Block deletion if this category is still assigned to at least one post.
  const { count: postsCount, error: postsCountError } = await supabaseAdmin
    .from("posts")
    .select("*", { count: "exact", head: true })
    .eq("category_id", id);

  if (postsCountError) {
    return NextResponse.json({ error: postsCountError.message }, { status: 400 });
  }

  if ((postsCount || 0) > 0) {
    return NextResponse.json(
      { error: "Cannot delete category: it is assigned to posts." },
      { status: 400 }
    );
  }

  const { error: deleteError } = await supabaseAdmin
    .from("categories")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json({ error: deleteError.message }, { status: 400 });
  }

  // Invalidate admin + public blog pages.
  revalidatePath("/admin/categories");
  revalidatePath("/blog");

  return NextResponse.json({ success: true });
}

