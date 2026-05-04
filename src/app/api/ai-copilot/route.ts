import { EventEncoder } from "@ag-ui/encoder";
import { EventType, RunAgentInputSchema, type Message } from "@ag-ui/core";
import OpenAI from "openai";
import { agUiMessagesToOpenAI, stringifyMessageContent } from "@/lib/ai/agUiOpenAi";
import {
  DEFAULT_PORTFOLIO_COPILOT_STATE,
  type PortfolioCopilotRootState,
} from "@/lib/ai/portfolioCopilotState";
import {
  loadPortfolioCatalog,
  type PortfolioProjectRecord,
} from "@/lib/ai/portfolioData.server";
import {
  executePortfolioCopilotTool,
  portfolioCopilotOpenAITools,
} from "@/lib/ai/portfolioTools";
import { randomUUID } from "@/lib/random-id";

export const runtime = "nodejs";

const MODEL = process.env.OPENAI_MODEL ?? "gpt-4o-mini";

function chunkText(text: string, size = 48): string[] {
  if (!text) return [];
  const parts: string[] = [];
  for (let i = 0; i < text.length; i += size) {
    parts.push(text.slice(i, i + size));
  }
  return parts;
}

/** Counts tech_stack labels across projects (at most once per label per project). */
function techFrequencySummary(projects: PortfolioProjectRecord[]): string {
  const counts = new Map<string, number>();
  for (const p of projects) {
    const seenInProject = new Set<string>();
    for (const t of p.tech_stack ?? []) {
      if (typeof t !== "string") continue;
      const k = t.trim();
      if (!k) continue;
      const key = k.toLowerCase();
      if (seenInProject.has(key)) continue;
      seenInProject.add(key);
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
  }
  if (counts.size === 0) return "No tech_stack labels in catalog.";
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .map(([k, n]) => `${k}: ${n}`)
    .join("; ");
}

async function fetchResumePublicUrl(request: Request): Promise<string | null> {
  try {
    const origin = new URL(request.url).origin;
    const res = await fetch(`${origin}/api/resume`, { cache: "no-store" });
    const json = (await res.json().catch(() => null)) as { url?: string | null } | null;
    return typeof json?.url === "string" && json.url ? json.url : null;
  } catch {
    return null;
  }
}

/**
 * AG-UI HTTP endpoint: streams SSE `data: {json}\n\n` events (RUN_*, TEXT_MESSAGE_CHUNK, STATE_SNAPSHOT, …).
 * Tool calls are executed on the server; portfolio UI updates are pushed via STATE_SNAPSHOT.state.portfolio.
 */
export async function POST(request: Request) {
  const accept = request.headers.get("accept") ?? undefined;
  const encoder = new EventEncoder({ accept });

  const json = await request.json().catch(() => null);

  if (!process.env.OPENAI_API_KEY) {
    const threadId = typeof (json as { threadId?: unknown })?.threadId === "string" ? (json as { threadId: string }).threadId : "unknown";
    const runId = typeof (json as { runId?: unknown })?.runId === "string" ? (json as { runId: string }).runId : "unknown";
    // AG-UI: first streamed event must be RUN_STARTED; then we can terminate with RUN_ERROR.
    const errBody =
      encoder.encode({ type: EventType.RUN_STARTED, threadId, runId }) +
      encoder.encode({
        type: EventType.RUN_ERROR,
        message:
          "Missing OPENAI_API_KEY. Add it to your environment to enable the portfolio copilot.",
      });

    return new Response(errBody, {
      status: 503,
      headers: { "Content-Type": encoder.getContentType() },
    });
  }

  const parsed = RunAgentInputSchema.safeParse(json);
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const input = parsed.data;
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (event: unknown) => {
        controller.enqueue(new TextEncoder().encode(encoder.encode(event as never)));
      };

      try {
        // AG-UI lifecycle: begin a run (HttpAgent validates this is the first event).
        enqueue({
          type: EventType.RUN_STARTED,
          threadId: input.threadId,
          runId: input.runId,
          input,
        });

        const initialPortfolio = {
          ...DEFAULT_PORTFOLIO_COPILOT_STATE,
          ...((input.state as PortfolioCopilotRootState | undefined)?.portfolio ?? {}),
        };

        let lastUserIntent: string | null = null;
        for (let i = input.messages.length - 1; i >= 0; i--) {
          const m = input.messages[i];
          if (m && m.role === "user") {
            const t = stringifyMessageContent(m.content).trim();
            if (t) {
              lastUserIntent = t.length > 180 ? `${t.slice(0, 177)}…` : t;
            }
            break;
          }
        }

        let rootState: PortfolioCopilotRootState = {
          portfolio: {
            ...initialPortfolio,
            assistantStatus: "thinking",
            errorMessage: null,
            currentIntent: lastUserIntent,
            agentActivityLabel: "Thinking…",
            lastToolCallName: null,
          },
        };

        // AG-UI shared state: push the merged portfolio UI state to the client.
        enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });

        const [catalog, resumePublicUrl] = await Promise.all([
          loadPortfolioCatalog(),
          fetchResumePublicUrl(request),
        ]);

        const techLine = techFrequencySummary(catalog.projects);
        const system: OpenAI.Chat.Completions.ChatCompletionSystemMessageParam = {
          role: "system",
          content: [
            "You are the Portfolio Copilot for Anirudha Kapileshwari (nickname Andon) at anikap.tech.",
            "Voice: answer as Anirudha in first person (I / my) when describing work and projects. Never describe “Andon” as a separate third party—Andon is the same person.",
            "You help visitors explore projects, blog posts, experience, and résumé information.",
            "Whenever the visitor asks to filter/highlight projects, list all projects, find blogs, scroll the homepage, navigate internally, or fetch structured project details, you MUST call the provided tools (do not guess slugs).",
            "For “show me projects”, “show all projects”, or “every project”, call listAllProjects or searchProjects with query \"all\" (or empty). That opens `/projects` in the live preview with no filters.",
            "For “latest project” / “newest project” / “highlight flagship”, call highlightLatestProject.",
            "For “what tech do you use most”, use the frequency line below (cite counts). You may also call filterProjectsByTech for a stack the visitor names.",
            "For résumé PDF: call getResumeSummary and use resumeUrl for a direct link; the visitor can also use the chat “Open resume” control.",
            "Prefer concise answers. After tools run, summarize what changed in the preview.",
            `Known homepage section ids: hero-section, about-me, experience, my-vision, featured-projects, my-desk-setup.`,
            `Public catalog snapshot: ${catalog.projects.length} projects, ${catalog.posts.length} blog posts.`,
            `Published-project tech_stack frequency (label: count across projects): ${techLine}`,
          ].join("\n"),
        };

        let openaiMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
          system,
          ...agUiMessagesToOpenAI(input.messages as Message[]),
        ];

        const maxIterations = 8;
        // Tool loop: OpenAI proposes function calls; we execute them locally and return tool messages.
        for (let iter = 0; iter < maxIterations; iter++) {
          rootState = {
            portfolio: {
              ...rootState.portfolio,
              assistantStatus: "thinking",
              agentActivityLabel: iter === 0 ? "Calling model…" : "Choosing next action…",
            },
          };
          enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });

          const completion = await openai.chat.completions.create({
            model: MODEL,
            messages: openaiMessages,
            tools: portfolioCopilotOpenAITools,
            tool_choice: "auto",
          });

          const choice = completion.choices[0];
          const msg = choice?.message;
          if (!msg) {
            throw new Error("OpenAI returned no message choice.");
          }

          if (msg.tool_calls?.length) {
            openaiMessages.push({
              role: "assistant",
              content: msg.content ?? null,
              tool_calls: msg.tool_calls,
            });

            for (const toolCall of msg.tool_calls) {
              if (toolCall.type !== "function") {
                continue;
              }
              const name = toolCall.function.name;
              rootState = {
                portfolio: {
                  ...rootState.portfolio,
                  assistantStatus: "thinking",
                  agentActivityLabel: `Calling ${name}…`,
                  lastToolCallName: name,
                },
              };
              enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });
              const argsJson = toolCall.function.arguments ?? "{}";
              const { nextState, toolMessage } = executePortfolioCopilotTool({
                name,
                argsJson,
                catalog,
                rootState,
                resumePublicUrl,
              });
              rootState = nextState;
              // AG-UI shared state: tool execution updated portfolio filters / navigation intent.
              enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });

              openaiMessages.push({
                role: "tool",
                tool_call_id: toolCall.id,
                content: toolMessage,
              });
            }

            continue;
          }

          const finalText =
            (typeof msg.content === "string" && msg.content.trim()) ||
            "I’m not sure how to help with that yet—try asking about projects, blogs, or homepage sections.";

          rootState = {
            portfolio: {
              ...rootState.portfolio,
              assistantStatus: "streaming",
              agentActivityLabel: "Streaming answer…",
            },
          };
          enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });

          const messageId = randomUUID();
          // AG-UI streaming: TEXT_MESSAGE_CHUNK is expanded client-side into TEXT_MESSAGE_* events.
          for (const delta of chunkText(finalText)) {
            if (!delta) continue;
            enqueue({
              type: EventType.TEXT_MESSAGE_CHUNK,
              messageId,
              role: "assistant",
              delta,
            });
          }

          rootState = {
            portfolio: {
              ...rootState.portfolio,
              assistantStatus: "idle",
              agentActivityLabel: "Finished",
            },
          };
          enqueue({ type: EventType.STATE_SNAPSHOT, snapshot: rootState });

          // AG-UI lifecycle: mark successful completion of the run.
          enqueue({
            type: EventType.RUN_FINISHED,
            threadId: input.threadId,
            runId: input.runId,
            result: { ok: true },
          });
          controller.close();
          return;
        }

        throw new Error("Tool loop exceeded maximum iterations.");
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        enqueue({ type: EventType.RUN_ERROR, message });
        enqueue({
          type: EventType.STATE_SNAPSHOT,
          snapshot: {
            portfolio: {
              ...DEFAULT_PORTFOLIO_COPILOT_STATE,
              assistantStatus: "error",
              errorMessage: message,
            },
          },
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": encoder.getContentType(),
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
