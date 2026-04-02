import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";
import BlogListTrashButton from "@/components/admin/BlogListTrashButton";

export const dynamic = "force-dynamic";

// Helper function to format the date nicely
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export default async function AdminBlogsPage() {
  const [
    { data: posts, error: postsError },
    { count: trashCount, error: trashError },
    { count: categoriesCount, error: categoriesCountError },
  ] = await Promise.all([
      supabaseAdmin
        .from("posts")
        .select("*")
        .is("trashed_at", null)
        .order("created_at", { ascending: false }),

      supabaseAdmin
        .from("posts")
        .select("*", { count: "exact", head: true })
        .not("trashed_at", "is", null),

      supabaseAdmin.from("categories").select("*", { count: "exact", head: true }),
    ]);

  if (postsError || trashError || categoriesCountError) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-16 text-red-500 font-medium">
        Failed to load posts. Please try again.
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Manage Blogs</h1>
          <p className="text-gray-500 mt-1 text-sm">Create, edit, and manage your blog posts.</p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/blog"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all inline-flex items-center gap-1.5"
          >
            View blog
            <svg className="w-3.5 h-3.5 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </Link>
          <Link 
            href="/admin/categories" 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Categories {categoriesCount ? `(${categoriesCount})` : ""}
          </Link>
          <Link 
            href="/admin/tags" 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Tags
          </Link>
          <Link 
            href="/admin/blogs/trash" 
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all"
          >
            Trash {trashCount ? `(${trashCount})` : ""}
          </Link>
          <Link 
            href="/admin/blogs/new" 
            className="px-5 py-2 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
          >
            + New Post
          </Link>
        </div>
      </div>

      {/* Posts List Section */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        {posts?.length ? (
          <div className="divide-y divide-gray-100">
            {posts.map((post) => (
              <div
                key={post.id}
                className="group flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-gray-50 transition-colors"
              >
                {/* Post Info */}
                <div className="flex flex-col mb-3 sm:mb-0">
                  <h2 className="text-base font-semibold text-gray-900 group-hover:text-black transition-colors truncate max-w-lg">
                    {post.title || "Untitled Post"}
                  </h2>
                  <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                    <span>{formatDate(post.created_at)}</span>
                  </div>
                </div>

                {/* Status & Actions */}
                <div className="flex items-center gap-2 sm:gap-4 flex-wrap justify-end">
                  {/* Status Badge */}
                  <span
                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      post.published
                        ? "bg-green-50 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-600 border-gray-200"
                    }`}
                  >
                    {post.published ? "Published" : "Draft"}
                  </span>

                  {/* Edit Button - Fades in on hover on larger screens */}
                  <Link
                    href={`/admin/blogs/${post.id}`}
                    className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-100 hover:text-black transition-all sm:opacity-0 sm:-translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                  >
                    Edit
                  </Link>

                  <BlogListTrashButton
                    postId={post.id}
                    title={post.title || "Untitled Post"}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <div className="w-16 h-16 mb-4 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
              <span className="text-2xl text-gray-400">📝</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No posts yet</h3>
            <p className="text-gray-500 text-sm mb-6 max-w-sm">
              You haven't created any blog posts yet. Click the button below to write your first one.
            </p>
            <Link
              href="/admin/blogs/new"
              className="px-5 py-2.5 text-sm font-medium text-white bg-black rounded-lg hover:bg-gray-800 transition-all shadow-sm"
            >
              Create your first post
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}