"use client";

import { useCallback, type KeyboardEvent } from "react";
import clsx from "clsx";

type Props = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  variant?: "light" | "dark";
};

export default function CopilotInput({
  value,
  onChange,
  onSend,
  disabled,
  placeholder = "Ask about projects, AG-UI, or DeskNote…",
  variant = "light",
}: Props) {
  const dark = variant === "dark";
  const onKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        onSend();
      }
    },
    [onSend]
  );

  return (
    <div
      className={clsx(
        "rounded-xl border p-[1px] transition-shadow",
        dark
          ? "border-white/10 bg-gradient-to-r from-white/10 via-white/5 to-white/10 focus-within:from-cyan-500/30 focus-within:via-violet-500/20 focus-within:to-cyan-500/30"
          : "border-neutral-300 focus-within:border-neutral-900 focus-within:ring-1 focus-within:ring-neutral-900",
        disabled && "opacity-50"
      )}
    >
      <div className={clsx("rounded-[11px]", dark ? "bg-zinc-950/95" : "bg-white")}>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          rows={2}
          disabled={disabled}
          placeholder={placeholder}
          className={clsx(
            "block min-h-[48px] w-full resize-none border-0 bg-transparent px-3 py-2.5 text-sm focus:outline-none disabled:cursor-not-allowed",
            dark ? "text-zinc-100 placeholder:text-zinc-600" : "text-neutral-900 placeholder:text-neutral-400"
          )}
        />
        <div
          className={clsx(
            "flex items-center justify-between gap-2 border-t px-2 py-1.5",
            dark ? "border-white/10" : "border-neutral-200"
          )}
        >
          <span className={clsx("text-[10px]", dark ? "text-zinc-500" : "text-neutral-500")}>
            <kbd
              className={clsx(
                "rounded border px-1 font-sans",
                dark ? "border-white/15 bg-white/5" : "border-neutral-200 bg-neutral-50"
              )}
            >
              Enter
            </kbd>{" "}
            send ·{" "}
            <kbd
              className={clsx(
                "rounded border px-1 font-sans",
                dark ? "border-white/15 bg-white/5" : "border-neutral-200 bg-neutral-50"
              )}
            >
              Shift+Enter
            </kbd>{" "}
            line
          </span>
          <button
            type="button"
            onClick={onSend}
            disabled={disabled || !value.trim()}
            className={clsx(
              "rounded-lg px-3 py-1.5 text-xs font-semibold disabled:cursor-not-allowed disabled:opacity-40",
              dark ? "bg-white text-neutral-900 hover:bg-zinc-200" : "bg-neutral-900 text-white hover:bg-black"
            )}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
