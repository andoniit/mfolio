import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import ExperienceListTrashButton from "@/components/admin/ExperienceListTrashButton";

export const dynamic = "force-dynamic";

const formatMonth = (value: string | null) => {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(parsed);
};

const formatRange = (start: string | null, end: string | null, isCurrent: boolean) => {
  const startLabel = formatMonth(start) || "—";
  const endLabel = isCurrent ? "Present" : formatMonth(end) || "—";
  return `${startLabel} – ${endLabel}`;
};

export default async function AdminExperiencePage() {
  const [
    { data: experiences, error: listError },
    { count: trashCount, error: trashError },
  ] = await Promise.all([
    supabaseAdmin
      .from("experiences")
      .select("*")
      .eq("category", "work")
      .is("trashed_at", null)
      .order("sort_order", { ascending: true })
      .order("start_date", { ascending: false, nullsFirst: false }),

    supabaseAdmin
      .from("experiences")
      .select("*", { count: "exact", head: true })
      .eq("category", "work")
      .not("trashed_at", "is", null),
  ]);

  if (listError || trashError) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-red-500 font-medium">
        Failed to load experience. Make sure the `experiences` table exists in Supabase.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Experience</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Create, edit, and manage your work history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/experience/trash"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Trash {trashCount ? `(${trashCount})` : ""}
          </Link>
          <Link
            href="/admin/experience/new"
            className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            + New experience
          </Link>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {experiences?.length ? (
          <div className="divide-y divide-gray-100">
            {experiences.map((experience) => (
              <div
                key={experience.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                <div className="flex flex-col mb-3 sm:mb-0 min-w-0">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-black transition-colors truncate max-w-lg">
                    {experience.title || "Untitled"}
                    {experience.company ? (
                      <span className="text-gray-400 font-normal"> · {experience.company}</span>
                    ) : null}
                  </h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-gray-500">
                    <span>
                      {formatRange(
                        experience.start_date,
                        experience.end_date,
                        experience.is_current
                      )}
                    </span>
                    {experience.location ? (
                      <span className="text-gray-400">· {experience.location}</span>
                    ) : null}
                    {experience.employment_type ? (
                      <span className="text-gray-400">· {experience.employment_type}</span>
                    ) : null}
                  </div>
                </div>

                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                  {experience.is_current ? (
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border bg-blue-50 text-blue-700 border-blue-200">
                      Current
                    </span>
                  ) : null}

                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      experience.published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {experience.published ? "Published" : "Draft"}
                  </span>

                  <Link
                    href={`/admin/experience/${experience.id}`}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 hover:text-black transition-all sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  >
                    Edit
                  </Link>

                  <ExperienceListTrashButton
                    experienceId={experience.id}
                    title={experience.title || "Untitled"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <span className="text-2xl text-gray-400">💼</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No experience yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              Add your first role to build out your work history.
            </p>
            <Link
              href="/admin/experience/new"
              className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
            >
              Create an experience
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
