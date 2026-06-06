export const EMPLOYMENT_TYPES = [
  "Full-time",
  "Part-time",
  "Contract",
  "Freelance",
  "Internship",
  "Self-employed",
] as const;

export function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value || "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeText(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function normalizeUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch {
    throw new Error("Company link must be a valid http or https URL");
  }
}

// Logos may be a full URL or a local public path like "/logo/acme.jpeg".
function normalizeLogo(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      throw new Error("Invalid protocol");
    }
    return url.toString();
  } catch {
    throw new Error("Logo must be a valid http/https URL or a path starting with /");
  }
}

function normalizeSortOrder(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  const parsed = Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

export type ExperienceCategory = "work" | "volunteer";

function normalizeCategory(value: unknown): ExperienceCategory {
  const v = typeof value === "string" ? value.trim().toLowerCase() : "";
  return v === "volunteer" ? "volunteer" : "work";
}

function normalizeEmploymentType(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  const trimmed = value.trim();
  if (!EMPLOYMENT_TYPES.includes(trimmed as (typeof EMPLOYMENT_TYPES)[number])) {
    throw new Error(`Job type must be one of: ${EMPLOYMENT_TYPES.join(", ")}`);
  }
  return trimmed;
}

function normalizeDate(value: unknown): string | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value.trim();
}

export function buildExperiencePayload(
  body: Record<string, unknown>,
  existingPublishedAt?: string | null
) {
  if (!normalizeText(body.title)) {
    throw new Error("Role / job title is required");
  }
  if (!normalizeText(body.company)) {
    throw new Error("Company is required");
  }

  const category = normalizeCategory(body.category);

  const startDate = normalizeDate(body.start_date);
  if (!startDate && category === "work") {
    throw new Error("Start date is required");
  }

  const isCurrent = Boolean(body.is_current);
  const endDate = isCurrent ? null : normalizeDate(body.end_date);

  if (startDate && endDate && endDate < startDate) {
    throw new Error("End date cannot be before the start date");
  }

  const published = Boolean(body.published);

  return {
    title: normalizeText(body.title),
    company: normalizeText(body.company),
    company_url: normalizeUrl(body.company_url),
    logo_url: normalizeLogo(body.logo_url),
    location: normalizeText(body.location),
    employment_type: normalizeEmploymentType(body.employment_type),
    start_date: startDate,
    end_date: endDate,
    is_current: isCurrent,
    description: normalizeText(body.description),
    highlights: normalizeStringList(body.highlights),
    skills: normalizeStringList(body.skills),
    sort_order: normalizeSortOrder(body.sort_order),
    category,
    published,
    published_at: published ? existingPublishedAt || new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  };
}
