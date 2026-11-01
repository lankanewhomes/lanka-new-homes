import { NextResponse } from "next/server";

// A small "too many requests from one visitor" guard for the public forms (contact, enquiry, reviews, uploads).
// It counts per visitor IP inside one running instance. On Cloudflare Workers each busy location can run several instances, so this
// stops a script hammering a form from one place, but it is not a hard global limit: the real limit is the Cloudflare rate-limiting
// rule (see docs/security.md). Both together: this one is free and instant, Cloudflare's is the one a determined attacker meets.

type Bucket = { count: number; resetAt: number };
const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 5000;

/** The visitor's IP as Cloudflare reports it. */
export function clientIp(request: Request): string {
  return request.headers.get("cf-connecting-ip") ?? request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

/** Count one hit. Returns true while the visitor is still under `limit` hits per `windowMs`. */
export function allowHit(key: string, limit: number, windowMs: number, now = Date.now()): boolean {
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k);
    if (buckets.size > MAX_BUCKETS) buckets.clear(); // still full of live entries: start over rather than grow without bound
  }
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/** Route helper: returns a ready 429 response when this visitor is over the limit, otherwise null. */
export function rateLimited(request: Request, name: string, limit: number, windowMs: number): NextResponse | null {
  if (allowHit(`${name}:${clientIp(request)}`, limit, windowMs)) return null;
  return NextResponse.json({ error: "Too many requests. Please wait a few minutes and try again." }, { status: 429, headers: { "Retry-After": String(Math.ceil(windowMs / 1000)) } });
}

/** Test helper. */
export function resetRateLimits() {
  buckets.clear();
}
