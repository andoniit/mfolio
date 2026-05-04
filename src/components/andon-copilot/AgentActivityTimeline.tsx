"use client";

import clsx from "clsx";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";

type Props = {
  rootState: PortfolioCopilotRootState;
  isRunning: boolean;
};

export default function AgentActivityTimeline({ rootState, isRunning }: Props) {
  const p = rootState.portfolio;
  const steps: { key: string; label: string; sub?: string; state: "pending" | "active" | "done" }[] = [];

  steps.push({
    key: "think",
    label: "Agent",
    sub: p.agentActivityLabel || (isRunning ? "Working…" : p.assistantStatus === "idle" ? "Ready" : p.assistantStatus),
    state: isRunning ? "active" : "done",
  });

  const tools = [...p.lastToolResults].reverse().slice(0, 6);
  for (const t of tools) {
    steps.push({
      key: t.name + t.summary,
      label: t.name,
      sub: t.summary,
      state: "done",
    });
  }

  if (p.generatedCards.length > 0) {
    steps.push({
      key: "cards",
      label: "Generative UI",
      sub: `${p.generatedCards.length} card(s) in shared state`,
      state: "done",
    });
  }

  if (!isRunning && p.assistantStatus !== "error" && p.lastToolResults.length > 0) {
    steps.push({ key: "fin", label: "Finished", sub: "Run complete", state: "done" });
  }

  if (p.assistantStatus === "error") {
    steps.push({
      key: "err",
      label: "Error",
      sub: p.errorMessage ?? "Run failed",
      state: "pending",
    });
  }

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-md">
      <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Agent activity</div>
      <ol className="mt-2 space-y-2">
        {steps.map((s, i) => (
          <li key={`${s.key}-${i}`} className="flex gap-2 text-xs">
            <span
              className={clsx(
                "mt-0.5 h-2 w-2 shrink-0 rounded-full",
                s.state === "active" && "bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.6)]",
                s.state === "done" && "bg-zinc-500",
                s.state === "pending" && "bg-red-400"
              )}
            />
            <div className="min-w-0">
              <div className="font-medium text-zinc-200">{s.label}</div>
              {s.sub ? <div className="text-[11px] leading-snug text-zinc-500">{s.sub}</div> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
