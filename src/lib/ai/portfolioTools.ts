import type OpenAI from "openai";
import {
  DEFAULT_PORTFOLIO_COPILOT_STATE,
  PORTFOLIO_SECTION_IDS,
  type PortfolioCopilotRootState,
  type PortfolioCopilotState,
} from "@/lib/ai/portfolioCopilotState";
import type { PortfolioBlogRecord, PortfolioProjectRecord } from "@/lib/ai/portfolioData.server";

export const PORTFOLIO_COPILOT_TOOL_NAMES = [
  "searchProjects",
  "listAllProjects",
  "filterProjectsByTech",
  "getProjectDetails",
  "searchBlogs",
  "getResumeSummary",
  "scrollToSection",
  "highlightProjects",
  "highlightLatestProject",
  "openInternalLink",
] as const;

export type PortfolioCopilotToolName = (typeof PORTFOLIO_COPILOT_TOOL_NAMES)[number];

function normalizeTechList(tech: string[] | null | undefined): string[] {
  if (!Array.isArray(tech)) return [];
  return tech
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    .map((t) => t.trim());
}

function includesQuery(haystack: string, needle: string) {
  return haystack.toLowerCase().includes(needle.toLowerCase());
}

export function mergePortfolioState(
  prev: PortfolioCopilotRootState,
  patch: Partial<PortfolioCopilotState>
): PortfolioCopilotRootState {
  return {
    portfolio: {
      ...DEFAULT_PORTFOLIO_COPILOT_STATE,
      ...prev.portfolio,
      ...patch,
      highlightedProjectIds:
        patch.highlightedProjectIds ?? prev.portfolio.highlightedProjectIds,
      highlightedBlogPostIds:
        patch.highlightedBlogPostIds ?? prev.portfolio.highlightedBlogPostIds,
      filteredBlogPostIds:
        patch.filteredBlogPostIds !== undefined
          ? patch.filteredBlogPostIds
          : prev.portfolio.filteredBlogPostIds,
      lastToolResults: patch.lastToolResults ?? prev.portfolio.lastToolResults,
      currentIntent:
        patch.currentIntent !== undefined ? patch.currentIntent : prev.portfolio.currentIntent,
      agentActivityLabel:
        patch.agentActivityLabel !== undefined
          ? patch.agentActivityLabel
          : prev.portfolio.agentActivityLabel,
      lastToolCallName:
        patch.lastToolCallName !== undefined ? patch.lastToolCallName : prev.portfolio.lastToolCallName,
      selectedProjectSlug:
        patch.selectedProjectSlug !== undefined
          ? patch.selectedProjectSlug
          : prev.portfolio.selectedProjectSlug,
      generatedCards:
        patch.generatedCards !== undefined ? patch.generatedCards : prev.portfolio.generatedCards,
    },
  };
}

export function executePortfolioCopilotTool(input: {
  name: string;
  argsJson: string;
  catalog: { projects: PortfolioProjectRecord[]; posts: PortfolioBlogRecord[] };
  rootState: PortfolioCopilotRootState;
  resumePublicUrl: string | null;
}): { nextState: PortfolioCopilotRootState; toolMessage: string } {
  const { name, argsJson, catalog, rootState, resumePublicUrl } = input;
  let args: Record<string, unknown> = {};
  try {
    args = argsJson ? (JSON.parse(argsJson) as Record<string, unknown>) : {};
  } catch {
    return {
      nextState: mergePortfolioState(rootState, {
        assistantStatus: "thinking",
        errorMessage: `Invalid JSON arguments for tool ${name}`,
      }),
      toolMessage: JSON.stringify({ ok: false, error: "invalid_tool_arguments" }),
    };
  }

  const pushResult = (
    state: PortfolioCopilotRootState,
    summary: string,
    patch: Partial<PortfolioCopilotState>
  ) => {
    const next = mergePortfolioState(state, {
      ...patch,
      lastToolCallName: name,
      agentActivityLabel: summary,
      lastToolResults: [{ name, summary }, ...state.portfolio.lastToolResults].slice(0, 12),
    });
    return next;
  };

  switch (name as PortfolioCopilotToolName) {
    case "searchProjects": {
      const q = String(args.query ?? "").trim();
      const listAllKeywords = /^(all|every|everything|\*)$/i;
      // End-anchored so phrases like "show projects that use React" stay real searches.
      const looksLikeListAllIntent =
        !q ||
        listAllKeywords.test(q) ||
        /^show(\s+me)?\s+(all|every)(\s+my)?\s+projects?\s*$/i.test(q) ||
        /^show(\s+me)?\s+projects?\s*$/i.test(q) ||
        /^(all|every)(\s+my)?\s+projects?\s*$/i.test(q);
      if (looksLikeListAllIntent) {
        const next = pushResult(
          rootState,
          `Opened /projects with all ${catalog.projects.length} published project(s).`,
          {
            projectQuery: null,
            projectTech: null,
            highlightedProjectIds: [],
            blogQuery: null,
            filteredBlogPostIds: null,
            highlightedBlogPostIds: [],
            scrollToSectionId: null,
            navigateTo: "/projects",
            selectedProjectSlug: null,
            generatedCards: catalog.projects.slice(0, 12).map((p) => ({
              slug: p.slug,
              title: p.title,
              description: p.description,
              tech_stack: normalizeTechList(p.tech_stack),
              matchReason: "Published project (full catalog).",
              external_url: p.external_url ?? null,
            })),
          }
        );
        return {
          nextState: next,
          toolMessage: JSON.stringify({
            ok: true,
            all: true,
            count: catalog.projects.length,
            projects: catalog.projects.slice(0, 20).map((p) => ({
              id: p.id,
              title: p.title,
              slug: p.slug,
              tech_stack: normalizeTechList(p.tech_stack),
            })),
          }),
        };
      }
      const matches = catalog.projects.filter((p) => {
        const tech = normalizeTechList(p.tech_stack).join(" ");
        const blob = [p.title, p.description ?? "", p.slug, tech].join(" ");
        return includesQuery(blob, q);
      });
      const reason = `Matched “${q}” across title, description, slug, or tech labels.`;
      const next = pushResult(rootState, `Matched ${matches.length} project(s) for “${q}”.`, {
        projectQuery: q,
        highlightedProjectIds: matches.map((m) => m.id),
        blogQuery: null,
        filteredBlogPostIds: null,
        highlightedBlogPostIds: [],
        selectedProjectSlug: null,
        generatedCards: matches.slice(0, 8).map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          tech_stack: normalizeTechList(p.tech_stack),
          matchReason: reason,
          external_url: p.external_url ?? null,
        })),
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          count: matches.length,
          projects: matches.slice(0, 12).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            tech_stack: normalizeTechList(p.tech_stack),
          })),
        }),
      };
    }
    case "listAllProjects": {
      const next = pushResult(
        rootState,
        `Opened /projects with all ${catalog.projects.length} published project(s).`,
        {
          projectQuery: null,
          projectTech: null,
          highlightedProjectIds: [],
          blogQuery: null,
          filteredBlogPostIds: null,
          highlightedBlogPostIds: [],
          scrollToSectionId: null,
          navigateTo: "/projects",
          selectedProjectSlug: null,
          generatedCards: catalog.projects.slice(0, 12).map((p) => ({
            slug: p.slug,
            title: p.title,
            description: p.description,
            tech_stack: normalizeTechList(p.tech_stack),
            matchReason: "Published project (full catalog).",
            external_url: p.external_url ?? null,
          })),
        }
      );
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          count: catalog.projects.length,
          projects: catalog.projects.slice(0, 20).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            tech_stack: normalizeTechList(p.tech_stack),
          })),
        }),
      };
    }
    case "filterProjectsByTech": {
      const tech = String(args.tech ?? "").trim();
      if (!tech) {
        const next = pushResult(rootState, "Cleared tech filter.", {
          projectTech: null,
          highlightedProjectIds: [],
          generatedCards: [],
          selectedProjectSlug: null,
        });
        return { nextState: next, toolMessage: JSON.stringify({ ok: true, cleared: true }) };
      }
      const needle = tech.toLowerCase();
      const matches = catalog.projects.filter((p) =>
        normalizeTechList(p.tech_stack).some((t) => t.toLowerCase().includes(needle))
      );
      const reason = `Tech stack contains “${tech}”.`;
      const next = pushResult(rootState, `Matched ${matches.length} project(s) using “${tech}”.`, {
        projectTech: tech,
        highlightedProjectIds: matches.map((m) => m.id),
        blogQuery: null,
        filteredBlogPostIds: null,
        highlightedBlogPostIds: [],
        selectedProjectSlug: null,
        generatedCards: matches.slice(0, 8).map((p) => ({
          slug: p.slug,
          title: p.title,
          description: p.description,
          tech_stack: normalizeTechList(p.tech_stack),
          matchReason: reason,
          external_url: p.external_url ?? null,
        })),
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          count: matches.length,
          projects: matches.slice(0, 12).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            tech_stack: normalizeTechList(p.tech_stack),
          })),
        }),
      };
    }
    case "getProjectDetails": {
      const slug = String(args.slug ?? "").trim();
      if (!slug) {
        return {
          nextState: pushResult(rootState, "Missing slug.", {}),
          toolMessage: JSON.stringify({ ok: false, error: "slug_required" }),
        };
      }
      const p = catalog.projects.find((x) => x.slug === slug);
      if (!p) {
        return {
          nextState: pushResult(rootState, `No project with slug “${slug}”.`, {}),
          toolMessage: JSON.stringify({ ok: false, error: "not_found", slug }),
        };
      }
      const next = pushResult(rootState, `Loaded “${p.title}”.`, {
        highlightedProjectIds: [p.id],
        selectedProjectSlug: p.slug,
        generatedCards: [
          {
            slug: p.slug,
            title: p.title,
            description: p.description,
            tech_stack: normalizeTechList(p.tech_stack),
            matchReason: "Opened via getProjectDetails.",
            external_url: p.external_url ?? null,
          },
        ],
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          project: {
            id: p.id,
            title: p.title,
            slug: p.slug,
            description: p.description,
            tech_stack: normalizeTechList(p.tech_stack),
            workplace: p.workplace,
            client_name: p.client_name,
            project_date: p.project_date,
            path: `/projects/${p.slug}`,
            external_url: p.external_url ?? null,
          },
        }),
      };
    }
    case "searchBlogs": {
      const q = String(args.query ?? "").trim();
      if (!q) {
        const next = pushResult(rootState, "Cleared blog filters.", {
          blogQuery: null,
          filteredBlogPostIds: null,
          highlightedBlogPostIds: [],
          projectQuery: null,
          projectTech: null,
          highlightedProjectIds: [],
          generatedCards: [],
          selectedProjectSlug: null,
        });
        return { nextState: next, toolMessage: JSON.stringify({ ok: true, cleared: true }) };
      }
      const matches = catalog.posts.filter((p) => {
        const tags = [...p.tagNames, ...p.tagSlugs].join(" ");
        const blob = [p.title, p.excerpt ?? "", p.slug, tags].join(" ");
        return includesQuery(blob, q);
      });
      const ids = matches.map((m) => m.id);
      const next = pushResult(rootState, `Matched ${matches.length} post(s) for “${q}”.`, {
        blogQuery: q,
        filteredBlogPostIds: ids,
        highlightedBlogPostIds: ids,
        projectQuery: null,
        projectTech: null,
        highlightedProjectIds: [],
        generatedCards: [],
        selectedProjectSlug: null,
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          count: matches.length,
          posts: matches.slice(0, 12).map((p) => ({
            id: p.id,
            title: p.title,
            slug: p.slug,
            path: `/blog/${p.slug}`,
          })),
        }),
      };
    }
    case "getResumeSummary": {
      const summary =
        "I’m Anirudha Kapileshwari (nickname Andon). I build polished web experiences on anikap.tech—interaction quality, performance, and motion—with strong visual instincts. When the visitor asks to open my résumé PDF, point them to resumeUrl (opens in a new tab) or the chat “Open resume” action; do not invent a different PDF link.";
      const next = pushResult(rootState, "Résumé summary prepared.", {
        generatedCards: [],
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          summary,
          resumeUrl: resumePublicUrl,
          note: resumePublicUrl
            ? "Use resumeUrl for a direct PDF link when helpful."
            : "Resume file is not currently published (no public URL).",
        }),
      };
    }
    case "scrollToSection": {
      const sectionId = String(args.sectionId ?? "").trim();
      const allowed = PORTFOLIO_SECTION_IDS as readonly string[];
      if (!sectionId || !allowed.includes(sectionId)) {
        return {
          nextState: pushResult(rootState, "Invalid or missing section id.", {}),
          toolMessage: JSON.stringify({
            ok: false,
            error: "invalid_section",
            allowed,
          }),
        };
      }
      const next = pushResult(rootState, `Requested scroll to #${sectionId}.`, {
        scrollToSectionId: sectionId,
        generatedCards: [],
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({ ok: true, sectionId }),
      };
    }
    case "highlightProjects": {
      const ids = Array.isArray(args.projectIds) ? args.projectIds : [];
      const cleaned = ids.filter((id): id is string => typeof id === "string" && id.length > 0);
      const next = pushResult(rootState, `Highlighted ${cleaned.length} project(s).`, {
        highlightedProjectIds: cleaned,
        generatedCards: [],
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({ ok: true, projectIds: cleaned }),
      };
    }
    case "highlightLatestProject": {
      const latest = catalog.projects[0];
      if (!latest) {
        return {
          nextState: pushResult(rootState, "No published projects in catalog.", {}),
          toolMessage: JSON.stringify({ ok: false, error: "no_projects" }),
        };
      }
      const next = pushResult(rootState, `Highlighted latest project “${latest.title}”.`, {
        projectQuery: null,
        projectTech: null,
        highlightedProjectIds: [latest.id],
        blogQuery: null,
        filteredBlogPostIds: null,
        highlightedBlogPostIds: [],
        scrollToSectionId: null,
        navigateTo: "/projects",
        selectedProjectSlug: latest.slug,
        generatedCards: [
          {
            slug: latest.slug,
            title: latest.title,
            description: latest.description,
            tech_stack: normalizeTechList(latest.tech_stack),
            matchReason: "Most recently dated published project in the catalog.",
            external_url: latest.external_url ?? null,
          },
        ],
      });
      return {
        nextState: next,
        toolMessage: JSON.stringify({
          ok: true,
          project: {
            id: latest.id,
            title: latest.title,
            slug: latest.slug,
            tech_stack: normalizeTechList(latest.tech_stack),
          },
        }),
      };
    }
    case "openInternalLink": {
      const path = String(args.path ?? "").trim();
      if (!path.startsWith("/") || path.startsWith("//") || path.includes("://")) {
        return {
          nextState: pushResult(rootState, "Blocked unsafe navigation path.", {}),
          toolMessage: JSON.stringify({ ok: false, error: "invalid_path" }),
        };
      }
      const isProjects = path === "/projects" || path.startsWith("/projects/");
      const isBlog = path === "/blog" || path.startsWith("/blog/");
      const isHome = path === "/" || path === "";
      const mirrorPatch: Partial<PortfolioCopilotState> = {
        navigateTo: path,
        scrollToSectionId: null,
        generatedCards: [],
      };
      if (isProjects || isHome) {
        mirrorPatch.projectQuery = null;
        mirrorPatch.projectTech = null;
        mirrorPatch.highlightedProjectIds = [];
      }
      if (isBlog || isHome) {
        mirrorPatch.blogQuery = null;
        mirrorPatch.filteredBlogPostIds = null;
        mirrorPatch.highlightedBlogPostIds = [];
      }
      const next = pushResult(rootState, `Navigate to ${path}`, mirrorPatch);
      return {
        nextState: next,
        toolMessage: JSON.stringify({ ok: true, path }),
      };
    }
    default:
      return {
        nextState: mergePortfolioState(rootState, {
          errorMessage: `Unknown tool: ${name}`,
        }),
        toolMessage: JSON.stringify({ ok: false, error: "unknown_tool", name }),
      };
  }
}

export const portfolioCopilotOpenAITools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "searchProjects",
      description:
        "Search projects by keywords across title, description, slug, and tech stack labels. If the visitor asks to show all projects, list every project, or omits a query, call with query \"all\" or an empty string — that opens `/projects` with no filters and lists the full catalog.",
      parameters: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "Search string (e.g. “react”, “gsap”, “AI”). Use \"all\" or leave empty to show every published project on `/projects`.",
          },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "listAllProjects",
      description:
        "Show every published project: clears copilot filters, navigates the preview to `/projects`, and returns the full catalog for the answer. Prefer this (or searchProjects with query \"all\") when the visitor says “show me projects”, “show all projects”, or similar.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "filterProjectsByTech",
      description:
        "Filter projects where tech_stack contains a substring (case-insensitive). In the copilot preview this opens the `/projects` grid with that filter — not the homepage “Featured projects” strip. Use scrollToSection with sectionId `featured-projects` for the homepage section.",
      parameters: {
        type: "object",
        properties: {
          tech: { type: "string", description: "Technology substring, e.g. “GSAP”, “React”." },
        },
        required: ["tech"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getProjectDetails",
      description: "Fetch structured details for a single project by slug.",
      parameters: {
        type: "object",
        properties: { slug: { type: "string" } },
        required: ["slug"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "searchBlogs",
      description: "Search blog posts by keywords across title, excerpt, slug, and tags.",
      parameters: {
        type: "object",
        properties: { query: { type: "string" } },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "getResumeSummary",
      description:
        "Return a short first-person résumé summary and resumeUrl (public PDF) when available. Use for résumé / PDF questions.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "scrollToSection",
      description:
        "Scroll the visitor to a homepage section by id. In the copilot preview, if they are on another route (e.g. `/projects`), the client loads `/` first then scrolls — still call this tool when they ask for Experience, featured work, etc.",
      parameters: {
        type: "object",
        properties: {
          sectionId: {
            type: "string",
            enum: [...PORTFOLIO_SECTION_IDS],
          },
        },
        required: ["sectionId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "highlightProjects",
      description: "Highlight specific projects in grids by UUID.",
      parameters: {
        type: "object",
        properties: {
          projectIds: { type: "array", items: { type: "string" } },
        },
        required: ["projectIds"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "highlightLatestProject",
      description:
        "Highlight the most recently dated published project (first row in the server catalog). Opens `/projects` in the preview with that card emphasized. Use when the visitor asks for the latest / newest / current flagship project.",
      parameters: { type: "object", properties: {} },
    },
  },
  {
    type: "function",
    function: {
      name: "openInternalLink",
      description: "Ask the client to navigate to an internal path like `/projects/foo` or `/blog/bar`.",
      parameters: {
        type: "object",
        properties: { path: { type: "string" } },
        required: ["path"],
      },
    },
  },
];
