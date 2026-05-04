"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import SkillTag from "./SkillTag";

export type ProjectResultCardModel = {
  id?: string;
  title: string;
  slug: string;
  description?: string | null;
  cover_image_url?: string | null;
  tech_stack?: string[];
  matchReason?: string;
};

type Props = {
  project: ProjectResultCardModel;
  index?: number;
};

export default function ProjectResultCard({ project, index = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className="group overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] shadow-lg backdrop-blur-md"
    >
      <Link href={`/projects/${project.slug}`} className="flex flex-col sm:flex-row sm:items-stretch">
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-zinc-900/80 sm:aspect-auto sm:h-[88px] sm:w-[120px]">
          {project.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={project.cover_image_url}
              alt=""
              className="absolute inset-0 h-full w-full object-cover opacity-90 transition group-hover:opacity-100"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1 p-2.5">
          <div className="flex items-start justify-between gap-2">
            <span className="text-sm font-semibold text-white group-hover:text-cyan-200">{project.title}</span>
            <span className="shrink-0 font-mono text-[10px] text-zinc-500">/{project.slug}</span>
          </div>
          {project.matchReason ? (
            <p className="text-[11px] leading-snug text-cyan-200/70">{project.matchReason}</p>
          ) : null}
          {project.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-zinc-400">{project.description}</p>
          ) : null}
          {project.tech_stack && project.tech_stack.length > 0 ? (
            <div className="flex flex-wrap gap-1 pt-0.5">
              {project.tech_stack.slice(0, 5).map((t) => (
                <SkillTag key={t} label={t} variant="dark" />
              ))}
            </div>
          ) : null}
        </div>
      </Link>
    </motion.div>
  );
}
