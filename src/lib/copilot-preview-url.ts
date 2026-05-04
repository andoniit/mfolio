import type { PortfolioCopilotState } from "@/lib/ai/portfolioCopilotState";

/**
 * Build the same-origin URL for the copilot preview iframe so embedded pages
 * can mirror filters via query params (the iframe has no `AICopilotProvider`).
 * Returns `null` when there is nothing to mirror — caller should not overwrite the iframe.
 */
export function buildCopilotPreviewUrl(portfolio: PortfolioCopilotState, origin: string): string | null {
  const blogIds = portfolio.filteredBlogPostIds;
  const blogActive =
    !!(portfolio.blogQuery && portfolio.blogQuery.trim()) || !!(blogIds && blogIds.length > 0);

  if (blogActive) {
    const sp = new URLSearchParams();
    sp.set("mfEmbed", "1");
    if (portfolio.blogQuery?.trim()) sp.set("copilotBlogQ", portfolio.blogQuery.trim());
    if (blogIds && blogIds.length > 0) sp.set("copilotBlogIds", blogIds.join(","));
    return `${origin}/blog?${sp.toString()}`;
  }

  const projectActive =
    !!(portfolio.projectQuery && portfolio.projectQuery.trim()) ||
    !!(portfolio.projectTech && portfolio.projectTech.trim()) ||
    portfolio.highlightedProjectIds.length > 0;

  if (projectActive) {
    const sp = new URLSearchParams();
    sp.set("mfEmbed", "1");
    if (portfolio.projectQuery?.trim()) sp.set("copilotQ", portfolio.projectQuery.trim());
    if (portfolio.projectTech?.trim()) sp.set("copilotTech", portfolio.projectTech.trim());
    if (portfolio.highlightedProjectIds.length > 0) {
      sp.set("copilotHighlight", portfolio.highlightedProjectIds.join(","));
    }
    return `${origin}/projects?${sp.toString()}`;
  }

  return null;
}

export function previewUrlsEquivalent(a: string, b: string): boolean {
  try {
    const ua = new URL(a);
    const ub = new URL(b);
    return ua.pathname === ub.pathname && ua.search === ub.search;
  } catch {
    return a === b;
  }
}
