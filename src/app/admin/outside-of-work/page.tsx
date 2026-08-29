import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import OutsideOfWorkManager from "@/components/admin/OutsideOfWorkManager";
import type { OutsideItem } from "@/lib/outside-of-work";

export const dynamic = "force-dynamic";

export default async function AdminOutsideOfWorkPage() {
  const { data, error } = await supabaseAdmin
    .from("outside_of_work_items")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
        <p className="text-red-600 font-medium">
          Could not load this section. Ensure the{" "}
          <code className="text-sm bg-gray-100 px-1 rounded">outside_of_work_items</code> table exists
          in Supabase (run the{" "}
          <code className="text-sm bg-gray-100 px-1 rounded">
            20260828120000_outside_of_work.sql
          </code>{" "}
          migration).
        </p>
      </main>
    );
  }

  const items = (data ?? []) as OutsideItem[];

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Outside of Work</h1>
          <p className="text-gray-500 mt-1 text-sm max-w-xl">
            The bento on the home page: photos you shot, food spots you love, and the games on your
            PS5. Everything here is yours — it goes live as soon as you publish it.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shrink-0"
        >
          ← Dashboard
        </Link>
      </div>

      <OutsideOfWorkManager items={items} />
    </main>
  );
}
