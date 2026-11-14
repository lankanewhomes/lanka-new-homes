// Fallback for /_next/image when Cloudflare's image resizer refuses the request.
//
// 2026-11-13: floor plans and photos showed as blank boxes on listing pages. Cloudflare Images gives a
// free account 5,000 unique transformations a month; once that is used up every size that is not already
// cached fails ("IMAGES_TRANSFORM_ERROR 9422: Free unique transformations by account has been exhausted")
// and the browser got "403 Blocked" instead of a picture.
//
// So: try the optimizer first; if it throws or answers with an error, send the original file from our own
// media host instead. The picture is bigger than a resized one but it shows. The fallback is cached for a
// short time only, so resized images come back by themselves when the quota resets or the plan is upgraded.

//
// 2026-11-14, stage two: before the optimizer is asked at all, look for a ready-shrunk WebP copy of the
// picture in our own storage (made by scripts/presize-images.mjs, layout in image-sizes.js). When it is
// there the resizer is not used, so the page stays fast and the monthly quota is not spent. A picture
// with no copy yet (just uploaded) goes the old way: optimizer first, then the original.
import { SIZED_PREFIX, sizedWidthFor } from "./image-sizes.js";

// Only our own storage is ever fetched here: this must not become an open proxy.
const FALLBACK_HOSTS = new Set(["media.lankanewhomes.com"]);
const FALLBACK_CACHE_CONTROL = "public, max-age=3600";
const SIZED_CACHE_CONTROL = "public, max-age=86400, stale-while-revalidate=604800";

/** URL of the ready-shrunk copy for a /_next/image request, or null (not our storage, an SVG or GIF, already a copy). */
export function sizedSourceUrl(requestUrl) {
  const original = fallbackSourceUrl(requestUrl);
  if (!original) return null;
  const source = new URL(original);
  if (!/\.(jpe?g|png|webp)$/i.test(source.pathname) || source.pathname.startsWith(`/${SIZED_PREFIX}`)) return null;
  const width = sizedWidthFor(new URL(requestUrl).searchParams.get("w"));
  return `${source.origin}/${SIZED_PREFIX}w${width}${source.pathname}.webp`;
}

/** Every browser in use reads WebP; this only keeps it from a client that lists image types without it. */
function acceptsWebp(request) {
  const accept = request.headers.get("accept");
  return !accept || accept.includes("image/webp") || accept.includes("*/*");
}

/** The ready-shrunk copy as a response, or null when there is none (or it could not be fetched). */
async function sizedResponse(request, fetchImpl) {
  const sized = acceptsWebp(request) ? sizedSourceUrl(request.url) : null;
  if (!sized) return null;
  try {
    const copy = await fetchImpl(sized, { method: request.method });
    const type = copy.headers.get("content-type") || "";
    if (!copy.ok || !type.startsWith("image/")) {
      if (copy.body) await copy.body.cancel();
      return null;
    }
    const headers = new Headers();
    headers.set("Content-Type", type);
    const length = copy.headers.get("content-length");
    if (length) headers.set("Content-Length", length);
    headers.set("Cache-Control", SIZED_CACHE_CONTROL);
    headers.set("Vary", "Accept");
    headers.set("X-Image-Source", "presized");
    return new Response(copy.body, { status: 200, headers });
  } catch (error) {
    console.warn(`presized image fetch failed for ${sized}: ${error && error.message ? error.message : error}`);
    return null;
  }
}

/** The original image URL of a /_next/image request, or null when it is not one we may fetch directly. */
export function fallbackSourceUrl(requestUrl) {
  let url;
  try {
    url = new URL(requestUrl);
  } catch {
    return null;
  }
  if (url.pathname !== "/_next/image") return null;
  const src = url.searchParams.get("url");
  if (!src) return null;
  let source;
  try {
    source = new URL(src);
  } catch {
    return null; // relative paths (bundled assets) are served by the optimizer without a transformation
  }
  if (source.protocol !== "https:" || !FALLBACK_HOSTS.has(source.hostname)) return null;
  return source.href;
}

/**
 * Runs `handler` for the request. A /_next/image request for one of our own pictures is answered with its
 * ready-shrunk copy when there is one; otherwise the optimizer runs, and if that fails the original image
 * is sent instead. Every other request passes through untouched.
 */
export async function withImageFallback(request, handler, fetchImpl = fetch) {
  const source = request.method === "GET" || request.method === "HEAD" ? fallbackSourceUrl(request.url) : null;
  if (!source) return handler();

  const sized = await sizedResponse(request, fetchImpl);
  if (sized) return sized;

  let response;
  let failure;
  try {
    response = await handler();
    if (response.status < 400) return response;
    failure = `status ${response.status}`;
  } catch (error) {
    failure = error && error.message ? error.message : String(error);
  }

  try {
    const original = await fetchImpl(source, { method: request.method });
    const type = original.headers.get("content-type") || "";
    if (original.ok && type.startsWith("image/")) {
      console.warn(`image fallback (${failure}): serving original ${source}`);
      const headers = new Headers();
      headers.set("Content-Type", type);
      const length = original.headers.get("content-length");
      if (length) headers.set("Content-Length", length);
      headers.set("Cache-Control", FALLBACK_CACHE_CONTROL);
      headers.set("X-Image-Fallback", "original");
      return new Response(original.body, { status: 200, headers });
    }
    console.warn(`image fallback failed for ${source}: original answered ${original.status} ${type}`);
  } catch (error) {
    console.warn(`image fallback failed for ${source}: ${error && error.message ? error.message : error}`);
  }

  if (response) return response;
  return new Response("Image unavailable", { status: 502, headers: { "Cache-Control": "no-store" } });
}
