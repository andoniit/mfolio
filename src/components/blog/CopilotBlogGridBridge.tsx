"use client";

import type { ComponentProps } from "react";
import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import BlogPostGrid from "@/components/blog/BlogPostGrid";
import { usePortfolioActions } from "@/hooks/usePortfolioActions";

type Post = ComponentProps<typeof BlogPostGrid>["posts"][number];

/**
 * Connects blog grid to AG-UI state; in `mfEmbed=1` iframe reads `copilotBlogIds` / `copilotBlogQ` from URL.
 */
export default function CopilotBlogGridBridge({
  posts,
  showCategoryBadge = true,
}: {
  posts: Post[];
  showCategoryBadge?: boolean;
}) {
  const searchParams = useSearchParams();
  const { portfolio: ctx, hasCopilot } = usePortfolioActions();

  const copilot = useMemo(() => {
    const embed = searchParams.get("mfEmbed") === "1";
    const useUrl = embed && !hasCopilot;

    if (useUrl) {
      const idsRaw = searchParams.get("copilotBlogIds");
      const filteredPostIds =
        idsRaw !== null ? (idsRaw === "" ? [] : idsRaw.split(",").filter(Boolean)) : null;
      const hi = searchParams.get("copilotBlogHighlight");
      return {
        filteredPostIds,
        highlightedBlogPostIds: hi ? hi.split(",").filter(Boolean) : [],
      };
    }

    return {
      filteredPostIds: ctx.filteredBlogPostIds,
      highlightedBlogPostIds: ctx.highlightedBlogPostIds,
    };
  }, [searchParams, ctx.filteredBlogPostIds, ctx.highlightedBlogPostIds, hasCopilot]);

  return (
    <BlogPostGrid
      posts={posts}
      showCategoryBadge={showCategoryBadge}
      copilot={copilot}
    />
  );
}
