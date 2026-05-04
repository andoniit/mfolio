import type { Message } from "@ag-ui/core";

export type ParsedToolProject = { id?: string; title: string; slug: string };
export type ParsedToolPost = { id?: string; title: string; slug: string };

export function stringifyMessageContent(content: Message["content"]): string {
  if (typeof content === "string") return content;
  if (!Array.isArray(content)) return "";
  return content
    .map((part) => {
      if (typeof part === "object" && part && "type" in part && part.type === "text" && "text" in part) {
        return String((part as { text?: string }).text ?? "");
      }
      return "";
    })
    .join("");
}

export function parseToolPayload(content: string): {
  pretty: string;
  projects: ParsedToolProject[];
  posts: ParsedToolPost[];
} {
  let parsed: unknown = null;
  let pretty = content;
  try {
    parsed = JSON.parse(content);
    pretty = JSON.stringify(parsed, null, 2);
  } catch {
    // keep raw
  }

  const projects =
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "projects" in parsed &&
    Array.isArray((parsed as { projects: unknown }).projects)
      ? ((parsed as { projects: ParsedToolProject[] }).projects ?? []).filter(
          (p) => p && typeof p.slug === "string" && typeof p.title === "string"
        )
      : [];

  const posts =
    parsed &&
    typeof parsed === "object" &&
    parsed !== null &&
    "posts" in parsed &&
    Array.isArray((parsed as { posts: unknown }).posts)
      ? ((parsed as { posts: ParsedToolPost[] }).posts ?? []).filter(
          (p) => p && typeof p.slug === "string" && typeof p.title === "string"
        )
      : [];

  return { pretty, projects, posts };
}

export function messageKey(m: Message, index: number) {
  return `${m.role}-${"id" in m && m.id ? m.id : index}`;
}
