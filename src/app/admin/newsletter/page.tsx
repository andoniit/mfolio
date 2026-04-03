import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

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

export default async function AdminNewsletterPage() {
  const { data: rows, error } = await supabaseAdmin
    .from("newsletter_subscribers")
    .select("id, email, name, status, source, subscribed_at, unsubscribed_at, unsubscribe_token")
    .order("subscribed_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
        <p className="text-red-600 font-medium">
          Could not load subscribers. Ensure the <code className="text-sm bg-gray-100 px-1 rounded">newsletter_subscribers</code> table exists in Supabase.
        </p>
      </main>
    );
  }

  const siteBase =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "";

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Newsletter</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Subscribers from your footer form and other sources. Unsubscribe links use a secret token per row.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shrink-0"
        >
          ← Dashboard
        </Link>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {rows?.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-medium">
                <tr>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3">Subscribed</th>
                  <th className="px-4 py-3">Unsubscribed</th>
                  <th className="px-4 py-3 min-w-[200px]">Unsubscribe URL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((row) => {
                  const unsubUrl = siteBase
                    ? `${siteBase}/api/newsletter/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}`
                    : `/api/newsletter/unsubscribe?token=${encodeURIComponent(row.unsubscribe_token)}`;
                  return (
                    <tr key={row.id} className="hover:bg-gray-50/80">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.email}</td>
                      <td className="px-4 py-3 text-gray-600">{row.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border ${
                            row.status === "active"
                              ? "bg-green-50 text-green-800 border-green-200"
                              : "bg-gray-100 text-gray-600 border-gray-200"
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{row.source}</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(row.subscribed_at)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                        {formatDate(row.unsubscribed_at)}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-[11px] break-all text-gray-700 bg-gray-50 px-2 py-1 rounded block max-w-md">
                          {unsubUrl}
                        </code>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-500 text-sm">No subscribers yet.</div>
        )}
      </div>
    </main>
  );
}
