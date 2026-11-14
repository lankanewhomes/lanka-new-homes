// Shared by the worker (image-fallback.js) and scripts/presize-images.mjs: where the ready-shrunk copies
// of each photo live in the media bucket, and at which widths.
//
// Original:  https://media.lankanewhomes.com/projects/x/photo.jpg
// Copies:    https://media.lankanewhomes.com/_sized/w640/projects/x/photo.jpg.webp   (one per width)
//
// A copy is never wider than its original: a 900px photo stored under w1920 is still 900px wide.

export const SIZED_PREFIX = "_sized/";
export const SIZED_WIDTHS = [128, 384, 640, 1080, 1920];
export const SIZED_QUALITY = 75;

/** The smallest stored width that covers the width the page asked for (the biggest one if none does). */
export function sizedWidthFor(requested) {
  const wanted = Number(requested);
  if (!Number.isFinite(wanted) || wanted <= 0) return SIZED_WIDTHS[SIZED_WIDTHS.length - 1];
  return SIZED_WIDTHS.find((width) => width >= wanted) ?? SIZED_WIDTHS[SIZED_WIDTHS.length - 1];
}

/** Bucket key of the shrunk copy of `key` at `width`. */
export function sizedKey(key, width) {
  return `${SIZED_PREFIX}w${width}/${key}.webp`;
}
