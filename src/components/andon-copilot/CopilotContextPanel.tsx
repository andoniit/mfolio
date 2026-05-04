"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";
import { openResumePdfFromApi } from "@/lib/openResumePdf";
import SkillTag from "./SkillTag";
import ProjectResultCard, { type ProjectResultCardModel } from "./ProjectResultCard";
import { MOCK_COPILOT_PROJECTS } from "./copilotMockData";

type ApiProject = ProjectResultCardModel & { id: string };

type Props = {
  rootState: PortfolioCopilotRootState;
  variant?: "rail" | "embedded";
};

const QUICK_LINKS = [
  { label: "Resume", href: "/api/resume", openPdf: true as const },
  { label: "Projects", href: "/projects" },
  { label: "Blog", href: "/blog" },
  { label: "Contact", href: "/#contact" },
] as const;

export default function CopilotContextPanel({ rootState, variant = "rail" }: Props) {
  const p = rootState.portfolio;
  const [catalog, setCatalog] = useState<ApiProject[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/projects?limit=80");
        if (!res.ok) throw new Error("Could not load projects");
        const data = (await res.json()) as ApiProject[];
        if (!cancelled) {
          setCatalog(Array.isArray(data) ? data : []);
          setLoadError(null);
        }
      } catch (e) {
        if (!cancelled) {
          setCatalog([]);
          setLoadError(e instanceof Error ? e.message : "Catalog unavailable");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const highlightedRows = useMemo(() => {
    if (!p.highlightedProjectIds.length) return [];
    const set = new Set(p.highlightedProjectIds);
    return catalog.filter((row) => set.has(row.id));
  }, [catalog, p.highlightedProjectIds]);

  const matchedForPanel: ProjectResultCardModel[] = useMemo(() => {
    if (highlightedRows.length > 0) return highlightedRows;
    if (catalog.length > 0) {
      const q = (p.projectQuery ?? "").trim().toLowerCase();
      const tech = (p.projectTech ?? "").trim().toLowerCase();
      if (!q && !tech) return [];
      return catalog
        .filter((row) => {
          const hay = `${row.title} ${row.slug} ${row.description ?? ""}`.toLowerCase();
          const stack = (row.tech_stack ?? []).join(" ").toLowerCase();
          const okQ = !q || hay.includes(q);
          const okT = !tech || stack.includes(tech);
          return okQ && okT;
        })
        .slice(0, 6);
    }
    return MOCK_COPILOT_PROJECTS;
  }, [highlightedRows, catalog, p.projectQuery, p.projectTech]);

  const showMockBanner = highlightedRows.length === 0 && catalog.length === 0;

  const activeFilters = [
    p.projectQuery ? `Search: ${p.projectQuery}` : null,
    p.projectTech ? `Tech: ${p.projectTech}` : null,
    p.blogQuery ? `Blog: ${p.blogQuery}` : null,
  ].filter(Boolean) as string[];

  const selected = matchedForPanel[0] ?? null;

  const body = (
    <div className="space-y-5">
      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Quick links</h3>
        <div className="mt-2 grid grid-cols-2 gap-2">
          {QUICK_LINKS.map((l) =>
            "openPdf" in l && l.openPdf ? (
              <button
                key={l.href}
                type="button"
                onClick={() => void openResumePdfFromApi()}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-center text-xs font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                {l.label}
              </button>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-lg border border-neutral-200 bg-white px-2 py-2 text-center text-xs font-medium text-neutral-800 transition hover:border-neutral-900 hover:bg-neutral-50"
              >
                {l.label}
              </Link>
            ),
          )}
        </div>
      </section>

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Active filters</h3>
        {activeFilters.length ? (
          <ul className="mt-2 space-y-1 text-xs text-neutral-800">
            {activeFilters.map((f) => (
              <li key={f} className="rounded-md border border-neutral-200 bg-neutral-50 px-2 py-1.5">
                {f}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-xs text-neutral-500">None yet — ask the copilot to search or filter.</p>
        )}
      </section>

      {selected ? (
        <section>
          <h3 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Focus</h3>
          <p className="mt-2 text-sm font-medium text-neutral-900">{selected.title}</p>
          <div className="mt-2 flex flex-wrap gap-1">
            {(selected.tech_stack ?? []).slice(0, 6).map((t) => (
              <SkillTag key={t} label={t} />
            ))}
          </div>
          <Link
            href={`/projects/${selected.slug}`}
            className="mt-2 inline-block text-xs font-medium text-neutral-900 underline underline-offset-2 hover:no-underline"
          >
            Open project →
          </Link>
        </section>
      ) : null}

      <section>
        <h3 className="text-[10px] font-semibold uppercase tracking-wide text-neutral-500">Matched projects</h3>
        {loadError ? <p className="mt-2 text-xs text-neutral-700">{loadError}</p> : null}
        {showMockBanner ? (
          <p className="mt-2 text-[11px] text-neutral-500">Demo cards until the catalog loads.</p>
        ) : null}
        <div className="mt-3 space-y-2">
          {matchedForPanel.slice(0, 5).map((proj, i) => (
            <ProjectResultCard key={proj.slug} project={proj} index={i} />
          ))}
          {matchedForPanel.length === 0 ? (
            <p className="text-xs text-neutral-500">No matches yet. Try a suggested prompt.</p>
          ) : null}
        </div>
      </section>
    </div>
  );

  if (variant === "embedded") {
    return (
      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Context</h2>
        <p className="mt-1 text-[11px] text-neutral-500">Filters and highlights from the agent.</p>
        <div className="mt-4">{body}</div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col border-l border-neutral-200 bg-white">
      <div className="shrink-0 border-b border-neutral-200 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Context</h2>
        <p className="mt-1 text-[11px] text-neutral-500">Live filters and highlights from the agent.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-4">{body}</div>
    </div>
  );
}
