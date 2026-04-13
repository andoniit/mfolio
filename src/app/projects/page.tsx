import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import ProjectGrid from "@/components/projects/ProjectGrid";
import "../blog/blog.scss";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Projects",
  description:
    "Browse selected software projects by Anirudha Kapileshwari, including product builds, experiments, and case studies.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | Anirudha Kapileshwari",
    description:
      "Browse selected software projects by Anirudha Kapileshwari, including product builds, experiments, and case studies.",
    type: "website",
    url: "/projects",
  },
};

export default async function ProjectsPage() {
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id, title, slug, description, external_url, cover_image_url, project_date, published_at, tech_stack, workplace, client_name"
    )
    .eq("published", true)
    .is("trashed_at", null)
    .order("project_date", { ascending: false, nullsFirst: false });

  if (error) {
    throw new Error("Failed to fetch projects");
  }

  return (
    <div className="blog-wrapper">
      <Header />
      <main className="blog-page-container">
        <div className="blog-content-max">
          <h1 className="blog-page-title">Projects & Selected Work</h1>
          <ProjectGrid projects={projects || []} />
        </div>
      </main>
    </div>
  );
}