import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ProjectForm from "@/components/projects/ProjectForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params;

  const [
    { data: project, error },
    { data: galleryRows },
  ] = await Promise.all([
    supabaseAdmin.from("projects").select("*").eq("id", id).single(),
    supabaseAdmin
      .from("project_images")
      .select("image_url, alt_text, sort_order")
      .eq("project_id", id)
      .order("sort_order", { ascending: true }),
  ]);

  if (error || !project) {
    notFound();
  }

  if (project.trashed_at) {
    redirect("/admin/projects/trash");
  }

  const gallery_images =
    galleryRows?.map((row) => ({
      image_url: row.image_url,
      alt_text: row.alt_text || "",
    })) ?? [];

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 font-sans">
      <div className="mb-8">
        <Link
          href="/admin/projects"
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4 inline-flex items-center gap-1"
        >
          <span>&larr;</span> Back to projects
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit project</h1>
      </div>

      <ProjectForm
        projectId={id}
        initialData={{ ...project, gallery_images }}
      />
    </main>
  );
}
