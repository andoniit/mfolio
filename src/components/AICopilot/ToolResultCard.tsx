"use client";

import Link from "next/link";

type Props = {
  title: string;
  content: string;
};

/**
 * Renders AG-UI `tool` role message payloads (usually JSON) in a readable panel.
 * AG-UI: `TOOL_CALL_RESULT` becomes a persisted `tool` message in the agent transcript.
 */
export default function ToolResultCard({ title, content }: Props) {
  let parsed: unknown = null;
  let pretty = content;
  try {
    parsed = JSON.parse(content);
    pretty = JSON.stringify(parsed, null, 2);
  } catch {
    // keep raw string
  }

  const projects =
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "projects" in parsed &&
    Array.isArray((parsed as { projects: unknown }).projects)
      ? ((parsed as { projects: Array<{ id?: string; title?: string; slug?: string }> }).projects ?? []).filter(
          (p) => p && typeof p.slug === "string" && typeof p.title === "string"
        )
      : [];

  const posts =
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "posts" in parsed &&
    Array.isArray((parsed as { posts: unknown }).posts)
      ? ((parsed as { posts: Array<{ id?: string; title?: string; slug?: string }> }).posts ?? []).filter(
          (p) => p && typeof p.slug === "string" && typeof p.title === "string"
        )
      : [];

  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-left">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-gray-500 mb-2">
        {title}
      </div>

      {projects.length > 0 ? (
        <div className="mb-3 space-y-2">
          {projects.slice(0, 4).map((p) => (
            <Link
              key={p.slug}
              href={`/projects/${p.slug}`}
              className="block rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-black transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{p.title}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 font-mono">/{p.slug}</div>
            </Link>
          ))}
        </div>
      ) : null}

      {posts.length > 0 ? (
        <div className="mb-3 space-y-2">
          {posts.slice(0, 4).map((p) => (
            <Link
              key={p.slug}
              href={`/blog/${p.slug}`}
              className="block rounded-lg border border-gray-200 bg-white px-3 py-2 hover:border-black transition-colors"
            >
              <div className="text-sm font-medium text-gray-900">{p.title}</div>
              <div className="text-[11px] text-gray-500 mt-0.5 font-mono">/{p.slug}</div>
            </Link>
          ))}
        </div>
      ) : null}

      <pre className="text-xs text-gray-800 whitespace-pre-wrap break-words max-h-48 overflow-auto font-mono leading-relaxed">
        {pretty}
      </pre>
    </div>
  );
}
