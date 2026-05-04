"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useAICopilotContext } from "@/context/AICopilotContext";
import ChatMessages from "./ChatMessages";
import SuggestedPrompts from "./SuggestedPrompts";

/**
 * Full-height copilot chat column (used on `/andon-copilot` instead of the old floating panel).
 * AG-UI: messages + status come from `HttpAgent` via `AICopilotProvider`.
 */
export default function CopilotChatColumn() {
  const { messages, sendUserMessage, isRunning, rootState } = useAICopilotContext();
  const [draft, setDraft] = useState("");
  const endRef = useRef<HTMLDivElement | null>(null);

  const statusLine = useMemo(() => {
    const s = rootState.portfolio.assistantStatus;
    if (s === "thinking") return "Thinking…";
    if (s === "streaming") return "Writing…";
    if (s === "error") return rootState.portfolio.errorMessage || "Something went wrong.";
    if (isRunning) return "Working…";
    return "";
  }, [isRunning, rootState.portfolio.assistantStatus, rootState.portfolio.errorMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isRunning]);

  return (
    <div className="flex flex-col h-full min-h-0 bg-white">
      <div className="shrink-0 p-5 border-b border-gray-100">
        <div className="text-lg font-semibold text-gray-900">Andon Copilot</div>
        <p className="text-sm text-gray-500 mt-1">
          Ask about projects, blogs, and experience. The preview on the left is your live site; scroll and
          open-link tools target that preview when possible.
        </p>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto p-5 space-y-5">
        <SuggestedPrompts
          onPick={async (text) => {
            setDraft("");
            await sendUserMessage(text);
          }}
        />

        <div className="space-y-3">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Chat</div>
          <ChatMessages messages={messages} />
          <div ref={endRef} />
        </div>

        {statusLine ? (
          <div className="text-xs text-gray-500 border border-gray-100 rounded-lg px-3 py-2 bg-gray-50">
            {statusLine}
          </div>
        ) : null}
      </div>

      <form
        className="shrink-0 p-4 border-t border-gray-100 bg-white"
        onSubmit={async (e) => {
          e.preventDefault();
          const text = draft.trim();
          if (!text || isRunning) return;
          setDraft("");
          await sendUserMessage(text);
        }}
      >
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Ask a question…"
            className="flex-1 rounded-xl border border-gray-200 px-3 py-2.5 text-sm outline-none focus:border-black"
            disabled={isRunning}
          />
          <button
            type="submit"
            disabled={isRunning || !draft.trim()}
            className="rounded-xl bg-black text-white text-sm font-medium px-4 py-2.5 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
