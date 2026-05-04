"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { PortfolioCopilotRootState } from "@/lib/ai/portfolioCopilotState";
import { useAICopilotContext } from "@/context/AICopilotContext";

const INSPECTOR_KEY = "mf:copilot:aguiInspector";

export type AgUiMirrorEvent = {
  id: string;
  at: number;
  type: string;
  detail?: string;
  payload?: string;
};

type CopilotShowcaseContextValue = {
  events: AgUiMirrorEvent[];
  clearEvents: () => void;
  showInspector: boolean;
  setShowInspector: (v: boolean) => void;
};

const CopilotShowcaseContext = createContext<CopilotShowcaseContextValue | null>(null);

const MAX_EVENTS = 160;

function pushLine(
  set: React.Dispatch<React.SetStateAction<AgUiMirrorEvent[]>>,
  type: string,
  detail?: string,
  payload?: string
) {
  set((prev) => {
    const row: AgUiMirrorEvent = {
      id: `${Date.now()}-${prev.length}`,
      at: Date.now(),
      type,
      detail,
      payload: payload && payload.length > 2000 ? `${payload.slice(0, 1997)}…` : payload,
    };
    return [...prev, row].slice(-MAX_EVENTS);
  });
}

function snapshotSummary(state: PortfolioCopilotRootState): string {
  const p = state.portfolio;
  return JSON.stringify({
    assistantStatus: p.assistantStatus,
    agentActivityLabel: p.agentActivityLabel,
    lastToolCallName: p.lastToolCallName,
    projectQuery: p.projectQuery,
    projectTech: p.projectTech,
    highlightedCount: p.highlightedProjectIds.length,
    generatedCards: p.generatedCards.length,
    navigateTo: p.navigateTo,
    scrollToSectionId: p.scrollToSectionId,
  });
}

export function CopilotShowcaseProvider({ children }: { children: ReactNode }) {
  const { messages, rootState, isRunning } = useAICopilotContext();
  const [events, setEvents] = useState<AgUiMirrorEvent[]>([]);
  const [showInspector, setShowInspectorState] = useState(false);

  useEffect(() => {
    try {
      setShowInspectorState(window.localStorage.getItem(INSPECTOR_KEY) === "1");
    } catch {
      /* ignore */
    }
  }, []);

  const setShowInspector = useCallback((v: boolean) => {
    setShowInspectorState(v);
    try {
      window.localStorage.setItem(INSPECTOR_KEY, v ? "1" : "0");
    } catch {
      /* ignore */
    }
  }, []);

  const prevRunning = useRef(false);
  const prevMsgLen = useRef(0);
  const prevStateJson = useRef("");

  useEffect(() => {
    if (isRunning && !prevRunning.current) {
      pushLine(setEvents, "RUN_STARTED", "HttpAgent run started");
      pushLine(setEvents, "TEXT_MESSAGE_START", "User turn recorded");
    }
    if (!isRunning && prevRunning.current) {
      const err = rootState.portfolio.assistantStatus === "error";
      pushLine(setEvents, err ? "RUN_ERROR" : "RUN_FINISHED", err ? rootState.portfolio.errorMessage ?? "error" : "ok");
    }
    prevRunning.current = isRunning;
  }, [isRunning, rootState.portfolio.assistantStatus, rootState.portfolio.errorMessage]);

  useEffect(() => {
    if (messages.length > prevMsgLen.current) {
      const added = messages.slice(prevMsgLen.current);
      for (const m of added) {
        if (m.role === "user") {
          const t = typeof m.content === "string" ? m.content : "";
          pushLine(setEvents, "TEXT_MESSAGE_CONTENT", "user", t.slice(0, 400));
        } else if (m.role === "assistant") {
          const t = typeof m.content === "string" ? m.content : "";
          if (t.trim()) pushLine(setEvents, "TEXT_MESSAGE_CONTENT", "assistant delta", t.slice(0, 400));
        } else if (m.role === "tool") {
          const raw = typeof m.content === "string" ? m.content : "";
          pushLine(setEvents, "TOOL_CALL_END", "tool result", raw.slice(0, 800));
        }
      }
    }
    prevMsgLen.current = messages.length;
  }, [messages]);

  useEffect(() => {
    const snap = snapshotSummary(rootState);
    if (snap !== prevStateJson.current) {
      prevStateJson.current = snap;
      pushLine(setEvents, "STATE_SNAPSHOT", "portfolio slice", snap);
    }
  }, [rootState]);

  const clearEvents = useCallback(() => setEvents([]), []);

  const value = useMemo(
    () => ({
      events,
      clearEvents,
      showInspector,
      setShowInspector,
    }),
    [events, clearEvents, showInspector, setShowInspector]
  );

  return <CopilotShowcaseContext.Provider value={value}>{children}</CopilotShowcaseContext.Provider>;
}

export function useCopilotShowcaseContext() {
  const ctx = useContext(CopilotShowcaseContext);
  if (!ctx) {
    throw new Error("useCopilotShowcaseContext must be used within CopilotShowcaseProvider");
  }
  return ctx;
}
