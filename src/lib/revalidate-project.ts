import { revalidatePath } from "next/cache";

export function revalidateProjectCaches(slug?: string | null) {
  revalidatePath("/projects");
  if (slug) {
    revalidatePath(`/projects/${slug}`);
  }
  revalidatePath("/admin/projects");
  revalidatePath("/admin/projects/trash");
}
