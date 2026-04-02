import Link from "next/link";
import ProjectForm from "@/components/projects/ProjectForm";

export const dynamic = "force-dynamic";

export default function NewProjectPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-12 font-sans">
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4 inline-flex items-center gap-1"
        >
          <span>&larr;</span> Back to projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">New project</h1>
      </div>

      <ProjectForm />
    </main>
  );
}
