import { notFound, redirect } from "next/navigation";
import BlogForm from "@/components/blog/BlogForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBlogPage({ params }: Props) {
  const { id } = await params;

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !post) {
    notFound();
  }

  if (post.trashed_at) {
    redirect("/admin/blogs/trash");
  }

  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Edit Blog Post</h1>
      <BlogForm initialData={post} postId={id} />
    </main>
  );
}