import { revalidatePath } from "next/cache";

export function revalidateExperienceCaches() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/experience");
  revalidatePath("/admin/experience/trash");
  revalidatePath("/admin/volunteer");
  revalidatePath("/admin/volunteer/trash");
}
