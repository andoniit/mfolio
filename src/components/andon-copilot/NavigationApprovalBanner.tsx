"use client";

import { useAICopilotContext } from "@/context/AICopilotContext";

export default function NavigationApprovalBanner() {
  const { pendingAgentNavigation, approvePendingAgentNavigation, dismissPendingAgentNavigation } =
    useAICopilotContext();

  if (!pendingAgentNavigation) return null;

  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-md">
      <p className="text-sm font-medium text-amber-100">Navigation request</p>
      <p className="mt-1 text-xs leading-relaxed text-amber-200/80">
        The agent wants to open <code className="rounded bg-black/30 px-1 font-mono">{pendingAgentNavigation}</code>{" "}
        in your live preview. Continue?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={approvePendingAgentNavigation}
          className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-900 hover:bg-zinc-200"
        >
          Approve
        </button>
        <button
          type="button"
          onClick={dismissPendingAgentNavigation}
          className="rounded-lg border border-white/20 px-4 py-2 text-xs font-medium text-zinc-200 hover:bg-white/5"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
