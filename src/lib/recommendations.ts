// Shared types, validation, and the sticky-note color palette for recommendations.

export type RecommendationStatus = "pending" | "approved" | "rejected";

export type Recommendation = {
  id: string;
  name: string;
  role: string | null;
  message: string;
  avatar_url: string | null;
  color: RecommendationColor;
  status: RecommendationStatus;
  sort_order: number;
  created_at: string;
  approved_at: string | null;
};

/** Public-facing shape (what the home page wall needs). */
export type PublicRecommendation = Pick<
  Recommendation,
  "id" | "name" | "role" | "message" | "avatar_url" | "color" | "created_at"
> & { status?: RecommendationStatus };

// Sticky-note palette built from the site's brand colors
// (--mf-lime, --mf-purple, --mf-red, --mf-dark) plus a neutral cream.
export const NOTE_COLORS = {
  lime: { bg: "#dcf763", edge: "#c2e02f", ink: "#343434", tape: "#e8fb8f", avatarBg: "rgba(0,0,0,0.12)" },
  purple: { bg: "#6b63f7", edge: "#564ee8", ink: "#ffffff", tape: "#8a83ff", avatarBg: "rgba(255,255,255,0.22)" },
  red: { bg: "#ea3e3e", edge: "#d62b2b", ink: "#ffffff", tape: "#f46c6c", avatarBg: "rgba(255,255,255,0.22)" },
  dark: { bg: "#343434", edge: "#1f1f1f", ink: "#ffffff", tape: "#4d4d4d", avatarBg: "rgba(255,255,255,0.18)" },
  cream: { bg: "#fbfbf4", edge: "#e6e6da", ink: "#343434", tape: "#efefe2", avatarBg: "rgba(0,0,0,0.10)" },
} as const;

export type RecommendationColor = keyof typeof NOTE_COLORS;

export const NOTE_COLOR_KEYS = Object.keys(NOTE_COLORS) as RecommendationColor[];

export const DEFAULT_NOTE_COLOR: RecommendationColor = "lime";

export function isValidColor(value: unknown): value is RecommendationColor {
  return typeof value === "string" && value in NOTE_COLORS;
}

export function normalizeColor(value: unknown): RecommendationColor {
  return isValidColor(value) ? value : DEFAULT_NOTE_COLOR;
}

export const NAME_MAX = 80;
export const ROLE_MAX = 100;
export const MESSAGE_MAX = 600;

/** Max raw upload size for a public avatar photo. */
export const AVATAR_MAX_BYTES = 500 * 1024; // 500 KB
/** Upper bound on the stored avatar string (data URL or hosted link). */
export const AVATAR_URL_MAX_CHARS = 800_000;

/** Accept a hosted http(s) image link or an inline `data:image/...` URL. */
export function isValidAvatarValue(value: string): boolean {
  return value.startsWith("data:image/") || /^https?:\/\//i.test(value);
}

export type RecommendationInput = {
  name: string;
  role: string | null;
  message: string;
  avatar_url: string | null;
};

/**
 * Validate + trim a public submission. Returns either a cleaned payload or a
 * user-facing error message.
 */
export function parseRecommendationInput(body: unknown):
  | { ok: true; value: RecommendationInput }
  | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const name = typeof b.name === "string" ? b.name.trim() : "";
  if (!name) return { ok: false, error: "Please add your name." };
  if (name.length > NAME_MAX) {
    return { ok: false, error: `Name must be ${NAME_MAX} characters or fewer.` };
  }

  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) return { ok: false, error: "Please write a recommendation." };
  if (message.length > MESSAGE_MAX) {
    return { ok: false, error: `Recommendation must be ${MESSAGE_MAX} characters or fewer.` };
  }

  const rawRole = typeof b.role === "string" ? b.role.trim() : "";
  const role = rawRole ? rawRole.slice(0, ROLE_MAX) : null;

  const rawAvatar = typeof b.avatar_url === "string" ? b.avatar_url.trim() : "";
  let avatar_url: string | null = null;
  if (rawAvatar) {
    if (!isValidAvatarValue(rawAvatar)) {
      return { ok: false, error: "That image doesn't look valid." };
    }
    if (rawAvatar.length > AVATAR_URL_MAX_CHARS) {
      return { ok: false, error: "Image is too large. Please keep it under 500KB." };
    }
    avatar_url = rawAvatar;
  }

  return { ok: true, value: { name: name.slice(0, NAME_MAX), message, role, avatar_url } };
}

/** Initials for the avatar bubble, e.g. "Sarah Chen" -> "SC". */
export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
