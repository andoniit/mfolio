import { notFound } from "next/navigation";
import { supabase } from "@/lib/supabase";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const { data: post, error } = await supabase
    .from("posts")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  return (
    <article className="max-w-3xl mx-auto px-6 py-16">
      {post.cover_image_url && (
        <img
          src={post.cover_image_url}
          alt={post.title}
          className="w-full h-auto rounded-xl mb-8"
        />
      )}

      <p className="text-sm text-neutral-500 mb-2">
        {post.published_at
          ? new Date(post.published_at).toLocaleDateString()
          : ""}
      </p>

      <h1 className="text-4xl font-bold mb-6">{post.title}</h1>

      <div
        className="prose prose-neutral max-w-none"
        dangerouslySetInnerHTML={{ __html: post.content_html }}
      />
    </article>
  );
}