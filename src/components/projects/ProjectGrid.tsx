"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import ProjectCard from "./ProjectCard";

export type Project = {
  id: string;
  title: string;
  slug: string;
  description?: string | null;
  external_url?: string | null;
  cover_image_url?: string | null;
  project_date?: string | null;
  tech_stack?: string[] | null;
  workplace?: string | null;
  client_name?: string | null;
};

export default function ProjectGrid({ projects }: { projects: Project[] }) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!gridRef.current || projects.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".folder-card-link", 
        { autoAlpha: 0, y: 42 },
        {
          autoAlpha: 1,
          y: 0,
          duration: 1.05,
          stagger: 0.11,
          ease: "expo.out",
          clearProps: "opacity,transform,visibility",
        }
      );
    }, gridRef);

    return () => ctx.revert();
  }, [projects]);

  if (!projects.length) {
    return <div className="empty-state">No projects yet.</div>;
  }

  return (
    <div ref={gridRef} className="blog-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "32px" }}>
      {projects.map((project, index) => (
        // Added the index prop here!
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}