"use client";

import clsx from "clsx";

type Props = {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
  /** Default `dark` for glass copilot rail */
  variant?: "dark" | "light";
};

export default function SkillTag({ label, active, onClick, className, variant = "dark" }: Props) {
  const Comp = onClick ? "button" : "span";
  const dark = variant === "dark";
  return (
    <Comp
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={clsx(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium",
        dark &&
          (active
            ? "border-cyan-400/40 bg-cyan-500/15 text-cyan-100"
            : "border-white/15 bg-white/5 text-zinc-300 hover:border-white/25 hover:bg-white/10"),
        !dark &&
          (active
            ? "border-neutral-900 bg-neutral-900 text-white"
            : "border-neutral-200 bg-white text-neutral-700 hover:border-neutral-400"),
        onClick && "cursor-pointer",
        className
      )}
    >
      {label}
    </Comp>
  );
}
