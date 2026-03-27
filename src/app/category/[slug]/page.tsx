import { notFound } from "next/navigation";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CategoryPage({ params }: Props) {
  const { slug } = await params;

  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) notFound();

  const { data: posts } = await supabaseAdmin
    .from("posts")
    .select(`
      *,
      categories ( id, name, slug ),
      post_tags (
        tags ( id, name, slug )
      )
    `)
    .eq("category_id", category.id)
    .eq("published", true)
    .is("trashed_at", null)
    .order("published_at", { ascending: false });

  return (
    <main className="max-w-6xl mx-auto px-6 py-16">
      <p className="text-sm uppercase tracking-widest text-neutral-500 mb-3">
        Category
      </p>
      <h1 className="text-4xl font-bold mb-10">{category.name}</h1>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {posts?.map((post: any) => (
          <Link key={post.id} href={`/blog/${post.slug}`} className="border rounded-2xl p-5 bg-white">
            <h2 className="text-xl font-semibold mb-2">{post.title}</h2>
            <p className="text-sm text-neutral-500">{post.excerpt}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;

  const { data: category } = await supabaseAdmin
    .from("categories")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!category) {
    return {
      title: "Category Not Found",
    };
  }

  return {
    title: `${category.name} Blogs`,
    description: `Read all blog posts in the ${category.name} category.`,
  };
}