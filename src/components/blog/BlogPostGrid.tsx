"use client";

import Link from "next/link";
import clsx from "clsx";
import { useLayoutEffect, useMemo, useRef } from "react";
import { gsap } from "gsap";

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
  copilot,
}: {
  posts: Post[];
  showCategoryBadge?: boolean;
  /** Optional filters driven by the portfolio copilot (AG-UI shared state). */
  copilot?: {
    filteredPostIds: string[] | null;
    highlightedBlogPostIds: string[];
  };
}) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  const visiblePosts = useMemo(() => {
    const ids = copilot?.filteredPostIds;
    if (!ids) return posts;
    if (ids.length === 0) return [];
    const set = new Set(ids);
    return posts.filter((p) => set.has(p.id));
  }, [posts, copilot?.filteredPostIds]);

  const highlightSet = useMemo(
    () => new Set(copilot?.highlightedBlogPostIds ?? []),
    [copilot?.highlightedBlogPostIds]
  );

  useLayoutEffect(() => {
    if (!gridRef.current || visiblePosts.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".blog-card",
        { autoAlpha: 0, y: 42 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.05,
          stagger: 0.11,
          ease: "expo.out",
          clearProps: "opacity,transform,visibility",
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [visiblePosts]);

  if (!posts.length) {
    return <div className="empty-state">No blog posts found.</div>;
  }

  if (!visiblePosts.length) {
    return <div className="empty-state">No blog posts match the copilot filter.</div>;
  }

  return (
    <div ref={gridRef} className="blog-grid">
      {visiblePosts.map((post) => (
        <Link
          key={post.id}
          href={`/blog/${post.slug}`}
          data-post-id={post.id}
          className={clsx("blog-card", highlightSet.has(post.id) && "copilot-card-highlight")}
        >
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
