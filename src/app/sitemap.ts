import type { MetadataRoute } from "next";
import { supabaseAdmin } from "@/lib/supabase-admin";

const getSiteBase = () =>
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteBase = getSiteBase();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${siteBase}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${siteBase}/blog`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${siteBase}/projects`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  try {
    const [postsRes, projectsRes, categoriesRes, tagsRes] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("slug, updated_at, published_at")
        .eq("published", true)
        .is("trashed_at", null),
      supabaseAdmin
        .from("projects")
        .select("slug, updated_at, published_at")
        .eq("published", true)
        .is("trashed_at", null),
      supabaseAdmin.from("categories").select("slug, updated_at"),
      supabaseAdmin.from("tags").select("slug, updated_at"),
    ]);

    const posts = (postsRes.data || []).map((post) => ({
      url: `${siteBase}/blog/${post.slug}`,
      lastModified: post.updated_at || post.published_at || now.toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.75,
    }));

    const projects = (projectsRes.data || []).map((project) => ({
      url: `${siteBase}/projects/${project.slug}`,
      lastModified: project.updated_at || project.published_at || now.toISOString(),
      changeFrequency: "monthly" as const,
      priority: 0.8,
    }));

    const categories = (categoriesRes.data || []).map((category) => ({
      url: `${siteBase}/category/${category.slug}`,
      lastModified: category.updated_at || now.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    }));

    const tags = (tagsRes.data || []).map((tag) => ({
      url: `${siteBase}/tag/${tag.slug}`,
      lastModified: tag.updated_at || now.toISOString(),
      changeFrequency: "weekly" as const,
      priority: 0.55,
    }));

    return [...staticRoutes, ...posts, ...projects, ...categories, ...tags];
  } catch {
    return staticRoutes;
  }
}
