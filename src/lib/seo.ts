const FALLBACK_SITE_URL = "https://lankaliving.lk";

function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return FALLBACK_SITE_URL;
  return trimmed.endsWith("/") ? trimmed.slice(0, -1) : trimmed;
}

export function getSiteUrl(): string {
  return normalizeBaseUrl(process.env.NEXT_PUBLIC_SITE_URL ?? FALLBACK_SITE_URL);
}

export function toAbsoluteUrl(pathname: string): string {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
