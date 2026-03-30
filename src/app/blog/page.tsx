import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import "./blog.scss";

export const dynamic = "force-dynamic";

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

          {/* Category Filters */}
          <div className="filter-group">
            <Link href="/blog" className={`filter-btn ${!categorySlug && !tagSlug ? "active" : ""}`}>
              All
            </Link>
            {categories?.map((category) => (
              <Link
                key={category.id}
                href={`/blog?category=${category.slug}`}
                className={`filter-btn ${categorySlug === category.slug ? "active" : ""}`}
              >
                {category.name}
              </Link>
            ))}
          </div>

          {/* Tag Filters */}
          <div className="filter-group tag-filters">
            {tags?.map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${tag.slug}`}
                className={`filter-btn small ${tagSlug === tag.slug ? "active" : ""}`}
              >
                #{tag.name}
              </Link>
            ))}
          </div>

          {/* Blog Grid */}
          {filteredPosts.length === 0 ? (
            <div className="empty-state">No blog posts found.</div>
          ) : (
            <div className="blog-grid">
              {filteredPosts.map((post: any) => (
                <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
                  
                  {/* Image & Cutout Wrapper */}
                  <div className="card-image-wrapper">
                    <div className="image-inner">
                      {post.cover_image_url ? (
                        <img src={post.cover_image_url} alt={post.title} className="card-image" />
                      ) : (
                        <div className="card-image-placeholder" />
                      )}
                    </div>
                    
                    {post.categories?.name && (
                      <div className="category-badge-container">
                        <div className="category-cutout-badge">
                          {post.categories.name}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Card Content Area (Text & Tags) */}
                  <div className="card-content">
                    <h2 className="card-title">{post.title}</h2>
                    {post.excerpt && <p className="card-excerpt">{post.excerpt}</p>}
                    
                    {/* flex and margin-top: auto pushes these perfectly to the bottom */}
                    <p className="card-date">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("en-US", {
                            month: "long", day: "numeric", year: "numeric",
                          })
                        : "Draft"}
                    </p>

                    {post.post_tags?.length > 0 && (
                      <div className="card-tags">
                        {post.post_tags.map((item: any) =>
                          item.tags ? (
                            <span key={item.tags.id} className="tag">
                              {item.tags.name}
                            </span>
                          ) : null
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}