import { supabaseAdmin } from "@/lib/supabase-admin";
import TrashActions from "@/components/admin/TrashActions";
import Link from "next/link";

export default async function TrashPage() {
  const { data: posts, error } = await supabaseAdmin
    .from("posts")
    .select("*")
    .not("trashed_at", "is", null)
    .order("trashed_at", { ascending: false });

  if (error) {
    return <div className="p-6">Failed to load trash.</div>;
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold">Trash</h1>
        <Link href="/admin/blogs" className="px-4 py-2 rounded-lg border">
          Back to Blogs
        </Link>
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
                  Trashed on{" "}
                  {post.trashed_at
                    ? new Date(post.trashed_at).toLocaleDateString()
                    : ""}
                </p>
              </div>

              <TrashActions postId={post.id} />
            </div>
          ))
        ) : (
          <p>No posts in trash.</p>
        )}
      </div>
    </main>
  );
}