import { supabaseAdmin } from "@/lib/supabase-admin";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name");

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Manage Categories</h1>
      <CategoryManager categories={categories || []} />
    </main>
  );
}