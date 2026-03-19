export default async function BlogPage() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/posts`, {
    cache: 'no-store',
  })

  const posts = await res.json()

  return (
    <main className="max-w-5xl mx-auto px-6 py-12">
      <h1 className="text-4xl font-bold mb-8">Blog</h1>

      <div className="grid gap-8">
        {posts.map((post: any) => (
          <a key={post.id} href={`/blog/${post.slug}`} className="border rounded-xl p-6">
            {post.cover_image_url && (
              <img
                src={post.cover_image_url}
                alt={post.title}
                className="w-full h-64 object-cover rounded-lg mb-4"
              />
            )}
            <h2 className="text-2xl font-semibold">{post.title}</h2>
            <p className="text-sm opacity-70 mt-2">
              {post.published_at ? new Date(post.published_at).toLocaleDateString() : ''}
            </p>
            <p className="mt-3">{post.excerpt}</p>
          </a>
        ))}
      </div>
    </main>
  )
}