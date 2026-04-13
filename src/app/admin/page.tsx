import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

export default async function AdminDashboardPage() {
  const [
    { count: postsCount },
    { count: postsTrashCount },
    { count: projectsCount },
    { count: projectsTrashCount },
    { count: newsletterActiveCount },
  ] = await Promise.all([
    supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).is("trashed_at", null),
    supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).not("trashed_at", "is", null),
    supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).is("trashed_at", null),
    supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).not("trashed_at", "is", null),
    supabaseAdmin
      .from("newsletter_subscribers")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
  ]);

  const cards = [
    {
      title: "Blog",
      description: "Posts, categories, tags, and trash.",
      href: "/admin/blogs",
      cta: "Manage posts",
      publicHref: "/blog",
      publicLabel: "View blog",
      meta: `${postsCount ?? 0} active${postsTrashCount ? ` · ${postsTrashCount} in trash` : ""}`,
    },
    {
      title: "Projects",
      description: "Portfolio projects, gallery, and tech stack.",
      href: "/admin/projects",
      cta: "Manage projects",
      publicHref: "/projects",
      publicLabel: "View projects",
      meta: `${projectsCount ?? 0} active${projectsTrashCount ? ` · ${projectsTrashCount} in trash` : ""}`,
    },
    {
      title: "Newsletter",
      description: "Footer signups and unsubscribe links.",
      href: "/admin/newsletter",
      cta: "View subscribers",
      publicHref: null as string | null,
      publicLabel: null as string | null,
      meta: `${newsletterActiveCount ?? 0} active`,
    },
    {
      title: "Resume",
      description: "Upload and manage your downloadable resume.",
      href: "/admin/resume",
      cta: "Open resume",
      publicHref: null as string | null,
      publicLabel: null as string | null,
      meta: null as string | null,
    },
    {
      title: "SEO Tools",
      description: "Structured data validation, index checks, and performance tools.",
      href: "/admin/seo",
      cta: "Open SEO tools",
      publicHref: "/sitemap.xml",
      publicLabel: "View sitemap",
      meta: "Includes rich results + page speed checks",
    },
  ];

  return (
    <main className="max-w-5xl mx-auto px-6 py-16 font-sans">
      <div className="mb-12">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Dashboard</h1>
        <p className="text-gray-500 mt-2 text-sm max-w-xl">
          Choose a section to manage content. Your live site opens in a new tab when you use View blog or View projects.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.title}
            className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4 hover:border-gray-300 transition-colors"
          >
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{card.title}</h2>
              <p className="text-sm text-gray-500 mt-1">{card.description}</p>
              {card.meta && <p className="text-xs text-gray-400 mt-3">{card.meta}</p>}
            </div>
            <div className="mt-auto flex flex-col gap-2">
              <Link
                href={card.href}
                className="inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-white bg-black rounded-xl hover:bg-gray-800 transition-colors shadow-sm"
              >
                {card.cta}
              </Link>
              {card.publicHref && card.publicLabel && (
                <Link
                  href={card.publicHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex justify-center items-center px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  {card.publicLabel}
                  <span className="sr-only"> (opens in a new tab)</span>
                  <svg
                    className="ml-2 w-3.5 h-3.5 opacity-60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
