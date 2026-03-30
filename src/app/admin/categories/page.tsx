import { supabaseAdmin } from "@/lib/supabase-admin";
import CategoryManager from "@/components/admin/CategoryManager";

export default async function AdminCategoriesPage() {
  const { data: categories } = await supabaseAdmin
    .from("categories")
    .select("*")
    .order("name");

  const { data: posts, error: postsError } = await supabaseAdmin
    .from("posts")
    .select("category_id")
    .not("category_id", "is", null);

  if (postsError) {
    return (
      <main className="max-w-4xl mx-auto px-6 py-16">
        <h1 className="text-3xl font-bold mb-8">Manage Categories</h1>
        <div className="text-red-500 text-sm">Failed to load category usage.</div>
      </main>
    );
  }

  const counts = new Map<string, number>();
  for (const post of posts || []) {
    if (!post?.category_id) continue;
    counts.set(post.category_id, (counts.get(post.category_id) || 0) + 1);
  }

  const categoriesWithCounts = (categories || []).map((c: any) => ({
    ...c,
    postCount: counts.get(c.id) || 0,
  }));

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Manage Categories</h1>
      <CategoryManager categories={categoriesWithCounts} />
    </main>
  );
}