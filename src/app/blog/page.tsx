import { Suspense } from "react";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import CopilotBlogGridBridge from "@/components/blog/CopilotBlogGridBridge";
import BlogListingFilters from "@/components/blog/BlogListingFilters";
import "./blog.scss";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Blog",
  description:
    "Read engineering notes, practical guides, and development insights by Anirudha Kapileshwari.",
  alternates: {
    canonical: "/blog",
  },
  openGraph: {
    title: "Blog | Anirudha Kapileshwari",
    description:
      "Read engineering notes, practical guides, and development insights by Anirudha Kapileshwari.",
    type: "website",
    url: "/blog",
  },
};

type Props = {
  searchParams: Promise<{
    category?: string;
    tag?: string;
  }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category;
  const tagSlug = params.tag;

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("name"),
    supabaseAdmin.from("tags").select("*").order("name"),
  ]);

  let query = supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

  if (categorySlug) {
    const { data: categoryMatch } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (categoryMatch) {
      query = query.eq("category_id", categoryMatch.id);
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: posts, error } = await query;

  if (error) {
    throw new Error("Failed to fetch posts");
  }

  let filteredPosts = posts || [];

  if (tagSlug) {
    filteredPosts = filteredPosts.filter((post: any) =>
      post.post_tags?.some((item: any) => item.tags?.slug === tagSlug)
    );
  }

  return (
    <div className="blog-wrapper">
      <Header />
      <main className="blog-page-container">
        <div className="blog-content-max">
          <h1 className="blog-page-title">Blog</h1>

          <BlogListingFilters
            categories={categories}
            tags={tags}
            activeCategorySlug={categorySlug}
            activeTagSlug={tagSlug}
            showTags={false}
          />

          <Suspense
            fallback={<p className="blog-page-title text-base font-normal text-neutral-500">Loading posts…</p>}
          >
            <CopilotBlogGridBridge posts={filteredPosts} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}