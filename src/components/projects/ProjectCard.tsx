import Link from "next/link";
import "./ProjectCard.scss";
import type { Project } from "./ProjectGrid"; 

export default function ProjectCard({ project }: { project: Project }) {
  const formattedDate = project.project_date
    ? new Date(project.project_date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  return (
    <Link href={`/projects/${project.slug}`} className="folder-card-link">
      <div className="folder-card">
        
        {/* Back Layer */}
        <div className="folder-back"></div>

        {/* Middle Layer: Paper and Cover Image */}
        <div className="folder-inside">
          {project.cover_image_url ? (
            <img 
              src={project.cover_image_url} 
              alt={project.title} 
              className="inside-image" 
            />
          ) : (
            <div className="inside-image-placeholder" />
          )}
        </div>

        {/* Front Layer: Glass Pocket */}
        <div className="folder-front">
          <div className="folder-info">
            <div className="folder-header">
              <h3 className="folder-title">{project.title}</h3>
              <p className="folder-description">{project.description}</p>
            </div>
            {formattedDate && (
              <span className="folder-date">Last added time {formattedDate}</span>
            )}
          </div>
        </div>
        
      </div>
    </Link>
  );
}