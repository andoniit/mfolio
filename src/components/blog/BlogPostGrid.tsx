import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
  categories?: { name?: string | null } | null;
};

export default function BlogPostGrid({
  posts,
  showCategoryBadge = true,
}: {
  posts: Post[];
  showCategoryBadge?: boolean;
}) {
  if (!posts.length) {
    return <div className="empty-state">No blog posts found.</div>;
  }

  return (
    <div className="blog-grid">
      {posts.map((post) => (
        <Link key={post.id} href={`/blog/${post.slug}`} className="blog-card">
          <div className="card-image-wrapper">
            <div className="image-inner">
              {post.cover_image_url ? (
                <img src={post.cover_image_url} alt={post.title} className="card-image" />
              ) : (
                <div className="card-image-placeholder" />
              )}
            </div>

            {showCategoryBadge && post.categories?.name && (
              <div className="category-badge-container">
                <div className="category-cutout-badge">{post.categories.name}</div>
              </div>
            )}
          </div>

          <div className="card-content">
            <h2 className="card-title">{post.title}</h2>
            {post.excerpt && <p className="card-excerpt">{post.excerpt}</p>}

            <p className="card-date">
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })
                : "Draft"}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
