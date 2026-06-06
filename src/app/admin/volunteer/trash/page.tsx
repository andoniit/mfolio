import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ExperienceTrashActions from "@/components/admin/ExperienceTrashActions";

export const dynamic = "force-dynamic";

export default async function VolunteerTrashPage() {
  const { data: roles, error } = await supabaseAdmin
    .from("experiences")
    .select("*")
    .eq("category", "volunteer")
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
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Voluntary roles trash</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Restore a role to bring it back, or delete forever. Trashed roles are hidden from the
            live site.
          </p>
        </div>
        <Link
          href="/admin/volunteer"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 shrink-0"
        >
          Back to voluntary roles
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
        {roles?.length ? (
          roles.map((role) => (
            <div
              key={role.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5"
            >
              <div className="min-w-0">
                <h2 className="font-semibold text-gray-900 truncate">
                  {role.title || "Untitled"}
                  {role.company ? (
                    <span className="text-gray-400 font-normal"> · {role.company}</span>
                  ) : null}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Trashed on {role.trashed_at ? formatDate(role.trashed_at) : "—"}
                </p>
              </div>

              <ExperienceTrashActions experienceId={role.id} />
            </div>
          ))
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">No voluntary roles in trash.</div>
        )}
      </div>
    </main>
  );
}
