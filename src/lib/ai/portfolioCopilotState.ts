/**
 * Shared frontend ↔ agent state for the portfolio copilot (AG-UI STATE_SNAPSHOT / STATE_DELTA).
 * The agent route merges updates into `state.portfolio` while a run is in progress.
 */
export type PortfolioCopilotAssistantStatus =
  | "idle"
  | "thinking"
  | "streaming"
  | "error";

/** Generative UI: project cards mirrored from tool results into shared AG-UI state. */
export type PortfolioCopilotGeneratedCard = {
  slug: string;
  title: string;
  description?: string | null;
  tech_stack?: string[];
  matchReason: string;
  external_url?: string | null;
};

export type PortfolioCopilotState = {
  /** Current pathname from the client (Next.js), e.g. `/projects`. */
  pathname: string;
  /** Free-text filter for project titles/descriptions/slugs/tech. */
  projectQuery: string | null;
  /** Case-insensitive substring match against `tech_stack` entries. */
  projectTech: string | null;
  /** Project UUIDs to visually emphasize in grids. */
  highlightedProjectIds: string[];
  /** When set, the client scrolls to `document.getElementById(sectionId)` then clears. */
  scrollToSectionId: string | null;
  /** When set, the client navigates with Next router then clears. */
  navigateTo: string | null;
  /** Blog list filter from `searchBlogs` (title/excerpt/slug/tags). */
  blogQuery: string | null;
  /** When non-empty, blog grid shows only these post IDs (from tool results). */
  filteredBlogPostIds: string[] | null;
  /** Blog cards to visually emphasize (usually mirrors the last search results). */
  highlightedBlogPostIds: string[];
  lastToolResults: Array<{ name: string; summary: string }>;
  assistantStatus: PortfolioCopilotAssistantStatus;
  errorMessage: string | null;
  /** Short label of the visitor’s last ask (set at run start). */
  currentIntent: string | null;
  /** Human-readable agent step for the showcase UI. */
  agentActivityLabel: string | null;
  /** Name of the last executed portfolio tool. */
  lastToolCallName: string | null;
  /** Slug emphasized after getProjectDetails. */
  selectedProjectSlug: string | null;
  /** Cards for generative UI in the copilot chat / context. */
  generatedCards: PortfolioCopilotGeneratedCard[];
};

export const DEFAULT_PORTFOLIO_COPILOT_STATE: PortfolioCopilotState = {
  pathname: "/",
  projectQuery: null,
  projectTech: null,
  highlightedProjectIds: [],
  scrollToSectionId: null,
  navigateTo: null,
  blogQuery: null,
  filteredBlogPostIds: null,
  highlightedBlogPostIds: [],
  lastToolResults: [],
  assistantStatus: "idle",
  errorMessage: null,
  currentIntent: null,
  agentActivityLabel: null,
  lastToolCallName: null,
  selectedProjectSlug: null,
  generatedCards: [],
};

/** Allowed section ids for scrollToSection (matches FloatingBottomNav HOME_SECTIONS + common pages). */
export const PORTFOLIO_SECTION_IDS = [
  "hero-section",
  "about-me",
  "experience",
  "my-vision",
  "featured-projects",
  "my-desk-setup",
] as const;

export type PortfolioCopilotRootState = {
  portfolio: PortfolioCopilotState;
};
