"use client";

const PROMPTS = [
  "Show me React projects",
  "Which projects use GSAP?",
  "Summarize my resume",
  "Search blogs for Next.js",
  "Scroll to featured projects on the homepage",
  "Open the projects page",
];

export default function SuggestedPrompts({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Try asking</div>
      <div className="flex flex-col gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => onPick(p)}
            className="text-left text-sm rounded-xl border border-gray-200 bg-white hover:bg-gray-50 px-3 py-2 text-gray-800 transition-colors"
          >
            {p}
          </button>
        ))}
      </div>
    </div>
  );
}
