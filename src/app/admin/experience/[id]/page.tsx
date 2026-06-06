import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import ExperienceForm from "@/components/experience/ExperienceForm";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditExperiencePage({ params }: Props) {
  const { id } = await params;

  const { data: experience, error } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !experience) {
    notFound();
  }

  if (experience.trashed_at) {
    redirect("/admin/experience/trash");
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12 font-sans">
      <div className="mb-8">
        <Link
          href="/admin/experience"
          className="text-sm font-medium text-gray-500 hover:text-black transition-colors mb-4 inline-flex items-center gap-1"
        >
          <span>&larr;</span> Back to experience
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Edit experience</h1>
      </div>

      <ExperienceForm experienceId={id} initialData={experience} />
    </main>
  );
}
