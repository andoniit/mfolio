// Shared types + validation for the home page photo wall (visitor Polaroids).

export type PhotoWallStatus = "pending" | "approved" | "rejected";

export type PhotoWallPost = {
  id: string;
  image_url: string;
  storage_path: string | null;
  message: string;
  author_name: string | null;
  status: PhotoWallStatus;
  sort_order: number;
  created_at: string;
  approved_at: string | null;
};

/** Public-facing shape (what the wall needs to render a Polaroid). */
export type PublicPhotoWallPost = Pick<
  PhotoWallPost,
  "id" | "image_url" | "message" | "author_name" | "created_at"
> & { status?: PhotoWallStatus };

/** Public bucket the photos are uploaded into (same one the blog/resume use). */
export const PHOTO_WALL_BUCKET = "blog-images";
/** Folder inside the bucket for visitor photos. */
export const PHOTO_WALL_PREFIX = "photo-wall";

export const MESSAGE_MAX = 140;
export const AUTHOR_MAX = 60;

/** Upper bound on the incoming data URL (a 512px JPEG is ~60–120KB raw). */
export const PHOTO_DATA_URL_MAX_CHARS = 3_000_000;

const ALLOWED_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type ParsedPhoto = { mime: string; ext: string; bytes: Buffer };

/**
 * Decode a `data:image/...;base64,...` URL into bytes we can push to storage.
 * Returns a user-facing error string when the payload isn't a supported image.
 */
export function parsePhotoDataUrl(
  value: string
): { ok: true; value: ParsedPhoto } | { ok: false; error: string } {
  const match = /^data:([a-z/+.-]+);base64,(.+)$/i.exec(value.trim());
  if (!match) return { ok: false, error: "That photo doesn't look valid." };

  const mime = match[1].toLowerCase();
  const ext = ALLOWED_MIME[mime];
  if (!ext) return { ok: false, error: "Photo must be a JPG, PNG, or WebP image." };

  let bytes: Buffer;
  try {
    bytes = Buffer.from(match[2], "base64");
  } catch {
    return { ok: false, error: "That photo doesn't look valid." };
  }
  if (bytes.length === 0) return { ok: false, error: "That photo is empty." };

  return { ok: true, value: { mime, ext, bytes } };
}

export type PhotoWallInput = {
  photo: string;
  message: string;
  author_name: string | null;
};

/**
 * Validate + trim a public submission. Returns either a cleaned payload or a
 * user-facing error message.
 */
export function parsePhotoWallInput(body: unknown):
  | { ok: true; value: PhotoWallInput }
  | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;

  const photo = typeof b.photo === "string" ? b.photo.trim() : "";
  if (!photo) return { ok: false, error: "Take a photo first." };
  if (photo.length > PHOTO_DATA_URL_MAX_CHARS) {
    return { ok: false, error: "That photo is too large." };
  }

  const message = typeof b.message === "string" ? b.message.trim() : "";
  if (!message) return { ok: false, error: "Please write a little something on it." };
  if (message.length > MESSAGE_MAX) {
    return { ok: false, error: `Message must be ${MESSAGE_MAX} characters or fewer.` };
  }

  const rawName = typeof b.author_name === "string" ? b.author_name.trim() : "";
  const author_name = rawName ? rawName.slice(0, AUTHOR_MAX) : null;

  return { ok: true, value: { photo, message, author_name } };
}

/** Stable pseudo-random in [0, 1) derived from an id + salt (deterministic). */
export function rand01(id: string, salt: number): number {
  let h = (2166136261 ^ salt) >>> 0;
  for (let i = 0; i < id.length; i++) {
    h = Math.imul(h ^ id.charCodeAt(i), 16777619);
  }
  return ((h >>> 0) % 100000) / 100000;
}

/** Formats the little date line printed on a Polaroid's lip. */
export function polaroidDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}
