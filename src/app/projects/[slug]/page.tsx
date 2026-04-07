import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import ProjectGrid from "@/components/projects/ProjectGrid";
import "../../blog/[slug]/blog-post.scss";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;

  const { data: project, error } = await supabaseAdmin
    .from("projects")
    .select(
      "id, title, slug, description, external_url, content_html, project_date, cover_image_url, published_at, tech_stack, collaborators, workplace, client_name"
    )
    .eq("slug", slug)
    .eq("published", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (error || !project) {
    notFound();
  }

  const { data: galleryRows } = await supabaseAdmin
    .from("project_images")
    .select("image_url, alt_text, sort_order")
    .eq("project_id", project.id)
    .order("sort_order", { ascending: true });

  const { data: moreProjects } = await supabaseAdmin
    .from("projects")
    .select(
      "id, title, slug, description, external_url, cover_image_url, project_date, tech_stack, workplace, client_name"
    )
    .eq("published", true)
    .is("trashed_at", null)
    .neq("id", project.id)
    .order("project_date", { ascending: false, nullsFirst: false })
    .order("published_at", { ascending: false })
    .limit(3);

  const gallery =
    galleryRows?.map((r) => ({
      url: r.image_url,
      alt: r.alt_text?.trim() || "",
    })) ?? [];

  const techStack = Array.isArray(project.tech_stack)
    ? project.tech_stack.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  const collaborators = Array.isArray(project.collaborators)
    ? project.collaborators.filter((t): t is string => typeof t === "string" && t.trim().length > 0)
    : [];

  const workplace =
    typeof project.workplace === "string" && project.workplace.trim() ? project.workplace.trim() : null;
  const clientName =
    typeof project.client_name === "string" && project.client_name.trim()
      ? project.client_name.trim()
      : null;

  const hasContext =
    Boolean(workplace || clientName || collaborators.length > 0);

  const externalUrl =
    typeof project.external_url === "string" && project.external_url.trim()
      ? project.external_url.trim()
      : null;

  const externalUrlLabel =
    externalUrl && /github\.com/i.test(externalUrl) ? "View on GitHub" : "Visit Live Site";

  return (
    <div className="blog-post-wrapper">
      <Header />

      <article className="min-h-screen py-10 sm:py-16 font-sans text-[#1d1d1f]">
        <div className="max-w-4xl mx-auto px-6 sm:px-8">
          <Link href="/projects" className="back-to-blogs">
            <span aria-hidden>←</span> All projects
          </Link>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            {project.title}
          </h1>

          {project.description && (
            <p className="text-xl leading-relaxed text-[#6e6e73] mb-10">{project.description}</p>
          )}

          {externalUrl && (
            <div className="mb-10">
              <a
                href={externalUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center rounded-full bg-[#1d1d1f] px-5 py-3 text-sm font-semibold text-white transition hover:bg-black"
              >
                {externalUrlLabel}
              </a>
            </div>
          )}

          {hasContext && (
            <section className="mb-10 space-y-4" aria-labelledby="project-context-heading">
              <h2
                id="project-context-heading"
                className="text-[12px] font-bold tracking-widest uppercase text-[#86868b]"
              >
                Project context
              </h2>
              <dl className="space-y-3 text-[15px] text-[#4b5563] m-0">
                {workplace && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="font-semibold text-[#1d1d1f] shrink-0">Workplace</dt>
                    <dd className="m-0">{workplace}</dd>
                  </div>
                )}
                {clientName && (
                  <div className="flex flex-wrap gap-2">
                    <dt className="font-semibold text-[#1d1d1f] shrink-0">Client</dt>
                    <dd className="m-0">{clientName}</dd>
                  </div>
                )}
                {collaborators.length > 0 && (
                  <div>
                    <dt className="font-semibold text-[#1d1d1f] mb-2">Collaborators</dt>
                    <dd className="m-0">
                      <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                        {collaborators.map((name, index) => (
                          <li key={`${index}-${name}`}>
                            <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#f5f5f7] text-[#1d1d1f] border border-[#e8e8ed]">
                              {name}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          {techStack.length > 0 && (
            <section className="mb-10" aria-labelledby="project-tech-stack-heading">
              <h2
                id="project-tech-stack-heading"
                className="text-[12px] font-bold tracking-widest uppercase text-[#86868b] mb-4"
              >
                Tech stack
              </h2>
              <ul className="flex flex-wrap gap-2 list-none p-0 m-0">
                {techStack.map((item, index) => (
                  <li key={`${index}-${item}`}>
                    <span className="inline-flex items-center px-3.5 py-1.5 rounded-full text-sm font-medium bg-[#f5f5f7] text-[#1d1d1f] border border-[#e8e8ed]">
                      {item}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <div className="flex items-center gap-4 mb-10">
            <img
              src="/images/25.jpg"
              alt="Anirudha Kapileshwari"
              className="w-14 h-14 rounded-full object-cover border border-gray-200 shrink-0"
            />
            <div className="text-[#1d1d1f]">
              <div className="flex items-center gap-2 text-[15px] text-[#4b5563]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z"
                  />
                </svg>
                <span>
                  {project.project_date
                    ? new Date(project.project_date + "T12:00:00").toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : project.published_at
                      ? new Date(project.published_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                </span>
              </div>
              <p className="text-[18px] leading-none mt-1 text-[#6b7280]">by Anirudha Kapileshwari</p>
            </div>
          </div>

          {project.cover_image_url && (
            <div className="w-full overflow-hidden rounded-[28px] mb-12 bg-white shadow-sm border border-gray-100">
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-auto max-h-[500px] object-cover"
              />
            </div>
          )}

          <div
            className="prose prose-lg max-w-none blog-content prose-img:rounded-[24px] prose-a:text-blue-600 hover:prose-a:text-blue-500 mb-14"
            dangerouslySetInnerHTML={{ __html: project.content_html || "" }}
          />

          {gallery.length > 0 && (
            <section className="border-t border-gray-200 pt-12">
              <h2 className="text-2xl font-bold text-[#1d1d1f] mb-8">Gallery</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {gallery.map((item, index) => (
                  <div
                    key={`${item.url}-${index}`}
                    className="rounded-[24px] overflow-hidden bg-gray-100 border border-gray-100 shadow-sm"
                  >
                    <img src={item.url} alt={item.alt} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {moreProjects && moreProjects.length > 0 && (
            <section className="border-t border-gray-200 pt-12 mt-14">
              <div className="flex items-center justify-between gap-4 mb-8">
                <h2 className="text-2xl font-bold text-[#1d1d1f]">More Projects</h2>
                <Link
                  href="/projects"
                  className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] transition-colors"
                >
                  View all
                </Link>
              </div>
              <ProjectGrid projects={moreProjects} columns={3} />
            </section>
          )}
        </div>
      </article>
    </div>
  );
}
