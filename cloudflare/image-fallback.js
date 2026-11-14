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

// Only our own storage is ever fetched here: this must not become an open proxy.
const FALLBACK_HOSTS = new Set(["media.lankanewhomes.com"]);
const FALLBACK_CACHE_CONTROL = "public, max-age=3600";

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
 * Runs `handler` for the request. For a /_next/image request whose optimizer call fails, answers with the
 * original image instead. Every other request, and every successful one, passes through untouched.
 */
export async function withImageFallback(request, handler, fetchImpl = fetch) {
  const source = request.method === "GET" || request.method === "HEAD" ? fallbackSourceUrl(request.url) : null;
  if (!source) return handler();

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
