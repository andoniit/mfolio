import Link from "next/link";

type Post = {
  id: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  cover_image_url?: string | null;
  published_at?: string | null;
  categories?: { name?: string | null } | null;
  post_tags?: { tags?: { id: string; name: string } | null }[] | null;
};

export default function BlogPostGrid({ posts }: { posts: Post[] }) {
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

            {post.categories?.name && (
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

            {post.post_tags && post.post_tags.length > 0 && (
              <div className="card-tags">
                {post.post_tags.map((item) =>
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
  );
}
