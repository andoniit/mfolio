import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  searchParams: Promise<{
    category?: string;
    tag?: string;
  }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const params = await searchParams;
  const categorySlug = params.category;
  const tagSlug = params.tag;

  const [{ data: categories }, { data: tags }] = await Promise.all([
    supabaseAdmin.from("categories").select("*").order("name"),
    supabaseAdmin.from("tags").select("*").order("name"),
  ]);

  let query = supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

  if (categorySlug) {
    const { data: categoryMatch } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("slug", categorySlug)
      .maybeSingle();

    if (categoryMatch) {
      query = query.eq("category_id", categoryMatch.id);
    } else {
      query = query.eq("id", "00000000-0000-0000-0000-000000000000");
    }
  }

  const { data: posts, error } = await query;

  if (error) {
    throw new Error("Failed to fetch posts");
  }

  let filteredPosts = posts || [];

  if (tagSlug) {
    filteredPosts = filteredPosts.filter((post: any) =>
      post.post_tags?.some((item: any) => item.tags?.slug === tagSlug)
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] py-16 sm:py-24 font-sans text-[#1d1d1f]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-6 text-center md:text-left">
          Blog
        </h1>

        <div className="mb-8 flex flex-wrap gap-3">
          <Link
            href="/blog"
            className={`px-4 py-2 rounded-full border text-sm ${
              !categorySlug && !tagSlug ? "bg-black text-white" : "bg-white"
            }`}
          >
            All
          </Link>

          {categories?.map((category) => (
            <Link
              key={category.id}
              href={`/blog?category=${category.slug}`}
              className={`px-4 py-2 rounded-full border text-sm ${
                categorySlug === category.slug ? "bg-black text-white" : "bg-white"
              }`}
            >
              {category.name}
            </Link>
          ))}
        </div>

        <div className="mb-12 flex flex-wrap gap-3">
          {tags?.map((tag) => (
            <Link
              key={tag.id}
              href={`/blog?tag=${tag.slug}`}
              className={`px-3 py-1 rounded-full border text-xs ${
                tagSlug === tag.slug ? "bg-black text-white" : "bg-white"
              }`}
            >
              #{tag.name}
            </Link>
          ))}
        </div>

        {filteredPosts.length === 0 ? (
          <div className="rounded-[24px] bg-white p-10 text-center text-[#86868b]">
            No blog posts found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredPosts.map((post: any) => (
              <Link
                key={post.id}
                href={`/blog/${post.slug}`}
                className="group flex flex-col bg-white rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300"
              >
                {post.cover_image_url ? (
                  <div className="w-full aspect-[4/3] sm:aspect-[16/10] bg-[#f5f5f7] overflow-hidden relative">
                    <img
                      src={post.cover_image_url}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                    />
                  </div>
                ) : (
                  <div className="w-full aspect-[4/3] sm:aspect-[16/10] bg-[#e8e8ed]" />
                )}

                <div className="p-6 sm:p-8 flex flex-col flex-grow">
                  {post.categories?.name && (
                    <p className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase mb-3">
                      {post.categories.name}
                    </p>
                  )}

                  <h2 className="text-xl sm:text-[22px] font-bold tracking-tight leading-snug mb-3">
                    {post.title}
                  </h2>

                  {post.excerpt && (
                    <p className="text-[15px] leading-relaxed text-[#86868b] line-clamp-2 mb-5">
                      {post.excerpt}
                    </p>
                  )}

                  {post.post_tags?.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {post.post_tags.map((item: any) =>
                        item.tags ? (
                          <span
                            key={item.tags.id}
                            className="text-[11px] px-3 py-1 rounded-full border border-[#d2d2d7] text-[#6e6e73] bg-[#fafafa]"
                          >
                            {item.tags.name}
                          </span>
                        ) : null
                      )}
                    </div>
                  )}

                  <div className="mt-auto pt-4">
                    <p className="text-[13px] font-semibold text-[#86868b]">
                      {post.published_at
                        ? new Date(post.published_at).toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "Draft"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}