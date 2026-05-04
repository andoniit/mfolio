import Link from "next/link";
import clsx from "clsx";
import "./ProjectCard.scss";
import type { Project } from "./ProjectGrid";

// A palette of beautiful folder colors
const FOLDER_THEMES = [
  { back: "#6D4CDB", front: "rgba(142, 114, 255, 0.45)", shadow: "rgba(109, 76, 219, 0.25)" }, // Purple
  { back: "#2A9D8F", front: "rgba(62, 180, 166, 0.45)",  shadow: "rgba(42, 157, 143, 0.25)" }, // Teal
  { back: "#E63946", front: "rgba(235, 87, 98, 0.45)",   shadow: "rgba(230, 57, 70, 0.25)" },  // Coral/Pink
  { back: "#F4A261", front: "rgba(247, 179, 119, 0.45)", shadow: "rgba(244, 162, 97, 0.25)" }, // Orange
  { back: "#219EBC", front: "rgba(61, 188, 219, 0.45)",  shadow: "rgba(33, 158, 188, 0.25)" }, // Blue
];

export default function ProjectCard({
  project,
  index = 0,
  copilotHighlighted = false,
}: {
  project: Project;
  index?: number;
  /** Portfolio copilot: emphasize this card when it matches a tool-driven highlight. */
  copilotHighlighted?: boolean;
}) {
  const formattedDate = project.project_date
    ? new Date(project.project_date + "T12:00:00").toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "";

  // Assigns a color theme based on its order in the grid
  const theme = FOLDER_THEMES[index % FOLDER_THEMES.length];

  return (
    <Link
      href={`/projects/${project.slug}`}
      data-project-id={project.id}
      className={clsx("folder-card-link", copilotHighlighted && "copilot-card-highlight")}
    >
      <div 
        className="folder-card"
        style={{
          "--folder-back-color": theme.back,
          "--folder-front-color": theme.front,
          "--folder-shadow-color": theme.shadow,
        } as React.CSSProperties}
      >
        
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
              {(project.workplace || project.client_name) && (
                <p className="folder-context">
                  {[project.workplace, project.client_name].filter(Boolean).join(" · ")}
                </p>
              )}
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