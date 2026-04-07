import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import ProjectGalleryLightbox from "@/components/projects/ProjectGalleryLightbox";
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
  const detailsGridClassName = hasContext
    ? "grid grid-cols-1 lg:grid-cols-[max-content_minmax(240px,340px)] gap-[50px] items-start"
    : "grid grid-cols-1 gap-5 items-start";

  const displayDate = project.project_date
    ? new Date(`${project.project_date}T12:00:00`).toLocaleDateString("en-US", {
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
      : "";

  return (
    <div className="blog-post-wrapper">
      <Header />

      <article className="min-h-screen py-10 sm:py-16 font-sans" style={{ color: "var(--mf-dark)" }}>
        <div className="max-w-6xl mx-auto px-6 sm:px-8">
          <section className="mb-10 lg:mb-14">
            <div className="grid grid-cols-1 lg:grid-cols-[max-content_minmax(280px,420px)] gap-2 lg:gap-5 items-start lg:items-center">
              <div className="min-w-0 max-w-max">
                <h1
                  className="text-[2.3rem] sm:text-[4.1rem] lg:text-[4.7rem] font-bold tracking-[-0.065em] leading-[0.92] m-0 whitespace-normal break-words lg:whitespace-nowrap"
                  style={{ color: "var(--mf-dark)" }}
                >
                  {project.title}
                </h1>
                {displayDate && (
                  <div
                    className="mt-3 inline-flex items-center gap-2 text-sm sm:text-base font-medium"
                    style={{ color: "#6f6f6f" }}
                  >
                    <svg
                      className="h-4 w-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10m-13 9h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v11a2 2 0 002 2z" />
                    </svg>
                    <span>{displayDate}</span>
                  </div>
                )}
              </div>

              {project.description ? (
                <div className="max-w-[420px] lg:border-l lg:border-black/10 lg:pl-4 lg:self-center flex items-center min-h-full">
                  <p
                    className="text-lg sm:text-xl leading-relaxed m-0"
                    style={{ color: "var(--mf-purple)" }}
                  >
                    {project.description}
                  </p>
                </div>
              ) : null}
            </div>
          </section>

          <section className="mb-10 lg:mb-12">
            <div className={detailsGridClassName}>
              {hasContext ? (
                <section aria-labelledby="project-context-heading" className="max-w-[500px]">
                  <h2
                    id="project-context-heading"
                    className="text-sm font-bold uppercase tracking-wide mb-4"
                    style={{ color: "var(--mf-dark)" }}
                  >
                    Project Context
                  </h2>
                  <dl className="space-y-4 text-[15px] leading-relaxed m-0">
                    {workplace && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          Workplace / origination
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          {workplace}
                        </dd>
                      </div>
                    )}
                    {clientName && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          Client
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          {clientName}
                        </dd>
                      </div>
                    )}
                    {collaborators.length > 0 && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          Collaborators
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          <ul className="list-disc pl-5 m-0">
                            {collaborators.map((name, index) => (
                              <li key={`${index}-${name}`}>{name}</li>
                            ))}
                          </ul>
                        </dd>
                      </div>
                    )}
                  </dl>
                </section>
              ) : null}

              <section
                aria-labelledby="project-tech-stack-heading"
                className="w-full max-w-[340px] justify-self-start text-left"
              >
                {techStack.length > 0 && (
                  <>
                    <h2
                      id="project-tech-stack-heading"
                      className="text-sm font-bold uppercase tracking-wide mb-4"
                      style={{ color: "var(--mf-dark)" }}
                    >
                      Tech stack
                    </h2>
                    <ul className="flex flex-wrap gap-2.5 list-none p-0 m-0 mb-6">
                      {techStack.map((item, index) => (
                        <li key={`${index}-${item}`}>
                          <span
                            className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold"
                            style={{
                              background: "var(--mf-purple)",
                              color: "var(--mf-white)",
                            }}
                          >
                            {item}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {externalUrl && (
                  <a
                    href={externalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="projectCtaButton"
                  >
                    {externalUrlLabel}
                  </a>
                )}
              </section>
            </div>
          </section>

          {project.cover_image_url && (
            <div className="w-full overflow-hidden rounded-[16px] mb-10 bg-white shadow-sm border border-black/5">
              <img
                src={project.cover_image_url}
                alt={project.title}
                className="w-full h-auto max-h-[640px] object-cover"
              />
            </div>
          )}

          {project.description && (
            <p
              className="max-w-4xl text-lg sm:text-[1.35rem] leading-relaxed mb-8"
              style={{ color: "var(--mf-dark)" }}
            >
              {project.description}
            </p>
          )}

          <div
            className="prose prose-lg max-w-none blog-content project-detail-content mb-14"
            dangerouslySetInnerHTML={{ __html: project.content_html || "" }}
          />

          {gallery.length > 0 && (
            <section className="pt-4">
              <h2
                className="text-[2rem] font-bold mb-6"
                style={{ color: "var(--mf-dark)", letterSpacing: "-0.04em" }}
              >
                Gallery
              </h2>
              <ProjectGalleryLightbox items={gallery} />
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
