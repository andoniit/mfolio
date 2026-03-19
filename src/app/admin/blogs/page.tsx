import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export default async function AdminBlogsPage() {
  const [{ data: posts, error: postsError }, { count: trashCount, error: trashError }] =
    await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("*")
        .is("trashed_at", null)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("posts")
        .select("*", { count: "exact", head: true })
        .not("trashed_at", "is", null),
    ]);

  if (postsError || trashError) {
    return <div className="p-6">Failed to load posts.</div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Manage Blogs</h1>

        <div className="flex gap-3">
          <Link
            href="/admin/blogs/trash"
            className="relative px-4 py-2 rounded-lg border"
          >
            Trash

            {(trashCount ?? 0) > 0 && (
              <span className="absolute -top-2 -right-2 min-w-[22px] h-[22px] px-1 rounded-full bg-red-600 text-white text-xs flex items-center justify-center">
                {trashCount}
              </span>
            )}
          </Link>

          <Link
            href="/admin/blogs/new"
            className="px-4 py-2 rounded-lg bg-black text-white"
          >
            New Post
          </Link>
        </div>
      </div>

      <div className="space-y-4">
        {posts?.length ? (
          posts.map((post) => (
            <div
              key={post.id}
              className="border rounded-xl p-4 flex items-center justify-between"
            >
              <div>
                <h2 className="font-semibold">{post.title}</h2>
                <p className="text-sm text-neutral-500">
                  {post.published ? "Published" : "Draft"}
                </p>
              </div>

              <Link
                href={`/admin/blogs/${post.id}`}
                className="text-sm underline"
              >
                Edit
              </Link>
            </div>
          ))
        ) : (
          <p>No blog posts yet.</p>
        )}
      </div>
    </main>
  );
}