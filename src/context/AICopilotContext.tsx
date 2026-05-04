"use client";

import { HttpAgent } from "@ag-ui/client";
import type { Message } from "@ag-ui/core";
import { usePathname, useRouter } from "next/navigation";
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
import {
  DEFAULT_PORTFOLIO_COPILOT_STATE,
  type PortfolioCopilotRootState,
  type PortfolioCopilotState,
} from "@/lib/ai/portfolioCopilotState";
import { createPortfolioCopilotHttpAgent } from "@/lib/ai/aguiClient";
import { randomUUID } from "@/lib/random-id";
import { navigatePreviewOrApp, scrollToSectionInPreviewOrPage } from "@/lib/copilot-portfolio-preview";

type AICopilotContextValue = {
  messages: Message[];
  /** AG-UI shared state root (`state.portfolio` is what the portfolio UI binds to). */
  rootState: PortfolioCopilotRootState;
  isRunning: boolean;
  /** Sends a user message and streams the agent run (AG-UI SSE). */
  sendUserMessage: (text: string) => Promise<void>;
  /** Clears transcript and resets shared portfolio UI state (keeps thread id). */
  clearChat: () => void;
  abort: () => void;
  /** On `/andon-copilot`, agent `openInternalLink` is held until the visitor approves. */
  pendingAgentNavigation: string | null;
  approvePendingAgentNavigation: () => void;
  dismissPendingAgentNavigation: () => void;
};

const AICopilotContext = createContext<AICopilotContextValue | null>(null);

function readThreadId(): string {
  const key = "mf:copilot:threadId";
  try {
    const existing = window.localStorage.getItem(key);
    if (existing) return existing;
    const id = randomUUID();
    window.localStorage.setItem(key, id);
    return id;
  } catch {
    return randomUUID();
  }
}

export function AICopilotProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname() ?? "/";

  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [rootState, setRootState] = useState<PortfolioCopilotRootState>({
    portfolio: { ...DEFAULT_PORTFOLIO_COPILOT_STATE },
  });
  const [isRunning, setIsRunning] = useState(false);
  const [pendingAgentNavigation, setPendingAgentNavigation] = useState<string | null>(null);

  const agentRef = useRef<HttpAgent | null>(null);

  useEffect(() => setMounted(true), []);

  const threadId = useMemo(() => {
    if (!mounted) return "";
    return readThreadId();
  }, [mounted]);

  useEffect(() => {
    if (!mounted || !threadId) return;
    agentRef.current = createPortfolioCopilotHttpAgent(threadId);
    setMessages([...agentRef.current.messages]);
    setRootState(agentRef.current.state as PortfolioCopilotRootState);

    const agent = agentRef.current;
    // AG-UI: HttpAgent subscribers mirror streamed transcript + shared state into React.
    const sub = agent.subscribe({
      onMessagesChanged: ({ messages: next }) => setMessages([...next]),
      onStateChanged: ({ state: next }) => setRootState(next as PortfolioCopilotRootState),
    });

    return () => sub.unsubscribe();
  }, [mounted, threadId]);

  // Keep pathname in shared agent state so the model can ground tool calls.
  useEffect(() => {
    const agent = agentRef.current;
    if (!agent) return;
    const prev = agent.state as PortfolioCopilotRootState;
    agent.setState({
      ...prev,
      portfolio: {
        ...DEFAULT_PORTFOLIO_COPILOT_STATE,
        ...prev.portfolio,
        pathname,
      },
    });
  }, [pathname]);

  // Portfolio UI side-effects (scroll / navigate) driven by AG-UI STATE_SNAPSHOT updates.
  useEffect(() => {
    const p = rootState.portfolio as PortfolioCopilotState;
    if (p.scrollToSectionId) {
      const id = p.scrollToSectionId;
      requestAnimationFrame(() => {
        scrollToSectionInPreviewOrPage(id);
      });
      const agent = agentRef.current;
      if (agent) {
        const s = agent.state as PortfolioCopilotRootState;
        // Clear preview mirror filters so CopilotPreviewStateSync does not point the
        // iframe back at `/projects` or `/blog` and undo navigation to `/` + scroll.
        agent.setState({
          ...s,
          portfolio: {
            ...s.portfolio,
            scrollToSectionId: null,
            projectQuery: null,
            projectTech: null,
            highlightedProjectIds: [],
            blogQuery: null,
            filteredBlogPostIds: null,
            highlightedBlogPostIds: [],
          },
        });
      }
    }
  }, [rootState.portfolio.scrollToSectionId]);

  useEffect(() => {
    const p = rootState.portfolio as PortfolioCopilotState;
    if (!p.navigateTo) return;
    const path = p.navigateTo;
    const agent = agentRef.current;
    const clearNavOnAgent = () => {
      if (!agent) return;
      const s = agent.state as PortfolioCopilotRootState;
      agent.setState({
        ...s,
        portfolio: { ...s.portfolio, navigateTo: null },
      });
      setRootState(agent.state as PortfolioCopilotRootState);
    };

    // Preview iframe is the intended surface on `/andon-copilot`; navigate it directly
    // so tools like openInternalLink("/projects") work without an extra approval step.
    if (pathname === "/andon-copilot") {
      navigatePreviewOrApp(path, (pth) => router.push(pth));
      clearNavOnAgent();
      return;
    }

    navigatePreviewOrApp(path, (pth) => router.push(pth));
    clearNavOnAgent();
  }, [rootState.portfolio.navigateTo, router, pathname]);

  const RUN_TIMEOUT_MS = 120_000;

  const sendUserMessage = useCallback(async (text: string) => {
    const agent = agentRef.current;
    if (!agent) return;
    const trimmed = text.trim();
    if (!trimmed) return;

    const prevRoot = agent.state as PortfolioCopilotRootState;
    agent.setState({
      ...prevRoot,
      portfolio: {
        ...prevRoot.portfolio,
        assistantStatus: "idle",
        errorMessage: null,
      },
    });
    setRootState(agent.state as PortfolioCopilotRootState);

    setIsRunning(true);
    try {
      agent.addMessage({
        id: randomUUID(),
        role: "user",
        content: trimmed,
      });

      const runPromise = agent.runAgent({});
      const timeoutPromise = new Promise<never>((_, reject) => {
        window.setTimeout(() => reject(new Error("Request timed out. Try again in a moment.")), RUN_TIMEOUT_MS);
      });

      await Promise.race([runPromise, timeoutPromise]);
    } catch (e) {
      console.error(e);
      const message = e instanceof Error ? e.message : String(e);
      try {
        agentRef.current?.abortRun();
      } catch {
        /* ignore */
      }
      setRootState((prev) => ({
        ...prev,
        portfolio: {
          ...prev.portfolio,
          assistantStatus: "error",
          errorMessage: message,
        },
      }));
    } finally {
      setIsRunning(false);
      if (agentRef.current) {
        setMessages([...agentRef.current.messages]);
        setRootState(agentRef.current.state as PortfolioCopilotRootState);
      }
    }
  }, []);

  const abort = useCallback(() => {
    agentRef.current?.abortRun();
    setIsRunning(false);
  }, []);

  const approvePendingAgentNavigation = useCallback(() => {
    const path = pendingAgentNavigation;
    if (!path) return;
    setPendingAgentNavigation(null);
    navigatePreviewOrApp(path, (pth) => router.push(pth));
  }, [pendingAgentNavigation, router]);

  const dismissPendingAgentNavigation = useCallback(() => {
    setPendingAgentNavigation(null);
  }, []);

  const clearChat = useCallback(() => {
    const agent = agentRef.current;
    if (!agent) return;
    const pathForState = (agent.state as PortfolioCopilotRootState).portfolio.pathname ?? "/";
    agent.setMessages([]);
    agent.setState({
      portfolio: {
        ...DEFAULT_PORTFOLIO_COPILOT_STATE,
        pathname: pathForState,
      },
    } as PortfolioCopilotRootState);
    setMessages([]);
    setRootState(agent.state as PortfolioCopilotRootState);
    setPendingAgentNavigation(null);
  }, []);

  const value = useMemo<AICopilotContextValue>(
    () => ({
      messages,
      rootState,
      isRunning,
      sendUserMessage,
      clearChat,
      abort,
      pendingAgentNavigation,
      approvePendingAgentNavigation,
      dismissPendingAgentNavigation,
    }),
    [
      messages,
      rootState,
      isRunning,
      sendUserMessage,
      clearChat,
      abort,
      pendingAgentNavigation,
      approvePendingAgentNavigation,
      dismissPendingAgentNavigation,
    ]
  );

  return <AICopilotContext.Provider value={value}>{children}</AICopilotContext.Provider>;
}

export function useAICopilotContext() {
  const ctx = useContext(AICopilotContext);
  if (!ctx) {
    throw new Error("useAICopilotContext must be used within AICopilotProvider");
  }
  return ctx;
}

/** Safe for components that may render outside `AICopilotProvider` (copilot props become inert). */
export function useOptionalAICopilotContext() {
  return useContext(AICopilotContext);
}
