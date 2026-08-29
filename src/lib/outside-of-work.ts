// Shared types + validation for the home page "Outside of work" section
// (photos I shoot, food spots I love, and the games on my PS5).

export const OUTSIDE_KINDS = ["photo", "food", "game"] as const;
export type OutsideKind = (typeof OUTSIDE_KINDS)[number];

export const GAME_STATUSES = ["playing", "completed", "backlog", "wishlist"] as const;
export type GameStatus = (typeof GAME_STATUSES)[number];

export type OutsideItem = {
  id: string;
  kind: OutsideKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  storage_path: string | null;
  link_url: string | null;
  rating: number | null;
  game_status: GameStatus | null;
  tags: string[];
  is_published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

/** Public-facing shape — what the bento tiles need to render. */
export type PublicOutsideItem = Pick<
  OutsideItem,
  | "id"
  | "kind"
  | "title"
  | "subtitle"
  | "description"
  | "image_url"
  | "link_url"
  | "rating"
  | "game_status"
  | "tags"
>;

/** Grouped payload returned by `GET /api/outside-of-work`. */
export type OutsideOfWorkPayload = {
  photos: PublicOutsideItem[];
  food: PublicOutsideItem[];
  games: PublicOutsideItem[];
};

/** Bucket the admin uploads into (the same public one the blog uses). */
export const OUTSIDE_BUCKET = "blog-images";
/** Folder inside the bucket for this section's uploads. */
export const OUTSIDE_PREFIX = "outside-of-work";

export const TITLE_MAX = 120;
export const SUBTITLE_MAX = 120;
export const DESCRIPTION_MAX = 400;
export const TAG_MAX = 32;
export const TAGS_MAX_COUNT = 6;

export const GAME_STATUS_LABEL: Record<GameStatus, string> = {
  playing: "Playing",
  completed: "Completed",
  backlog: "Backlog",
  wishlist: "Wishlist",
};

export function isOutsideKind(value: unknown): value is OutsideKind {
  return typeof value === "string" && (OUTSIDE_KINDS as readonly string[]).includes(value);
}

export function isGameStatus(value: unknown): value is GameStatus {
  return typeof value === "string" && (GAME_STATUSES as readonly string[]).includes(value);
}

/** `http(s)` only — the tiles render these as user-clickable links. */
function cleanUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    const url = new URL(trimmed);
    return url.protocol === "http:" || url.protocol === "https:" ? trimmed : null;
  } catch {
    return null;
  }
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

function cleanTags(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  for (const raw of value) {
    if (typeof raw !== "string") continue;
    const tag = raw.trim().slice(0, TAG_MAX);
    if (tag) seen.add(tag);
    if (seen.size >= TAGS_MAX_COUNT) break;
  }
  return [...seen];
}

export type OutsideItemInput = {
  kind: OutsideKind;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  storage_path: string | null;
  link_url: string | null;
  rating: number | null;
  game_status: GameStatus | null;
  tags: string[];
  is_published: boolean;
  sort_order: number;
};

/**
 * Validate + trim an admin submission. `partial` mode (PATCH) only returns the
 * keys that were actually present, so an edit can touch one field at a time.
 */
export function parseOutsideItemInput(
  body: unknown,
  { partial = false }: { partial?: boolean } = {}
): { ok: true; value: Partial<OutsideItemInput> } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const out: Partial<OutsideItemInput> = {};

  if (!partial || b.kind !== undefined) {
    if (!isOutsideKind(b.kind)) {
      return { ok: false, error: "Pick a valid kind: photo, food, or game." };
    }
    out.kind = b.kind;
  }

  if (!partial || b.title !== undefined) {
    const title = cleanText(b.title, TITLE_MAX);
    if (!title) return { ok: false, error: "Title is required." };
    out.title = title;
  }

  if (!partial || b.subtitle !== undefined) out.subtitle = cleanText(b.subtitle, SUBTITLE_MAX);
  if (!partial || b.description !== undefined) {
    out.description = cleanText(b.description, DESCRIPTION_MAX);
  }
  if (!partial || b.image_url !== undefined) out.image_url = cleanUrl(b.image_url);
  if (!partial || b.storage_path !== undefined) {
    out.storage_path = cleanText(b.storage_path, 400);
  }
  if (!partial || b.link_url !== undefined) out.link_url = cleanUrl(b.link_url);

  if (!partial || b.rating !== undefined) {
    if (b.rating === null || b.rating === "" || b.rating === undefined) {
      out.rating = null;
    } else {
      const rating = Number(b.rating);
      if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
        return { ok: false, error: "Rating must be between 1 and 5." };
      }
      out.rating = Math.trunc(rating);
    }
  }

  if (!partial || b.game_status !== undefined) {
    if (b.game_status === null || b.game_status === "" || b.game_status === undefined) {
      out.game_status = null;
    } else if (!isGameStatus(b.game_status)) {
      return { ok: false, error: "Invalid game status." };
    } else {
      out.game_status = b.game_status;
    }
  }

  if (!partial || b.tags !== undefined) out.tags = cleanTags(b.tags);

  if (!partial || b.is_published !== undefined) {
    out.is_published = partial && b.is_published === undefined ? true : b.is_published !== false;
  }

  if (!partial || b.sort_order !== undefined) {
    const sort = Number(b.sort_order ?? 0);
    out.sort_order = Number.isFinite(sort) ? Math.trunc(sort) : 0;
  }

  // A photo tile without an image is an empty frame; food/game can stand on text.
  if (out.kind === "photo" && !partial && !out.image_url) {
    return { ok: false, error: "A photo needs an image." };
  }

  return { ok: true, value: out };
}

/** Splits a flat list into the three tiles the section renders. */
export function groupOutsideItems(items: PublicOutsideItem[]): OutsideOfWorkPayload {
  return {
    photos: items.filter((i) => i.kind === "photo"),
    food: items.filter((i) => i.kind === "food"),
    games: items.filter((i) => i.kind === "game"),
  };
}
