import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import AnimatedIntroText from "@/components/home/AnimatedIntroText";
import "./blog-post.scss";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  // 1. Fetch current post
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

  // 2. Fetch Previous Post (Older)
  const { data: prevPost } = await supabaseAdmin
    .from("posts")
    .select("title, slug")
    .eq("published", true)
    .is("trashed_at", null)
    .lt("published_at", post.published_at)
    .order("published_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // 3. Fetch Next Post (Newer)
  const { data: nextPost } = await supabaseAdmin
    .from("posts")
    .select("title, slug")
    .eq("published", true)
    .is("trashed_at", null)
    .gt("published_at", post.published_at)
    .order("published_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  // 4. Fetch Related Posts (More blogs)
  let relatedQuery = supabaseAdmin
    .from("posts")
    .select(`
      id, title, slug, cover_image_url, excerpt, published_at,
      categories ( name )
    `)
    .eq("published", true)
    .is("trashed_at", null)
    .neq("id", post.id) // Exclude current post
    .order("published_at", { ascending: false })
    .limit(3);

  if (post.category_id) {
    relatedQuery = relatedQuery.eq("category_id", post.category_id);
  }
  const { data: relatedPosts } = await relatedQuery;

  return (
    <div className="blog-post-wrapper">
      {/* FIX: Use the Header Component properly */}
      <Header /> 
      
      <article className="min-h-screen py-10 sm:py-16 font-sans text-[#1d1d1f]">
        
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          {/* Post Header */}
          <div className="mb-6 flex flex-wrap items-center gap-3">
            {post.categories?.name &&
              (post.categories.slug ? (
                <Link
                  href={`/category/${post.categories.slug}`}
                  className="post-top-category"
                >
                  {post.categories.name}
                </Link>
              ) : (
                <span className="post-top-category">
                  {post.categories.name}
                </span>
              ))}
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            <AnimatedIntroText>
              {post.title}
            </AnimatedIntroText>
          </h1>

          {post.excerpt && (
            <p className="text-xl leading-relaxed text-[#6e6e73] mb-10">
              {post.excerpt}
            </p>
          )}

          <div className="flex items-center gap-4 mb-10">
            <img
              src="/images/25.jpg"
              alt="Anirudha Kapileshwari"
              className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0"
            />
            <div className="text-[#1d1d1f]">
              <div className="flex items-center gap-2 text-[15px] text-[#4b5563]">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {post.published_at
                    ? new Date(post.published_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "Draft"}
                </span>
              </div>
              <p className="post-author-name">by Anirudha Kapileshwari</p>
            </div>
          </div>

          {/* Cover Image */}
          {post.cover_image_url && (
            <div className="w-full overflow-hidden rounded-[28px] mb-12 bg-white shadow-sm border border-gray-100">
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          {/* Tags */}
          {post.post_tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-12 border-b border-gray-200 pb-8">
              {post.post_tags.map((item: any) =>
                item.tags ? (
                  <Link
                    href={`/tag/${item.tags.slug}`}
                    key={item.tags.id}
                    className="post-tag-pill"
                  >
                    {item.tags.name}
                  </Link>
                ) : null
              )}
            </div>
          )}

          {/* The Rich Text Content */}
          <div
            className="prose prose-lg max-w-none blog-content prose-img:rounded-[24px] prose-a:text-blue-600 hover:prose-a:text-blue-500"
            dangerouslySetInnerHTML={{ __html: post.content_html }}
          />

          {/* Next / Prev Navigation */}
          {(prevPost || nextPost) && (
            <div className="post-navigation">
              {prevPost ? (
                <Link href={`/blog/${prevPost.slug}`} className="nav-card prev">
                  <span className="nav-label">Previous Post</span>
                  <span className="nav-title">{prevPost.title}</span>
                </Link>
              ) : <div />} {/* Empty div to keep grid spacing if no prev post */}

              {nextPost && (
                <Link href={`/blog/${nextPost.slug}`} className="nav-card next">
                  <span className="nav-label">Next Post</span>
                  <span className="nav-title">{nextPost.title}</span>
                </Link>
              )}
            </div>
          )}
        </div>
      </article>

      {/* More Blogs Section */}
      {relatedPosts && relatedPosts.length > 0 && (
        <section className="more-blogs-section">
          <div className="max-w-6xl mx-auto px-6 sm:px-8">
            <h2 className="section-title">More like this</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {relatedPosts.map((related: any) => (
                <Link
                  key={related.id}
                  href={`/blog/${related.slug}`}
                  className="flex flex-col group"
                >
                  <div className="w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-100 mb-5">
                    {related.cover_image_url ? (
                      <img
                        src={related.cover_image_url}
                        alt={related.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gray-200" />
                    )}
                  </div>
                  
                  {related.categories?.name && (
                    <span className="text-[11px] font-bold tracking-widest uppercase text-[#86868b] mb-2">
                      {related.categories.name}
                    </span>
                  )}
                  <h3 className="text-xl font-bold text-[#1d1d1f] group-hover:text-blue-600 transition-colors mb-2 line-clamp-2">
                    {related.title}
                  </h3>
                  <p className="text-[#6e6e73] line-clamp-2 text-sm">
                    {related.excerpt}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}