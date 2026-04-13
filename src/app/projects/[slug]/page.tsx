import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase-admin";
import Header from "@/components/layout/header/header";
import ProjectGalleryLightbox from "@/components/projects/ProjectGalleryLightbox";
import ProjectGrid from "@/components/projects/ProjectGrid";
import AnimatedIntroText from "@/components/home/AnimatedIntroText";
import SplitterText from "@/components/home/SplitterText";
import AnimatedDivider from "@/components/home/AnimatedDivider";
import "../../blog/[slug]/blog-post.scss";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  const { data: project } = await supabaseAdmin
    .from("projects")
    .select("title, slug, description, cover_image_url")
    .eq("slug", slug)
    .eq("published", true)
    .is("trashed_at", null)
    .maybeSingle();

  if (!project) {
    return {
      title: "Project Not Found",
      robots: {
        index: false,
        follow: false,
      },
    };
  }

  const description =
    project.description?.trim() ||
    `Explore the ${project.title} project by Anirudha Kapileshwari.`;

  return {
    title: project.title,
    description,
    alternates: {
      canonical: `/projects/${project.slug}`,
    },
    openGraph: {
      type: "article",
      title: project.title,
      description,
      url: `/projects/${project.slug}`,
      images: project.cover_image_url
        ? [{ url: project.cover_image_url, alt: project.title }]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: project.title,
      description,
      images: project.cover_image_url ? [project.cover_image_url] : undefined,
    },
  };
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params;
  const siteBase = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");

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

  const creativeWorkJsonLd = {
    "@type": "CreativeWork",
    name: project.title,
    description: project.description || "",
    url: siteBase ? `${siteBase}/projects/${project.slug}` : `/projects/${project.slug}`,
    image: project.cover_image_url || undefined,
    creator: {
      "@type": "Person",
      name: "Anirudha Kapileshwari",
      url: siteBase || "/",
    },
    datePublished: project.published_at || undefined,
    dateCreated: project.project_date || undefined,
    keywords: techStack.length > 0 ? techStack : undefined,
    about: workplace || clientName || undefined,
  };

  const breadcrumbJsonLd = {
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteBase ? `${siteBase}/` : "/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Projects",
        item: siteBase ? `${siteBase}/projects` : "/projects",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: project.title,
        item: siteBase ? `${siteBase}/projects/${project.slug}` : `/projects/${project.slug}`,
      },
    ],
  };

  const jsonLdGraph = {
    "@context": "https://schema.org",
    "@graph": [creativeWorkJsonLd, breadcrumbJsonLd],
  };

  return (
    <div className="blog-post-wrapper">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdGraph) }}
      />
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
                  <AnimatedIntroText>
                    {project.title}
                  </AnimatedIntroText>
                </h1>
                {displayDate && (
                  <SplitterText variant="soft">
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
                  </SplitterText>
                )}
              </div>

              {project.description ? (
                <div className="relative max-w-[420px] lg:pl-4 lg:self-center flex items-center min-h-full text-lg sm:text-xl leading-relaxed m-0" style={{ color: "var(--mf-purple)" }}>
                  <AnimatedDivider className="hidden lg:block absolute left-0 top-0 bottom-0 w-[1px] bg-black/10" orientation="vertical" />
                  <SplitterText variant="fast">
                    {project.description}
                  </SplitterText>
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
                    <SplitterText variant="fast">
                      Project Context
                    </SplitterText>
                  </h2>
                  <dl className="space-y-4 text-[15px] leading-relaxed m-0">
                    {workplace && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          <SplitterText variant="fast">Workplace / origination</SplitterText>
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          <SplitterText variant="soft">{workplace}</SplitterText>
                        </dd>
                      </div>
                    )}
                    {clientName && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          <SplitterText variant="fast">Client</SplitterText>
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          <SplitterText variant="soft">{clientName}</SplitterText>
                        </dd>
                      </div>
                    )}
                    {collaborators.length > 0 && (
                      <div>
                        <dt className="font-semibold mb-1" style={{ color: "var(--mf-dark)" }}>
                          <SplitterText variant="fast">Collaborators</SplitterText>
                        </dt>
                        <dd className="m-0" style={{ color: "var(--mf-dark)" }}>
                          <ul className="list-disc pl-5 m-0">
                            {collaborators.map((name, index) => (
                              <li key={`${index}-${name}`}>
                                <SplitterText variant="soft">{name}</SplitterText>
                              </li>
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
                      <SplitterText variant="fast">
                        Tech stack
                      </SplitterText>
                    </h2>
                    <ul className="flex flex-wrap gap-2.5 list-none p-0 m-0 mb-6">
                      {techStack.map((item, index) => (
                        <li key={`${index}-${item}`}>
                          <SplitterText variant="soft">
                            <span
                              className="inline-flex items-center px-3.5 py-1.5 rounded-full text-xs font-semibold"
                              style={{
                                background: "var(--mf-purple)",
                                color: "var(--mf-white)",
                              }}
                            >
                              {item}
                            </span>
                          </SplitterText>
                        </li>
                      ))}
                    </ul>
                  </>
                )}

                {externalUrl && (
                  <SplitterText variant="soft">
                    <a
                      href={externalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="projectCtaButton"
                    >
                      {externalUrlLabel}
                    </a>
                  </SplitterText>
                )}
              </section>
            </div>
          </section>

          {project.cover_image_url && (
            <SplitterText variant="soft" isBlock={true}>
              <div className="w-full overflow-hidden rounded-[16px] mb-10 bg-white shadow-sm border border-black/5 flex">
                <img
                  src={project.cover_image_url}
                  alt={project.title}
                  className="w-full h-auto max-h-[640px] object-cover"
                />
              </div>
            </SplitterText>
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
            <section className="relative pt-12 mt-14">
              <AnimatedDivider className="absolute left-0 top-0 w-full h-[1px] bg-gray-200" orientation="horizontal" />
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
