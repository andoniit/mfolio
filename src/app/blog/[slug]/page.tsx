import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const { data: post } = await supabaseAdmin
    .from("posts")
    .select("title, excerpt, cover_image_url, published, trashed_at")
    .eq("slug", slug)
    .eq("published", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!post) {
    return {
      title: "Post Not Found",
    };
  }

  return {
    title: post.title,
    description: post.excerpt || "Read this blog post.",
    openGraph: {
      title: post.title,
      description: post.excerpt || "Read this blog post.",
      images: post.cover_image_url ? [post.cover_image_url] : [],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const { data: post, error } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("slug", slug)
    .eq("published", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (error || !post) {
    notFound();
  }

  const categoryId = post.category_id || null;

  let relatedQuery = supabaseAdmin
    .from("posts")
    .select(`
      id,
      title,
      slug,
      excerpt,
      cover_image_url,
      published_at,
      categories ( id, name, slug )
    `)
    .neq("id", post.id)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false })
    .limit(3);

  if (categoryId) {
    relatedQuery = relatedQuery.eq("category_id", categoryId);
  }

  const { data: relatedPosts } = await relatedQuery;

  return (
    <article className="min-h-screen bg-[#f5f5f7] py-16 sm:py-24 font-sans text-[#1d1d1f]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        {post.cover_image_url && (
          <div className="w-full overflow-hidden rounded-[28px] mb-10 bg-white">
            <img
              src={post.cover_image_url}
              alt={post.title}
              className="w-full h-auto object-cover"
            />
          </div>
        )}

        <div className="mb-4 flex flex-wrap items-center gap-3">
          {post.categories?.name && (
            <Link
              href={`/category/${post.categories.slug}`}
              className="text-[11px] font-bold tracking-widest uppercase text-[#86868b] hover:text-black transition-colors"
            >
              {post.categories.name}
            </Link>
          )}

          {post.published_at && (
            <span className="text-sm text-[#86868b]">
              {new Date(post.published_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          )}
        </div>

        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight leading-tight mb-6">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg sm:text-xl leading-relaxed text-[#6e6e73] mb-8">
            {post.excerpt}
          </p>
        )}

        {post.post_tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-10">
            {post.post_tags.map((item: any) =>
              item.tags ? (
                <Link
                  key={item.tags.id}
                  href={`/tag/${item.tags.slug}`}
                  className="text-[12px] px-3 py-1 rounded-full border border-[#d2d2d7] bg-white text-[#6e6e73] hover:text-black hover:border-black transition-colors"
                >
                  {item.tags.name}
                </Link>
              ) : null
            )}
          </div>
        )}

        <div
          className="prose prose-neutral max-w-none prose-img:rounded-2xl prose-headings:tracking-tight prose-p:text-[#1d1d1f]"
          dangerouslySetInnerHTML={{ __html: post.content_html }}
        />

        {relatedPosts && relatedPosts.length > 0 && (
          <section className="mt-20 pt-12 border-t border-[#d2d2d7]">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-8">
              Related Posts
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="group bg-white rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300"
                >
                  {related.cover_image_url ? (
                    <div className="aspect-[16/10] overflow-hidden bg-[#e8e8ed]">
                      <img
                        src={related.cover_image_url}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                      />
                    </div>
                  ) : (
                    <div className="aspect-[16/10] bg-[#e8e8ed]" />
                  )}

                  <div className="p-5">
                    {related.categories?.name && (
                      <p className="text-[11px] font-bold tracking-widest uppercase text-[#86868b] mb-2">
                        {related.categories.name}
                      </p>
                    )}

                    <h3 className="text-lg font-semibold leading-snug mb-2">
                      {related.title}
                    </h3>

                    {related.excerpt && (
                      <p className="text-sm text-[#6e6e73] line-clamp-2">
                        {related.excerpt}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}