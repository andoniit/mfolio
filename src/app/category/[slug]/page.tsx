import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import BlogPostGrid from "@/components/blog/BlogPostGrid";
import "@/app/blog/blog.scss";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("category_id", category.id)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

  return (
    <div className="blog-wrapper">
      <Header />
      <main className="blog-page-container">
        <div className="blog-content-max">
          <p className="text-sm uppercase tracking-widest text-[#86868b] mb-2">Category</p>
          <h1 className="blog-page-title">{category.name}</h1>

          <BlogPostGrid posts={posts || []} />
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return {
      title: "Category Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  return {
    title: `${category.name} Blogs`,
    description: `Read all blog posts in the ${category.name} category.`,
    alternates: {
      canonical: `/category/${category.slug}`,
    },
    openGraph: {
      title: `${category.name} Blogs | Anirudha Kapileshwari`,
      description: `Read all blog posts in the ${category.name} category.`,
      url: `/category/${category.slug}`,
      type: "website",
    },
  };
}
