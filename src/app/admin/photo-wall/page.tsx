import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import PhotoWallActions from "@/components/admin/PhotoWallActions";
import type { PhotoWallPost } from "@/lib/photo-wall";

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

function PhotoCard({ post }: { post: PhotoWallPost }) {
  return (
    <div className="flex flex-col sm:flex-row gap-5 p-5 bg-white border border-gray-200 rounded-2xl shadow-sm">
      {/* Polaroid preview — same framing the wall renders */}
      <div className="shrink-0 w-full sm:w-52 bg-[#fbfbf6] rounded p-3 pb-0 shadow-sm border border-gray-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={post.image_url}
          alt={post.message}
          className="w-full aspect-square object-cover bg-black"
        />
        <p className="min-h-[64px] flex items-center justify-center text-center px-1 py-3 m-0 text-[#3a3a3a] break-words">
          {post.message}
        </p>
      </div>

      {/* Meta + actions */}
      <div className="flex-1 flex flex-col justify-between gap-4 min-w-0">
        <div className="text-xs text-gray-500 space-y-1">
          <p className="font-medium text-gray-700">
            {post.author_name || <span className="text-gray-400 italic">Anonymous</span>}
          </p>
          <p>Submitted {formatDate(post.created_at)}</p>
          {post.approved_at && <p>Approved {formatDate(post.approved_at)}</p>}
        </div>
        <PhotoWallActions id={post.id} status={post.status} message={post.message} />
      </div>
    </div>
  );
}

function Section({ title, hint, posts }: { title: string; hint: string; posts: PhotoWallPost[] }) {
  return (
    <section className="mb-12">
      <div className="flex items-baseline gap-3 mb-4">
        <h2 className="text-lg font-bold text-gray-900">{title}</h2>
        <span className="text-sm text-gray-400">{posts.length}</span>
        <span className="text-xs text-gray-400 ml-1">{hint}</span>
      </div>
      {posts.length === 0 ? (
        <p className="text-sm text-gray-400 italic px-1">Nothing here.</p>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          {posts.map((post) => (
            <PhotoCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </section>
  );
}

export default async function AdminPhotoWallPage() {
  const { data, error } = await supabaseAdmin
    .from("photo_wall_posts")
    .select("id, image_url, storage_path, message, author_name, status, sort_order, created_at, approved_at")
    .order("created_at", { ascending: false });

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
        <p className="text-red-600 font-medium">
          Could not load the photo wall. Ensure the{" "}
          <code className="text-sm bg-gray-100 px-1 rounded">photo_wall_posts</code> table exists in Supabase
          (run the <code className="text-sm bg-gray-100 px-1 rounded">20260815120000_photo_wall.sql</code> migration).
        </p>
      </main>
    );
  }

  const rows = (data ?? []) as PhotoWallPost[];
  const pending = rows.filter((p) => p.status === "pending");
  const approved = rows.filter((p) => p.status === "approved");
  const rejected = rows.filter((p) => p.status === "rejected");

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Photo Wall</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Polaroids visitors snapped on the home page. Nothing is public until you approve it.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shrink-0"
        >
          ← Dashboard
        </Link>
      </div>

      <Section title="Pending review" hint="newest first — approve to publish" posts={pending} />
      <Section title="Published" hint="live on the home page" posts={approved} />
      <Section title="Rejected" hint="hidden from the site" posts={rejected} />
    </main>
  );
}
