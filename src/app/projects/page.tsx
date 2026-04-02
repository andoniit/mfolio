import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import ProjectGrid from "@/components/projects/ProjectGrid";
import "../blog/blog.scss";

export const dynamic = "force-dynamic";

export default async function ProjectsPage() {
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("id, title, slug, description, cover_image_url, project_date, published_at, tech_stack")
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
          <h1 className="blog-page-title">Projects</h1>
          <ProjectGrid projects={projects || []} />
        </div>
      </main>
    </div>
  );
}