import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Copies a developer's images/brochure into our R2 bucket so a draft listing
// never hot-links the developer's site (which next/image wouldn't allow
// anyway — only our media host is on the allow-list). Same bucket layout as
// the curated projects: projects/<slug>/gallery/<slug>_image-01.jpg etc.
// (docs/supabase-workflow.md "Bucket layout").

const env = {
  accountId: process.env.R2_ACCOUNT_ID ?? "",
  accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
  secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
  bucket: process.env.R2_BUCKET ?? "",
  publicUrl: (process.env.R2_PUBLIC_URL ?? "").replace(/\/+$/, ""),
};

export const isMirrorConfigured = () => Boolean(env.accountId && env.accessKeyId && env.secretAccessKey && env.bucket && env.publicUrl);

let client: S3Client | undefined;
function s3() {
  client ??= new S3Client({
    region: "auto",
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: env.accessKeyId, secretAccessKey: env.secretAccessKey },
    forcePathStyle: true,
  });
  return client;
}

export async function fetchWithLimit(url: string, { timeoutMs, maxBytes, accept }: { timeoutMs: number; maxBytes: number; accept?: string }): Promise<{ body: Buffer; contentType: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "user-agent": "Mozilla/5.0 (compatible; LankaNewHomesImporter/1.0; +https://www.lankanewhomes.com)", ...(accept ? { accept } : {}) },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const declared = Number(res.headers.get("content-length") ?? 0);
    if (declared > maxBytes) throw new Error(`too large (${Math.round(declared / 1048576)} MB)`);
    const body = Buffer.from(await res.arrayBuffer());
    if (body.length > maxBytes) throw new Error(`too large (${Math.round(body.length / 1048576)} MB)`);
    return { body, contentType: (res.headers.get("content-type") ?? "").split(";")[0].trim().toLowerCase() };
  } finally {
    clearTimeout(timer);
  }
}

const EXT_BY_TYPE: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

export async function mirrorToR2(key: string, body: Buffer, contentType: string): Promise<string> {
  await s3().send(new PutObjectCommand({ Bucket: env.bucket, Key: key, Body: body, ContentType: contentType, CacheControl: "public, max-age=31536000, immutable" }));
  return `${env.publicUrl}/${key}`;
}

export type MirrorResult = { mirrored: { source: string; url: string }[]; failed: { source: string; reason: string }[] };

// Downloads up to `max` remote files and stores them under
// `${keyPrefix}/${namePrefix}_${label}-NN.<ext>`. Failures are reported, not
// thrown, so one dead image doesn't sink the whole import.
export async function mirrorRemoteFiles(sources: string[], { keyPrefix, namePrefix, label, max, maxBytes = 8 * 1024 * 1024, timeoutMs = 12_000, concurrency = 4 }: { keyPrefix: string; namePrefix: string; label: string; max: number; maxBytes?: number; timeoutMs?: number; concurrency?: number }): Promise<MirrorResult> {
  const picked = sources.slice(0, max);
  // Download in parallel (a page of 20 photos one-by-one blew most of the
  // 60 s function budget); keep the original order for numbering.
  type Download = { source: string; body: Buffer; contentType: string; ext: string } | { source: string; error: string };
  const downloads = await mapWithConcurrency<string, Download>(picked, concurrency, async (source) => {
    try {
      const { body, contentType } = await fetchWithLimit(source, { timeoutMs, maxBytes });
      const ext = EXT_BY_TYPE[contentType];
      if (!ext) throw new Error(`unsupported type ${contentType || "unknown"}`);
      return { source, body, contentType, ext };
    } catch (error) {
      return { source, error: error instanceof Error ? error.message : String(error) };
    }
  });
  const result: MirrorResult = { mirrored: [], failed: [] };
  let index = 0;
  const uploads: Promise<void>[] = [];
  for (const d of downloads) {
    if ("error" in d) { result.failed.push({ source: d.source, reason: d.error }); continue; }
    index += 1;
    const key = `${keyPrefix}/${namePrefix}_${label}-${String(index).padStart(2, "0")}.${d.ext}`;
    uploads.push(mirrorToR2(key, d.body, d.contentType).then((url) => { result.mirrored.push({ source: d.source, url }); }).catch((error) => { result.failed.push({ source: d.source, reason: error instanceof Error ? error.message : String(error) }); }));
  }
  await Promise.all(uploads);
  result.mirrored.sort((a, b) => picked.indexOf(a.source) - picked.indexOf(b.source));
  return result;
}

async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) { const i = next++; results[i] = await fn(items[i]); }
  }));
  return results;
}
