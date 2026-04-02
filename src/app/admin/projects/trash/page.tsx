import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ProjectTrashActions from "@/components/admin/ProjectTrashActions";

export const dynamic = "force-dynamic";

export default async function ProjectsTrashPage() {
  const { data: projects, error } = await supabaseAdmin
    .from("projects")
    .select("*")
    .not("trashed_at", "is", null)
    .order("trashed_at", { ascending: false });

  if (error) {
    return <div className="p-6">Failed to load trash.</div>;
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Project trash</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Restore a project to bring it back, or delete forever. Trashed projects are hidden from the live site.
          </p>
        </div>
        <Link
          href="/admin/projects"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shrink-0"
        >
          Back to projects
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
        {projects?.length ? (
          projects.map((project) => (
            <div
              key={project.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {project.title || "Untitled"}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Trashed on {project.trashed_at ? formatDate(project.trashed_at) : "—"}
                </p>
              </div>

              <ProjectTrashActions projectId={project.id} />
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">No projects in trash.</div>
        )}
      </div>
    </main>
  );
}
