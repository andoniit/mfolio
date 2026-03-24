export default async function BlogPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/posts`, {
    cache: 'no-store',
  })

  const posts = await res.json()

  return (
    <main className="min-h-screen bg-[#f5f5f7] py-16 sm:py-24 font-sans text-[#1d1d1f]">
      <div className="max-w-[1400px] mx-auto px-6 sm:px-8 lg:px-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-12 text-center md:text-left">
          Blog
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {posts.map((post: any) => (
            <a
              key={post.id}
              href={`/blog/${post.slug}`}
              className="group flex flex-col bg-white rounded-[24px] overflow-hidden hover:shadow-[0_8px_30px_rgba(0,0,0,0.04)] transition-all duration-300"
            >
              {/* Image Container */}
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

              {/* Content Container */}
              <div className="p-6 sm:p-8 flex flex-col flex-grow">
                {/* Eyebrow Text */}
                <span className="text-[11px] font-bold tracking-widest text-[#86868b] uppercase mb-3">
                  Blog Post
                </span>
                
                {/* Title */}
                <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-[#1d1d1f] leading-snug mb-3">
                  {post.title}
                </h2>

                {/* Excerpt (Optional: kept from your original code but styled subtly) */}
                {post.excerpt && (
                  <p className="text-[15px] leading-relaxed text-[#86868b] line-clamp-2 mb-6">
                    {post.excerpt}
                  </p>
                )}

                {/* Date (Pushed to the bottom) */}
                <div className="mt-auto pt-4">
                  <p className="text-[13px] font-semibold text-[#86868b]">
                    {post.published_at
                      ? new Date(post.published_at).toLocaleDateString('en-US', {
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'Draft'}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </main>
  )
}