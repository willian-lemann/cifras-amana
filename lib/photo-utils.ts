/**
 * Pure helpers for the listing photo gallery: reordering and cover selection.
 *
 * The photos are ordered; the first photo (index 0) is always the cover image
 * shown as the listing's main photo.
 */

/** Moves a photo from one position to another, returning a new array. */
export function reorderPhotos(
  photos: string[],
  from: number,
  to: number,
): string[] {
  if (from === to) return [...photos];
  if (from < 0 || from >= photos.length || to < 0 || to >= photos.length) {
    return [...photos];
  }
  const next = [...photos];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/** The cover is always the first photo in the ordered list. */
export function getCoverPhoto(photos: string[]): string {
  return photos[0] ?? "";
}

export interface ClampResult<T> {
  /** Items that fit within the limit. */
  accepted: T[];
  /** How many items had to be dropped because the limit was reached. */
  rejectedCount: number;
}

/**
 * Accepts at most `max - current` items, reporting how many were dropped so the
 * UI can tell the user they went over the photo limit.
 */
export function clampToLimit<T>(
  current: number,
  incoming: T[],
  max: number,
): ClampResult<T> {
  const remaining = Math.max(0, max - current);
  if (incoming.length <= remaining) {
    return { accepted: incoming, rejectedCount: 0 };
  }
  return {
    accepted: incoming.slice(0, remaining),
    rejectedCount: incoming.length - remaining,
  };
}
