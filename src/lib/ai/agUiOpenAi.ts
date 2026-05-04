import type { Message } from "@ag-ui/core";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";

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

/**
 * Converts AG-UI conversation messages into OpenAI chat completion messages.
 * (AG-UI tool / assistant tool-call shapes align with OpenAI function-calling.)
 */
export function agUiMessagesToOpenAI(messages: Message[]): ChatCompletionMessageParam[] {
  const out: ChatCompletionMessageParam[] = [];

  for (const m of messages) {
    if (m.role === "user" || m.role === "system") {
      out.push({ role: m.role, content: stringifyMessageContent(m.content) });
      continue;
    }

    if (m.role === "developer") {
      out.push({ role: "system", content: stringifyMessageContent(m.content) });
      continue;
    }

    if (m.role === "assistant") {
      const toolCalls = m.toolCalls?.length
        ? m.toolCalls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments ?? "",
            },
          }))
        : undefined;

      if (toolCalls?.length) {
        out.push({
          role: "assistant",
          content: stringifyMessageContent(m.content) || null,
          tool_calls: toolCalls,
        });
      } else {
        out.push({ role: "assistant", content: stringifyMessageContent(m.content) });
      }
      continue;
    }

    if (m.role === "tool") {
      out.push({
        role: "tool",
        tool_call_id: m.toolCallId,
        content: stringifyMessageContent(m.content),
      });
    }
  }

  return out;
}
