import BlogForm from "@/components/blog/BlogForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function NewBlogPage() {
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("name"),
    supabaseAdmin.from("tags").select("*").order("name"),
  ]);

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Create Blog Post</h1>
      <BlogForm categories={categories || []} tags={tags || []} />
    </main>
  );
}