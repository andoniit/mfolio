"use client";

import SuggestedPrompts from "./SuggestedPrompts";
import SkillTag from "./SkillTag";

const SKILL_FILTERS = ["React", "Next.js", "GSAP", "Three.js", "AI", "Supabase"] as const;

type Props = {
  onSendPrompt: (text: string) => void;
  isRunning: boolean;
  /** Strip full-height rail chrome; use inside a scroll region or drawer */
  variant?: "rail" | "embedded";
};

export default function CopilotSidebar({ onSendPrompt, isRunning, variant = "rail" }: Props) {
  const inner = (
    <>
      <div className={variant === "rail" ? "shrink-0 border-b border-neutral-200 p-4" : "pb-4"}>
        <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">ANDON Copilot</p>
        <h1 className="mt-1 text-base font-semibold tracking-tight text-neutral-900">Portfolio assistant</h1>
        <p className="mt-2 text-sm leading-relaxed text-neutral-600">
          Ask about my projects, skills, blogs, resume, and experience.
        </p>
      </div>

      <div className={variant === "rail" ? "min-h-0 flex-1 space-y-5 overflow-y-auto p-4" : "space-y-5"}>
        <SuggestedPrompts onPick={onSendPrompt} disabled={isRunning} />

        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Quick filters</p>
          <p className="mt-1 text-[11px] text-neutral-500">Sends a focused search to the agent.</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {SKILL_FILTERS.map((label) => (
              <SkillTag
                key={label}
                label={label}
                onClick={() => onSendPrompt(`Show me projects that use ${label}`)}
              />
            ))}
          </div>
        </div>
      </div>

      {variant === "rail" ? (
        <div className="shrink-0 border-t border-neutral-200 p-3 text-[10px] leading-relaxed text-neutral-500">
          Tools can scroll the preview and open internal routes when useful.
        </div>
      ) : (
        <p className="pt-2 text-[10px] leading-relaxed text-neutral-500">
          Tools target the live preview when possible.
        </p>
      )}
    </>
  );

  if (variant === "embedded") {
    return <div className="text-left">{inner}</div>;
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-r border-neutral-200 bg-white">
      {inner}
    </div>
  );
}
