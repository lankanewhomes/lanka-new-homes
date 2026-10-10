// next/image loader. Everything goes through Next's own optimizer except SVGs (see below) and Wikimedia Commons photos (city and landmark
// pictures): Wikimedia answers 403 to Cloudflare's image fetcher, so on Cloudflare those tiles showed broken images. The
// browser may fetch them directly, so for those hosts the src is used as-is (they are already sized thumbnails).
export default function imageLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  if (/^https?:\/\/(thumb|upload)\.wikimedia\.org\//.test(src)) return src;
  // SVGs (floor plans, drawings) can't go through the optimizer — it answers 400 "image type is not allowed", so the plans showed
  // as broken images. They are vector files: the browser loads them straight from the media server at any size.
  if (/\.svg(\?.*)?$/i.test(src)) return src;
  return `/_next/image?url=${encodeURIComponent(src)}&w=${width}&q=${quality || 75}`;
}
