"use client";

import { motion } from "framer-motion";

const PROMPTS = [
  "Show me React animation projects",
  "Which projects use GSAP?",
  "Summarize my frontend experience",
  "Show projects related to AI",
  "Tell me about DeskNote",
  "What can this copilot do?",
  "Show AG-UI capabilities",
];

type Props = {
  onPick: (text: string) => void;
  onShowCapabilities?: () => void;
  disabled?: boolean;
};

export default function SuggestedPrompts({ onPick, onShowCapabilities, disabled }: Props) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Demo prompts</p>
      <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
        {PROMPTS.map((p, i) => (
          <motion.button
            key={p}
            type="button"
            initial={false}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.02 }}
            disabled={disabled}
            onClick={() => {
              if (p === "Show AG-UI capabilities") {
                onShowCapabilities?.();
                return;
              }
              if (p === "What can this copilot do?") {
                onShowCapabilities?.();
              }
              void onPick(p);
            }}
            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-[12px] leading-snug text-zinc-200 backdrop-blur-sm transition hover:border-white/20 hover:bg-white/[0.07] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {p}
          </motion.button>
        ))}
      </div>
    </div>
  );
}
