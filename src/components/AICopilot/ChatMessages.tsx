"use client";

import type { Message } from "@ag-ui/core";
import ToolResultCard from "./ToolResultCard";

function messageKey(m: Message, index: number) {
  return `${m.role}-${"id" in m ? m.id : index}`;
}

function stringifyUserContent(content: Message["content"]): string {
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
 * Renders AG-UI message history (user/assistant/tool) for the copilot transcript.
 * Streaming assistant text is applied by `@ag-ui/client` as `TEXT_MESSAGE_*` events.
 */
export default function ChatMessages({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-3">
      {messages.map((m, index) => {
        if (m.role === "user") {
          return (
            <div key={messageKey(m, index)} className="self-end max-w-[92%]">
              <div className="rounded-2xl bg-black text-white px-4 py-2.5 text-sm leading-relaxed">
                {stringifyUserContent(m.content)}
              </div>
            </div>
          );
        }

        if (m.role === "assistant") {
          const text = typeof m.content === "string" ? m.content : stringifyUserContent(m.content);
          if (!text.trim()) return null;
          return (
            <div key={messageKey(m, index)} className="self-start max-w-[92%]">
              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-2.5 text-sm leading-relaxed text-gray-900 whitespace-pre-wrap">
                {text}
              </div>
            </div>
          );
        }

        if (m.role === "tool") {
          return (
            <div key={messageKey(m, index)} className="self-stretch">
              <ToolResultCard title="Tool result" content={typeof m.content === "string" ? m.content : ""} />
            </div>
          );
        }

        return null;
      })}
    </div>
  );
}
