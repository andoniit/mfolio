"use client";

import { useEffect, useMemo, useRef } from "react";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";
import { getCopilotPortfolioIframe } from "@/lib/copilot-portfolio-preview";
import { buildCopilotPreviewUrl, previewUrlsEquivalent } from "@/lib/copilot-preview-url";

type Props = {
  rootState: PortfolioCopilotRootState;
};

/**
 * Points the preview iframe at `/projects` or `/blog` with `copilot*` query params
 * so embedded pages mirror AG-UI filters (no `AICopilotProvider` inside the iframe).
 */
export default function CopilotPreviewStateSync({ rootState }: Props) {
  const p = rootState.portfolio;
  const syncKey = useMemo(
    () =>
      JSON.stringify({
        pq: p.projectQuery,
        pt: p.projectTech,
        hi: p.highlightedProjectIds,
        bq: p.blogQuery,
        bid: p.filteredBlogPostIds,
      }),
    [p.projectQuery, p.projectTech, p.highlightedProjectIds, p.blogQuery, p.filteredBlogPostIds]
  );

  const hadActiveMirror = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const iframe = getCopilotPortfolioIframe();
    if (!iframe) return;

    const origin = window.location.origin;
    const next = buildCopilotPreviewUrl(rootState.portfolio, origin);
    const current = iframe.src || "";

    if (next === null) {
      if (hadActiveMirror.current) {
        hadActiveMirror.current = false;
        try {
          const cur = new URL(current || `${origin}/`, origin);
          const basePath = cur.pathname.startsWith("/projects")
            ? "/projects"
            : cur.pathname.startsWith("/blog")
              ? "/blog"
              : "/";
          const u = new URL(basePath, origin);
          u.searchParams.set("mfEmbed", "1");
          const desired = `${u.pathname}${u.search}`;
          if (!previewUrlsEquivalent(current, desired)) {
            iframe.src = desired;
          }
        } catch {
          /* ignore */
        }
      }
      return;
    }

    hadActiveMirror.current = true;
    if (!previewUrlsEquivalent(current, next)) {
      iframe.src = next;
    }
  }, [syncKey, rootState.portfolio]);

  return null;
}
