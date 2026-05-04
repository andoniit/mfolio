import { HttpAgent } from "@ag-ui/client";
import {
  DEFAULT_PORTFOLIO_COPILOT_STATE,
  type PortfolioCopilotRootState,
} from "@/lib/ai/portfolioCopilotState";

/**
 * AG-UI HttpAgent: POSTs RunAgentInput to `/api/ai-copilot` with `Accept: text/event-stream`
 * and applies streamed AG-UI events (messages + shared state).
 */
export function createPortfolioCopilotHttpAgent(threadId: string) {
  return new HttpAgent({
    url: "/api/ai-copilot",
    threadId,
    initialState: {
      portfolio: { ...DEFAULT_PORTFOLIO_COPILOT_STATE },
    } as PortfolioCopilotRootState,
  });
}
