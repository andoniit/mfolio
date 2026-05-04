"use client";

import type { ReactNode } from "react";
import clsx from "clsx";

type Props = {
  preview: ReactNode;
  /** Single copilot rail: activity, prompts, chat, context, inspector */
  rail: ReactNode;
};

/**
 * AG-UI showcase shell: large live preview + one scrollable copilot column (dark glass).
 */
export default function CopilotLayout({ preview, rail }: Props) {
  return (
    <div className="relative flex h-[100dvh] max-h-[100dvh] flex-col overflow-hidden bg-zinc-950 text-zinc-100">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <section
          className={clsx(
            "flex min-h-0 min-w-0 flex-col border-white/10 lg:min-h-0 lg:flex-1 lg:border-r",
            "h-[min(48dvh,520px)] min-h-[240px] shrink-0 border-b lg:h-auto lg:min-h-0 lg:shrink"
          )}
          aria-label="Live portfolio preview"
        >
          {preview}
        </section>
        <section
          className="flex min-h-0 w-full min-w-0 flex-1 flex-col border-white/10 bg-zinc-950 lg:w-[min(400px,40vw)] lg:max-w-[440px] lg:flex-none"
          aria-label="Portfolio copilot"
        >
          {rail}
        </section>
      </div>
    </div>
  );
}
