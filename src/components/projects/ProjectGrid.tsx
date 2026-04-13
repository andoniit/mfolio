"use client";

import { useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import ProjectCard from "./ProjectCard";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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

export type ProjectGridProps = {
  projects: Project[];
  columns?: 1 | 2 | 3;
};

export default function ProjectGrid({ projects, columns }: ProjectGridProps) {
  const gridRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (!gridRef.current || projects.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(".folder-card-link") as HTMLElement[];
      if (!cards.length) return;

      const mm = gsap.matchMedia();

      // Set initial states
      gsap.set(cards, { autoAlpha: 0, y: 80 });

      mm.add("(min-width: 769px)", () => {
        // Desktop Animation
        if (cards.length === 3) {
          // Animate center card first, then left and right together
          const tl = gsap.timeline({
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          });

          // Center card
          tl.to(cards[1], {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            clearProps: "opacity,transform,visibility",
          });

          // Left and right cards
          tl.to([cards[0], cards[2]], {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            clearProps: "opacity,transform,visibility",
          }, "-=0.6"); // Overlap with previous animation by 0.6 seconds
        } else {
          // Standard stagger for other configurations on desktop
          gsap.to(cards, {
            autoAlpha: 1,
            y: 0,
            duration: 1,
            stagger: 0.15,
            ease: "power3.out",
            clearProps: "opacity,transform,visibility",
            scrollTrigger: {
              trigger: gridRef.current,
              start: "top 85%",
              toggleActions: "play none none reverse",
            }
          });
        }
      });

      mm.add("(max-width: 768px)", () => {
        // Mobile Animation: One by one stagger
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          duration: 0.8,
          stagger: 0.2, // Noticeable one-by-one delay
          ease: "power3.out",
          clearProps: "opacity,transform,visibility",
          scrollTrigger: {
            trigger: gridRef.current,
            start: "top 90%", // Trigger slightly earlier on mobile
            toggleActions: "play none none reverse",
          }
        });
      });

    }, gridRef);

    return () => ctx.revert();
  }, [projects]);

  if (!projects.length) {
    return <div className="empty-state">No projects yet.</div>;
  }

  return (
    <div
      ref={gridRef}
      className="blog-grid"
      style={{
        display: "grid",
        gridTemplateColumns:
          columns === 3
            ? "repeat(auto-fit, minmax(min(100%, 280px), 1fr))"
            : columns === 2
              ? "repeat(2, minmax(0, 1fr))"
              : "repeat(auto-fill, minmax(280px, 1fr))",
        gap: "32px",
      }}
    >
      {projects.map((project, index) => (
        <ProjectCard key={project.id} project={project} index={index} />
      ))}
    </div>
  );
}