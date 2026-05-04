import { useOptionalAICopilotContext } from "@/context/AICopilotContext";
import {
  DEFAULT_PORTFOLIO_COPILOT_STATE,
  type PortfolioCopilotState,
} from "@/lib/ai/portfolioCopilotState";

/**
 * Read-only view of copilot-driven portfolio UI state (safe outside the provider).
 */
export function usePortfolioActions(): {
  portfolio: PortfolioCopilotState;
  hasCopilot: boolean;
} {
  const ctx = useOptionalAICopilotContext();
  return {
    portfolio: ctx?.rootState.portfolio ?? DEFAULT_PORTFOLIO_COPILOT_STATE,
    hasCopilot: Boolean(ctx),
  };
}
