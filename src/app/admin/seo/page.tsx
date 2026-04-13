import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase-admin";

export const dynamic = "force-dynamic";

const formatCount = (value: number | null) => (value ?? 0).toLocaleString();

export default async function AdminSeoPage() {
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "http://localhost:3000";

  const [{ count: postsCount }, { count: projectsCount }] = await Promise.all([
    supabaseAdmin.from("posts").select("*", { count: "exact", head: true }).eq("published", true).is("trashed_at", null),
    supabaseAdmin.from("projects").select("*", { count: "exact", head: true }).eq("published", true).is("trashed_at", null),
  ]);

  const quickChecks = [
    { label: "Sitemap", href: `${siteBase}/sitemap.xml` },
    { label: "Robots", href: `${siteBase}/robots.txt` },
    { label: "Homepage", href: `${siteBase}/` },
    { label: "Blog index", href: `${siteBase}/blog` },
    { label: "Projects index", href: `${siteBase}/projects` },
  ];

  const externalTools = [
    {
      name: "Google Rich Results Test",
      href: `https://search.google.com/test/rich-results?url=${encodeURIComponent(siteBase)}`,
      description: "Validate JSON-LD and rich result eligibility.",
    },
    {
      name: "Schema Markup Validator",
      href: `https://validator.schema.org/#url=${encodeURIComponent(siteBase)}`,
      description: "Check schema correctness in detail.",
    },
    {
      name: "PageSpeed Insights",
      href: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(siteBase)}`,
      description: "Measure Core Web Vitals and loading performance.",
    },
    {
      name: "Open Graph Debugger",
      href: `https://www.opengraph.xyz/url/${encodeURIComponent(siteBase)}`,
      description: "Preview social card metadata for sharing.",
    },
    {
      name: "Google Search Console",
      href: "https://search.google.com/search-console/about",
      description: "Track indexing, coverage, and search performance.",
    },
  ];

  return (
    <main className="max-w-6xl mx-auto px-6 py-16 font-sans">
      <div className="flex items-start justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">SEO Tools</h1>
          <p className="text-gray-500 mt-2 text-sm max-w-2xl">
            Central place to run SEO checks for your live site, validate structured data, and monitor indexing.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg px-4 py-2 hover:bg-gray-50 shrink-0"
        >
          ← Dashboard
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Published posts</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{formatCount(postsCount)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5">
          <p className="text-xs uppercase tracking-wide text-gray-500">Published projects</p>
          <p className="text-2xl font-semibold text-gray-900 mt-2">{formatCount(projectsCount)}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 sm:col-span-2">
          <p className="text-xs uppercase tracking-wide text-gray-500">Configured site URL</p>
          <p className="text-sm font-medium text-gray-900 mt-2 break-all">{siteBase}</p>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick checks</h2>
        <div className="flex flex-wrap gap-3">
          {quickChecks.map((check) => (
            <a
              key={check.href}
              href={check.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              {check.label}
            </a>
          ))}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        {externalTools.map((tool) => (
          <a
            key={tool.name}
            href={tool.href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-2xl border border-gray-200 bg-white p-5 hover:border-gray-300 transition-colors"
          >
            <h3 className="text-base font-semibold text-gray-900">{tool.name}</h3>
            <p className="text-sm text-gray-500 mt-1">{tool.description}</p>
          </a>
        ))}
      </section>
    </main>
  );
}
