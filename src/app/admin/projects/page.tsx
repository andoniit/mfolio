import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ProjectListTrashButton from "@/components/admin/ProjectListTrashButton";

export const dynamic = "force-dynamic";

const formatDate = (dateString: string) =>
  new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

export default async function AdminProjectsPage() {
  const [
    { data: projects, error: projectsError },
    { count: trashCount, error: trashError },
  ] = await Promise.all([
    supabaseAdmin
      .from("projects")
      .select("*")
      .is("trashed_at", null)
      .order("updated_at", { ascending: false }),

    supabaseAdmin
      .from("projects")
      .select("*", { count: "exact", head: true })
      .not("trashed_at", "is", null),
  ]);

  if (projectsError || trashError) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-red-500 font-medium">
        Failed to load projects. Please try again.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Projects</h1>
          <p className="text-gray-500 mt-1 text-sm">Create, edit, and manage portfolio projects.</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/projects/trash"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Trash {trashCount ? `(${trashCount})` : ""}
          </Link>
          <Link
            href="/admin/projects/new"
            className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            + New project
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {projects?.length ? (
          <div className="divide-y divide-gray-100">
            {projects.map((project) => (
              <div
                key={project.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col mb-3 sm:mb-0">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-black transition-colors truncate max-w-lg">
                    {project.title || "Untitled"}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{formatDate(project.updated_at)}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      project.published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {project.published ? "Published" : "Draft"}
                  </span>

                  <Link
                    href={`/admin/projects/${project.id}`}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 hover:text-black transition-all sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  >
                    Edit
                  </Link>

                  <ProjectListTrashButton
                    projectId={project.id}
                    title={project.title || "Untitled"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <span className="text-2xl text-gray-400">📁</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No projects yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Add your first project to show it on the public projects page.
            </p>
            <Link
              href="/admin/projects/new"
              className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
            >
              Create a project
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
