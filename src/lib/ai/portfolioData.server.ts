import { supabaseAdmin } from "@/lib/supabase-admin";

export type PortfolioProjectRecord = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  tech_stack: string[] | null;
  workplace: string | null;
  client_name: string | null;
  project_date: string | null;
  external_url: string | null;
};

export type PortfolioBlogRecord = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  tagSlugs: string[];
  tagNames: string[];
};

/**
 * Loads public portfolio catalog from Supabase for copilot tools (server-only).
 */
export async function loadPortfolioCatalog(): Promise<{
  projects: PortfolioProjectRecord[];
  posts: PortfolioBlogRecord[];
}> {
  const [{ data: projects, error: projectsError }, { data: posts, error: postsError }] =
    await Promise.all([
      supabaseAdmin
        .from("projects")
        .select("id, title, slug, description, tech_stack, workplace, client_name, project_date, external_url")
        .eq("published", true)
        .is("trashed_at", null)
        .order("project_date", { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from("posts")
        .select(
          `
          id,
          title,
          slug,
          excerpt,
          published_at,
          post_tags (
            tags ( name, slug )
          )
        `
        )
        .eq("published", true)
        .is("trashed_at", null)
        .order("published_at", { ascending: false }),
    ]);

  if (projectsError) {
    throw new Error(projectsError.message);
  }
  if (postsError) {
    throw new Error(postsError.message);
  }

  const normalizedPosts: PortfolioBlogRecord[] = (posts ?? []).map((row: any) => {
    const tagSlugs: string[] = [];
    const tagNames: string[] = [];
    for (const pt of row.post_tags ?? []) {
      const slug = pt?.tags?.slug;
      const name = pt?.tags?.name;
      if (typeof slug === "string" && slug) tagSlugs.push(slug);
      if (typeof name === "string" && name) tagNames.push(name);
    }
    return {
      id: row.id,
      title: row.title,
      slug: row.slug,
      excerpt: row.excerpt ?? null,
      tagSlugs,
      tagNames,
    };
  });

  return {
    projects: (projects ?? []) as PortfolioProjectRecord[],
    posts: normalizedPosts,
  };
}
