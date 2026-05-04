"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import ProjectGrid, { type ProjectGridProps } from "@/components/projects/ProjectGrid";
import { usePortfolioActions } from "@/hooks/usePortfolioActions";

type Props = Omit<ProjectGridProps, "copilot">;

/**
 * Connects `ProjectGrid` to AG-UI shared state, and — when `mfEmbed=1` without the provider
 * (copilot iframe) — reads `copilotQ`, `copilotTech`, `copilotHighlight` from the URL.
 */
export default function CopilotProjectGridBridge(props: Props) {
  const searchParams = useSearchParams();
  const { portfolio: ctx, hasCopilot } = usePortfolioActions();

  const copilot = useMemo(() => {
    const embed = searchParams.get("mfEmbed") === "1";
    const useUrl = embed && !hasCopilot;

    if (useUrl) {
      const q = searchParams.has("copilotQ") ? searchParams.get("copilotQ") : null;
      const tech = searchParams.has("copilotTech") ? searchParams.get("copilotTech") : null;
      const hi = searchParams.get("copilotHighlight");
      return {
        query: q === "" ? null : q,
        tech: tech === "" ? null : tech,
        highlightedIds: hi ? hi.split(",").filter(Boolean) : [],
      };
    }

    return {
      query: ctx.projectQuery,
      tech: ctx.projectTech,
      highlightedIds: ctx.highlightedProjectIds,
    };
  }, [searchParams, ctx.projectQuery, ctx.projectTech, ctx.highlightedProjectIds, hasCopilot]);

  return <ProjectGrid {...props} copilot={copilot} />;
}
