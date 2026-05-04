"use client";

import { useCallback, useMemo, useState } from "react";
import { motion } from "framer-motion";

type QuickAction =
  | { kind: "link"; label: string; href: string; external: boolean }
  | { kind: "resume"; label: string };

const QUICK_ACTIONS: QuickAction[] = [
  { kind: "link", label: "View projects", href: "/projects", external: false },
  { kind: "link", label: "Read blog", href: "/blog", external: false },
  { kind: "resume", label: "Open resume" },
  { kind: "link", label: "Contact", href: "/#contact", external: false },
];

type Props = {
  role: "user" | "assistant";
  content: string;
  timeLabel?: string;
  showQuickActions?: boolean;
  showCopy?: boolean;
  /** Ask parent to show human-in-the-loop approval before navigation / download */
  onLinkIntent?: (href: string, label: string, external: boolean) => void;
  /** Opens public résumé PDF from `/api/resume` (JSON) — not a direct link */
  onOpenResume?: () => void;
};

export default function CopilotMessage({
  role,
  content,
  timeLabel,
  showQuickActions = role === "assistant",
  showCopy = role === "assistant",
  onLinkIntent,
  onOpenResume,
}: Props) {
  const [copied, setCopied] = useState(false);

  const trimmed = content.trim();
  const displayFallback =
    role === "assistant" && !trimmed ? "No text was returned for this reply." : content;

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(trimmed || displayFallback);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, [trimmed, displayFallback]);

  const bubble = useMemo(() => {
    if (role === "user") {
      return (
        <div className="rounded-xl rounded-br-sm border border-white/10 bg-white/[0.08] px-3.5 py-2 text-sm leading-relaxed text-white">
          {content}
        </div>
      );
    }
    return (
      <div className="rounded-xl rounded-bl-sm border border-white/10 bg-black/35 px-3.5 py-2 text-sm leading-relaxed text-zinc-100 backdrop-blur-md">
        <p className="whitespace-pre-wrap">{displayFallback}</p>
      </div>
    );
  }, [role, content, displayFallback]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={role === "user" ? "flex flex-col items-end gap-1" : "flex flex-col items-start gap-1"}
    >
      {bubble}
      <div
        className={
          role === "user"
            ? "flex flex-row-reverse items-center gap-2 px-0.5"
            : "flex flex-wrap items-center gap-2 px-0.5"
        }
      >
        {timeLabel ? <span className="text-[10px] text-zinc-500">{timeLabel}</span> : null}
        {showCopy && trimmed ? (
          <button
            type="button"
            onClick={copy}
            className="text-[10px] font-medium text-cyan-300/90 hover:text-cyan-200"
          >
            {copied ? "Copied" : "Copy"}
          </button>
        ) : null}
      </div>
      {showQuickActions && trimmed && (onLinkIntent || onOpenResume) ? (
        <div className="mt-1 flex flex-wrap gap-1">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.label}
              type="button"
              onClick={() => {
                if (a.kind === "resume") {
                  onOpenResume?.();
                  return;
                }
                onLinkIntent?.(a.href, a.label, a.external);
              }}
              className="rounded-md border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-medium text-zinc-200 hover:border-white/30 hover:bg-white/10"
            >
              {a.label}
            </button>
          ))}
        </div>
      ) : null}
    </motion.div>
  );
}
