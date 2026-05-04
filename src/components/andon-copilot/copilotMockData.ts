import type { ProjectResultCardModel } from "./ProjectResultCard";

/** Demo rows when the catalog API is empty or unavailable so the UI still feels complete. */
export const MOCK_COPILOT_PROJECTS: ProjectResultCardModel[] = [
  {
    id: "mock-1",
    title: "DeskNote",
    slug: "desknote",
    description: "Focus-first notes with ambient motion and keyboard flow.",
    cover_image_url: null,
    tech_stack: ["Next.js", "React", "GSAP", "Supabase"],
  },
  {
    id: "mock-2",
    title: "Creative portfolio shell",
    slug: "portfolio",
    description: "Glass UI, AG-UI copilot, and live site mirroring.",
    cover_image_url: null,
    tech_stack: ["Next.js", "Tailwind", "AI", "Three.js"],
  },
  {
    id: "mock-3",
    title: "Motion study",
    slug: "motion-study",
    description: "Scroll-linked scenes and micro-interactions.",
    cover_image_url: null,
    tech_stack: ["GSAP", "React", "R3F"],
  },
];
