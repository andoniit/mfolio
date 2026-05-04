"use client";

import Link from "next/link";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";
import CopilotPreviewStateSync from "./CopilotPreviewStateSync";

type Props = {
  rootState: PortfolioCopilotRootState;
};

export default function CopilotPreviewPanel({ rootState }: Props) {
  return (
    <div className="flex h-full min-h-0 min-w-0 flex-col border-white/10 bg-zinc-900/50">
      <CopilotPreviewStateSync rootState={rootState} />
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-zinc-900 px-3 py-2">
        <h2 className="text-xs font-medium text-zinc-300">Preview</h2>
        <Link href="/" className="text-[11px] text-zinc-500 hover:text-zinc-300">
          Open site
        </Link>
      </header>
      <div className="relative min-h-0 flex-1 bg-black/40">
        <iframe
          data-copilot-portfolio-preview="true"
          title="Portfolio preview"
          src="/?mfEmbed=1"
          className="absolute inset-0 h-full w-full border-0"
        />
      </div>
    </div>
  );
}
