"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Message } from "@ag-ui/core";
import Link from "next/link";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { motion } from "framer-motion";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";
import { navigatePreviewOrApp } from "@/lib/copilot-portfolio-preview";
import { openResumePdfFromApi } from "@/lib/openResumePdf";
import { useAICopilotContext } from "@/context/AICopilotContext";
import CopilotMessage from "./CopilotMessage";
import CopilotInput from "./CopilotInput";
import ProjectResultCard from "./ProjectResultCard";
import GenerativeProjectCards from "./GenerativeProjectCards";
import NavigationApprovalBanner from "./NavigationApprovalBanner";
import { messageKey, parseToolPayload, stringifyMessageContent } from "./copilotMessageUtils";

const QUICK_PROMPTS = [
  "Show all my projects",
  "Open my résumé PDF",
  "Scroll to Experience on the homepage",
  "Show featured projects on the homepage",
  "Which projects use GSAP?",
  "Tell me about DeskNote",
  "Show AI-related work",
  "Search blogs for Next.js",
  "What tech do I use most in my projects?",
  "Highlight my latest project",
];

const SKILL_CHIPS = ["React", "Next.js", "GSAP", "Three.js", "AI", "Supabase"] as const;

type LinkPending = { href: string; label: string; external: boolean };

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-4 py-3 backdrop-blur-md">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-cyan-400/70"
          animate={{ opacity: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
      <span className="ml-2 text-xs text-zinc-500">Streaming…</span>
    </div>
  );
}

type Props = {
  className?: string;
  messages: Message[];
  isRunning: boolean;
  rootState: PortfolioCopilotRootState;
  sendUserMessage: (text: string) => Promise<void>;
  clearChat: () => void;
};

export default function CopilotChat({
  className,
  messages,
  isRunning,
  rootState,
  sendUserMessage,
  clearChat,
}: Props) {
  const router = useRouter();
  const { abort, pendingAgentNavigation } = useAICopilotContext();
  const [draft, setDraft] = useState("");
  const [linkPending, setLinkPending] = useState<LinkPending | null>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  const p = rootState.portfolio;

  const statusLine = useMemo(() => {
    if (p.assistantStatus === "error") return p.errorMessage || "Something went wrong.";
    if (isRunning && p.agentActivityLabel) return p.agentActivityLabel;
    if (p.assistantStatus === "thinking") return "Thinking…";
    if (p.assistantStatus === "streaming") return "Updating transcript…";
    if (isRunning) return "Working…";
    return "";
  }, [isRunning, p.assistantStatus, p.agentActivityLabel, p.errorMessage]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, isRunning, p.generatedCards]);

  const showTypingIndicator = useMemo(() => {
    if (!isRunning) return false;
    if (messages.length === 0) return true;
    const last = messages[messages.length - 1];
    if (last.role === "user") return true;
    if (last.role === "assistant") return !stringifyMessageContent(last.content).trim();
    return false;
  }, [isRunning, messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || isRunning) return;
    setDraft("");
    await sendUserMessage(text);
  };

  const hasConversation = messages.some((m) => m.role === "user" || m.role === "assistant");

  const openResumePdf = useCallback(() => {
    void openResumePdfFromApi();
  }, []);

  const confirmLink = useCallback(() => {
    if (!linkPending) return;
    if (linkPending.href === "/api/resume") {
      void openResumePdf();
      setLinkPending(null);
      return;
    }
    if (linkPending.external) {
      window.open(linkPending.href, "_blank", "noopener,noreferrer");
    } else {
      navigatePreviewOrApp(linkPending.href, (path) => router.push(path));
    }
    setLinkPending(null);
  }, [linkPending, router, openResumePdf]);

  const onLinkIntent = useCallback((href: string, label: string, external: boolean) => {
    if (href === "/api/resume") {
      void openResumePdf();
      return;
    }
    setLinkPending({ href, label, external });
  }, [openResumePdf]);

  return (
    <div className={clsx("flex min-h-0 flex-col", className)}>
      {pendingAgentNavigation ? (
        <div className="shrink-0 border-b border-white/10 px-3 py-2">
          <NavigationApprovalBanner />
        </div>
      ) : null}

      <header className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <h2 className="text-sm font-semibold text-white">Copilot</h2>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {isRunning ? (
            <button
              type="button"
              onClick={abort}
              className="rounded-md border border-red-400/40 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/20"
            >
              Stop
            </button>
          ) : null}
          <button
            type="button"
            onClick={clearChat}
            disabled={isRunning || !hasConversation}
            className="rounded-md border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>
      </header>

      <div className="flex-1 min-h-0 space-y-3 overflow-y-auto px-3 py-3">
        {p.generatedCards.length > 0 ? <GenerativeProjectCards cards={p.generatedCards} /> : null}

        {!hasConversation ? (
          <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2.5 text-center text-xs leading-relaxed text-zinc-400">
            Ask anything about the portfolio. The live site on the left updates when the assistant uses tools.
          </p>
        ) : null}

        <div className="mx-auto flex max-w-2xl flex-col gap-3 pb-2">
          {messages.map((m, index) => {
            if (m.role === "user") {
              const text = stringifyMessageContent(m.content);
              if (!text.trim()) return null;
              return (
                <div key={messageKey(m, index)} className="flex justify-end">
                  <div className="max-w-[90%]">
                    <CopilotMessage role="user" content={text} timeLabel="You" />
                  </div>
                </div>
              );
            }

            if (m.role === "assistant") {
              const text = stringifyMessageContent(m.content);
              const streamingLast = isRunning && index === messages.length - 1;
              if (!text.trim() && streamingLast) return null;
              if (!text.trim()) return null;
              return (
                <div key={messageKey(m, index)} className="flex justify-start">
                  <div className="max-w-[92%] space-y-2">
                    <CopilotMessage
                      role="assistant"
                      content={text}
                      timeLabel="Assistant"
                      onLinkIntent={onLinkIntent}
                      onOpenResume={openResumePdf}
                    />
                  </div>
                </div>
              );
            }

            if (m.role === "tool") {
              const raw = typeof m.content === "string" ? m.content : "";
              const { projects, posts, pretty } = parseToolPayload(raw);
              const hasCards = projects.length > 0 || posts.length > 0;
              return (
                <div key={messageKey(m, index)} className="space-y-2">
                  {projects.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
                        Tool · projects
                      </p>
                      {projects.map((proj, i) => (
                        <ProjectResultCard key={proj.slug} project={proj} index={i} />
                      ))}
                    </div>
                  ) : null}
                  {posts.length > 0 ? (
                    <div className="space-y-2">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">Tool · blog</p>
                      <div className="flex flex-col gap-2">
                        {posts.map((post) => (
                          <Link
                            key={post.slug}
                            href={`/blog/${post.slug}`}
                            className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-zinc-100 hover:border-cyan-500/30"
                          >
                            {post.title}
                          </Link>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {!hasCards ? (
                    <pre className="max-h-40 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-zinc-400">
                      {pretty}
                    </pre>
                  ) : null}
                </div>
              );
            }

            return null;
          })}

          {showTypingIndicator ? (
            <div className="flex justify-start">
              <TypingIndicator />
            </div>
          ) : null}

          {statusLine ? (
            <div
              className={clsx(
                "rounded-lg border px-3 py-2 text-xs backdrop-blur-md",
                p.assistantStatus === "error"
                  ? "border-red-400/30 bg-red-500/10 text-red-100"
                  : "border-white/10 bg-white/[0.04] text-zinc-300"
              )}
            >
              {statusLine}
            </div>
          ) : null}

          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 space-y-2 border-t border-white/10 bg-zinc-950 p-3">
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Try asking</p>
          <div className="flex gap-1.5 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {QUICK_PROMPTS.map((t) => (
              <button
                key={t}
                type="button"
                disabled={isRunning}
                onClick={() => void sendUserMessage(t)}
                className="shrink-0 rounded-full border border-white/15 bg-white/5 px-2.5 py-1 text-[11px] text-zinc-200 hover:border-white/25 hover:bg-white/10 disabled:opacity-40"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">Tech</p>
          <div className="flex flex-wrap gap-1">
            {SKILL_CHIPS.map((s) => (
              <button
                key={s}
                type="button"
                disabled={isRunning}
                onClick={() => void sendUserMessage(`Show me projects that use ${s}`)}
                className="rounded-md border border-white/10 bg-transparent px-2 py-0.5 text-[11px] text-zinc-400 hover:border-white/20 hover:text-zinc-200 disabled:opacity-40"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <CopilotInput variant="dark" value={draft} onChange={setDraft} onSend={send} disabled={isRunning} />
      </div>

      {linkPending ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div className="w-full max-w-md rounded-xl border border-white/10 bg-zinc-900 p-4 shadow-2xl">
            <p className="text-sm font-medium text-white">Continue?</p>
            <p className="mt-1 text-xs text-zinc-400">{linkPending.label}</p>
            <p className="mt-1 break-all font-mono text-[11px] text-zinc-500">{linkPending.href}</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setLinkPending(null)}
                className="rounded-lg border border-white/15 px-3 py-2 text-xs text-zinc-300 hover:bg-white/5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmLink}
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
