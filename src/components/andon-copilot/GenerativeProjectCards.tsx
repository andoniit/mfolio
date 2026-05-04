"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { navigatePreviewOrApp } from "@/lib/copilot-portfolio-preview";
import type { PortfolioCopilotGeneratedCard } from "@/lib/ai/portfolioCopilotState";
import SkillTag from "./SkillTag";

type Pending = { href: string; label: string; external: boolean };

type Props = {
  cards: PortfolioCopilotGeneratedCard[];
};

export default function GenerativeProjectCards({ cards }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState<Pending | null>(null);

  if (!cards.length) return null;

  const go = (p: Pending) => {
    if (p.external) {
      window.open(p.href, "_blank", "noopener,noreferrer");
    } else {
      navigatePreviewOrApp(p.href, (path) => router.push(path));
    }
    setPending(null);
  };

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">Shared state · project cards</p>
      <div className="space-y-2">
        {cards.map((c) => (
          <div
            key={c.slug}
            className="rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-lg backdrop-blur-md"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <h4 className="text-sm font-semibold text-white">{c.title}</h4>
                <p className="mt-1 text-[11px] text-zinc-500">{c.matchReason}</p>
              </div>
              <span className="font-mono text-[10px] text-zinc-500">/{c.slug}</span>
            </div>
            {c.description ? <p className="mt-2 line-clamp-2 text-xs text-zinc-400">{c.description}</p> : null}
            {c.tech_stack && c.tech_stack.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {c.tech_stack.slice(0, 6).map((t) => (
                  <SkillTag key={t} label={t} />
                ))}
              </div>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  setPending({ href: `/projects/${c.slug}`, label: `Open project /projects/${c.slug}`, external: false })
                }
                className="rounded-lg border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white hover:bg-white/15"
              >
                View project
              </button>
              <Link
                href={`/blog`}
                className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5"
              >
                Read blog
              </Link>
              {c.external_url ? (
                <button
                  type="button"
                  onClick={() =>
                    setPending({
                      href: c.external_url!,
                      label: `Open external link`,
                      external: true,
                    })
                  }
                  className="rounded-lg border border-white/15 px-3 py-1.5 text-[11px] font-medium text-zinc-300 hover:bg-white/5"
                >
                  View code
                </button>
              ) : null}
            </div>
          </div>
        ))}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl">
            <p className="text-sm font-medium text-white">Continue?</p>
            <p className="mt-1 text-xs text-zinc-400">{pending.label}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">{pending.href}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setPending(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => go(pending)}
                className="rounded-lg bg-white px-4 py-2 text-xs font-semibold text-neutral-900"
              >
                Approve
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
