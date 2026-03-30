import Link from "next/link";
import BlogForm from "@/components/blog/BlogForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function NewBlogPage() {
  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("name"),
    supabaseAdmin.from("tags").select("*").order("name"),
  ]);

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 font-sans">
      <div className="mb-8">
        <Link 
          href="/admin/blogs" 
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4 inline-flex items-center gap-1"
        >
          <span>&larr;</span> Back to Posts
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Create Blog Post
        </h1>
      </div>

      <BlogForm categories={categories || []} tags={tags || []} />
    </main>
  );
}