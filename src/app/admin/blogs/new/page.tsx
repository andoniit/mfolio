import BlogForm from "@/components/blog/BlogForm";

export default function NewBlogPage() {
  return (
    <main className="max-w-4xl mx-auto px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Create Blog Post</h1>
      <BlogForm />
    </main>
  );
}