"use client";

import { useEffect, useState } from "react";
import TimelineSection from "./TimelineSection";

const formatMonth = (value) => {
  if (!value) return null;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return value;
  return new Intl.DateTimeFormat("en-US", { month: "short", year: "numeric" }).format(parsed);
};

const formatDuration = (start, end, isCurrent) => {
  const startLabel = formatMonth(start);
  const endLabel = isCurrent ? "Present" : formatMonth(end);
  if (startLabel && endLabel) return `${startLabel} – ${endLabel}`;
  return startLabel || endLabel || "";
};

const VoluntaryRoles = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/experiences?category=volunteer");
        if (!res.ok) return;
        const data = await res.json();
        if (!active || !Array.isArray(data)) return;

        // Respect the backend order (sort_order); de-dupe by id.
        const seen = new Set();
        const ordered = data.filter((role) => {
          if (!role?.id || seen.has(role.id)) return false;
          seen.add(role.id);
          return true;
        });

        setItems(
          ordered.map((role) => ({
            id: role.id,
            company: role.company,
            companyUrl: role.company_url,
            role: role.title,
            dateLabel: formatDuration(role.start_date, role.end_date, role.is_current),
            location: role.location,
            type: role.employment_type,
            description: role.description,
            skills: Array.isArray(role.skills) ? role.skills : [],
          }))
        );
      } catch {
        // Keep the section empty if the fetch fails.
      }
    };

    load();
    return () => {
      active = false;
    };
  }, []);

  return (
    <TimelineSection
      id="voluntary-roles"
      title="Voluntary Roles"
      eyebrow="Beyond work"
      subtitle="Community and volunteer contributions alongside my professional experience."
      items={items}
      variant="grid"
    />
  );
};

export default VoluntaryRoles;
