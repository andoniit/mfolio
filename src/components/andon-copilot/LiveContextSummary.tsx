"use client";

import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";

type Props = {
  rootState: PortfolioCopilotRootState;
};

export default function LiveContextSummary({ rootState }: Props) {
  const p = rootState.portfolio;
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Live context</div>
      <dl className="mt-2 space-y-1.5 text-[11px]">
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Intent</dt>
          <dd className="max-w-[65%] text-right text-zinc-200">{p.currentIntent ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Status</dt>
          <dd className="text-zinc-200">{p.assistantStatus}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Activity</dt>
          <dd className="max-w-[65%] text-right text-zinc-300">{p.agentActivityLabel ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Last tool</dt>
          <dd className="font-mono text-[10px] text-zinc-300">{p.lastToolCallName ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Filters</dt>
          <dd className="max-w-[65%] text-right text-zinc-300">
            {[p.projectQuery && `q:${p.projectQuery}`, p.projectTech && `tech:${p.projectTech}`, p.blogQuery && `blog:${p.blogQuery}`]
              .filter(Boolean)
              .join(" · ") || "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Matches</dt>
          <dd className="text-zinc-200">{p.highlightedProjectIds.length} projects</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Selected</dt>
          <dd className="font-mono text-[10px] text-zinc-300">{p.selectedProjectSlug ?? "—"}</dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-zinc-500">Cards</dt>
          <dd className="text-zinc-200">{p.generatedCards.length}</dd>
        </div>
      </dl>
    </div>
  );
}
