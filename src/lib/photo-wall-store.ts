// Browser-side record of the Polaroids *this* visitor submitted, so their own
// photo shows on the wall (badged "pending review") before it's approved.
// The camera section writes here on submit and fires PHOTO_WALL_EVENT; the wall
// listens and pins the photo without a refetch.

import type { PublicPhotoWallPost } from "./photo-wall";

const STORE_KEY = "mf:photo-wall:mine";

/** Fired on `window` after a submission is saved. `detail` is the new post. */
export const PHOTO_WALL_EVENT = "mf:photo-wall-added";

export function readMine(): PublicPhotoWallPost[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORE_KEY);
    const parsed = raw ? (JSON.parse(raw) as PublicPhotoWallPost[]) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function writeMine(posts: PublicPhotoWallPost[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORE_KEY, JSON.stringify(posts));
  } catch {
    /* ignore quota / private mode */
  }
}

/** Persist a just-submitted post and let the wall know about it. */
export function addMine(post: PublicPhotoWallPost) {
  writeMine([post, ...readMine().filter((p) => p.id !== post.id)]);
  window.dispatchEvent(new CustomEvent<PublicPhotoWallPost>(PHOTO_WALL_EVENT, { detail: post }));
}
