import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import RecommendationActions from "@/components/admin/RecommendationActions";
import {
  NOTE_COLORS,
  initialsFromName,
  normalizeColor,
  type Recommendation,
} from "@/lib/recommendations";

export const dynamic = "force-dynamic";

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

function NoteCard({ rec }: { rec: Recommendation }) {
  const palette = NOTE_COLORS[normalizeColor(rec.color)];
  return (
    <div className="flex flex-col sm:flex-row gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Sticky-note preview */}
      <div
        className="shrink-0 w-full sm:w-64 rounded-md p-4 flex flex-col gap-3"
        style={{ background: palette.bg, color: palette.ink, border: `1px solid ${palette.edge}` }}
      >
        <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap break-words m-0">
          {rec.message}
        </p>
        <div className="flex items-center gap-2 pt-2 mt-auto border-t border-dashed" style={{ borderColor: palette.edge }}>
          <span
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-extrabold"
            style={{ background: palette.avatarBg }}
          >
            {initialsFromName(rec.name)}
          </span>
          <span className="flex flex-col leading-tight min-w-0">
            <span className="font-bold text-sm truncate">{rec.name}</span>
            {rec.role && <span className="text-xs opacity-75 truncate">{rec.role}</span>}
          </span>
        </div>
      </div>

      {/* Meta + actions */}
      <div className="flex-1 flex flex-col justify-between gap-4 min-w-0">
        <div className="text-xs text-gray-500 space-y-1">
          <p>Submitted {formatDate(rec.created_at)}</p>
          {rec.approved_at && <p>Approved {formatDate(rec.approved_at)}</p>}
        </div>
        <RecommendationActions id={rec.id} status={rec.status} color={rec.color} />
      </div>
    </div>
  );
}

function Section({ title, hint, recs }: { title: string; hint: string; recs: Recommendation[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400">{recs.length}</span>
        <span className="text-xs text-gray-400 ml-1">{hint}</span>
      </div>
      {recs.length === 0 ? (
        <p className="text-sm text-gray-400 italic px-1">Nothing here.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {recs.map((rec) => (
            <NoteCard key={rec.id} rec={rec} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminRecommendationsPage() {
  const { data, error } = await supabaseAdmin
    .from("recommendations")
    .select("id, name, role, message, color, status, sort_order, created_at, approved_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
        <p className="text-red-600 font-medium">
          Could not load recommendations. Ensure the{" "}
          <code className="text-sm bg-gray-100 px-1 rounded">recommendations</code> table exists in Supabase
          (run the <code className="text-sm bg-gray-100 px-1 rounded">20260614120000_recommendations.sql</code> migration).
        </p>
      </main>
    );
  }

  const rows = (data ?? []) as Recommendation[];
  const pending = rows.filter((r) => r.status === "pending");
  const approved = rows.filter((r) => r.status === "approved");
  const rejected = rows.filter((r) => r.status === "rejected");

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Recommendations</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Visitor notes for the home page wall. Approve to publish; pick a sticky-note color for each.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shrink-0"
        >
          ← Dashboard
        </Link>
      </div>

      <Section title="Pending review" hint="newest first — approve to publish" recs={pending} />
      <Section title="Published" hint="live on the home page" recs={approved} />
      <Section title="Rejected" hint="hidden from the site" recs={rejected} />
    </main>
  );
}
