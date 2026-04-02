import { revalidatePath } from "next/cache";

/** Invalidate public blog listing, a single post, and admin blog views. */
export function revalidateBlogCaches(slug?: string | null) {
  revalidatePath("/blog");
  if (slug) {
    revalidatePath(`/blog/${slug}`);
  }
  revalidatePath("/admin");
  revalidatePath("/admin/blogs");
  revalidatePath("/admin/blogs/trash");
}
