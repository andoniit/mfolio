import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import BlogPostGrid from "@/components/blog/BlogPostGrid";
import BlogListingFilters from "@/components/blog/BlogListingFilters";
import "@/app/blog/blog.scss";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function TagPage({ params }: Props) {
  const { slug } = await params;

  const [{ data: tag }, { data: categories }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("tags").select("*").eq("slug", slug).maybeSingle(),
    supabaseAdmin.from("categories").select("*").order("name"),
    supabaseAdmin.from("tags").select("*").order("name"),
  ]);

  if (!tag) notFound();

  const { data: connections } = await supabaseAdmin
    .from("post_tags")
    .select("post_id")
    .eq("tag_id", tag.id);

  const postIds = (connections || []).map((item) => item.post_id);

  if (postIds.length === 0) {
    return (
      <div className="blog-wrapper">
        <Header />
        <main className="blog-page-container">
          <div className="blog-content-max">
            <Link href="/blog" className="category-tag-back-link">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to blogs
            </Link>

            <p className="text-sm uppercase tracking-widest text-[#86868b] mb-2">Tag</p>
            <h1 className="blog-page-title">#{tag.name}</h1>

            <BlogListingFilters
              categories={categories}
              tags={tags}
              activeCategorySlug={null}
              activeTagSlug={tag.slug}
            />

            <div className="empty-state">No blog posts found.</div>
          </div>
        </main>
      </div>
    );
  }

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .in("id", postIds)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

  return (
    <div className="blog-wrapper">
      <Header />
      <main className="blog-page-container">
        <div className="blog-content-max">
          <Link href="/blog" className="category-tag-back-link">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10 19l-7-7m0 0l7-7m-7 7h18"
              />
            </svg>
            Back to blogs
          </Link>

          <p className="text-sm uppercase tracking-widest text-[#86868b] mb-2">Tag</p>
          <h1 className="blog-page-title">#{tag.name}</h1>

          <BlogListingFilters
            categories={categories}
            tags={tags}
            activeCategorySlug={null}
            activeTagSlug={tag.slug}
          />

          <BlogPostGrid posts={posts || []} />
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const { data: tag } = await supabaseAdmin
    .from("tags")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!tag) {
    return {
      title: "Tag Not Found",
    };
  }

  return {
    title: `${tag.name} Blogs`,
    description: `Read all blog posts tagged with ${tag.name}.`,
  };
}
