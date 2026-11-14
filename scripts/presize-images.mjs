// Makes ready-shrunk WebP copies of every photo and floor plan in the media bucket, so the site does not
// need Cloudflare's image resizer (free plan: 5,000 unique resizes a month, used up on 2026-11-13).
//
// For each original `<key>` (jpg / jpeg / png / webp) it writes `_sized/w<WIDTH>/<key>.webp` for every
// width in cloudflare/image-sizes.js. The worker (cloudflare/image-fallback.js) serves those copies for
// /_next/image requests. Originals are never changed or deleted.
//
// It is incremental: `_sized/manifest.json` remembers each original's ETag, so a re-run only does new or
// replaced files. Run it after adding photos:
//
//   node --env-file=.env.local scripts/presize-images.mjs            # everything that is missing
//   node --env-file=.env.local scripts/presize-images.mjs --sample 60 --dry   # estimate only, no uploads
//   node --env-file=.env.local scripts/presize-images.mjs --prefix projects/kelsey-palace
//   node --env-file=.env.local scripts/presize-images.mjs --force    # redo all
import { S3Client, ListObjectsV2Command, GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { SIZED_PREFIX, SIZED_WIDTHS, SIZED_QUALITY, sizedKey } from "../cloudflare/image-sizes.js";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const option = (name) => (args.includes(`--${name}`) ? args[args.indexOf(`--${name}`) + 1] : undefined);
const DRY = flag("dry");
const FORCE = flag("force");
const SAMPLE = Number(option("sample") || 0);
const PREFIX = option("prefix") || "";
const CONCURRENCY = Number(option("concurrency") || 6);
const MANIFEST_KEY = `${SIZED_PREFIX}manifest.json`;
const VARIANT_CACHE_CONTROL = "public, max-age=86400";

for (const name of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET"]) {
  if (!process.env[name]) {
    console.error(`Missing ${name}. Run with: node --env-file=.env.local scripts/presize-images.mjs`);
    process.exit(1);
  }
}
const Bucket = process.env.R2_BUCKET;
const s3 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY },
});

async function listAll(prefix) {
  const out = [];
  let token;
  do {
    const page = await s3.send(new ListObjectsV2Command({ Bucket, Prefix: prefix, ContinuationToken: token }));
    for (const o of page.Contents || []) out.push({ key: o.Key, size: o.Size, etag: o.ETag });
    token = page.NextContinuationToken;
  } while (token);
  return out;
}

async function getBuffer(key) {
  const res = await s3.send(new GetObjectCommand({ Bucket, Key: key }));
  return Buffer.from(await res.Body.transformToByteArray());
}

async function readManifest() {
  try {
    return JSON.parse((await getBuffer(MANIFEST_KEY)).toString("utf8"));
  } catch {
    return {};
  }
}

async function writeManifest(manifest) {
  if (DRY) return;
  await s3.send(
    new PutObjectCommand({ Bucket, Key: MANIFEST_KEY, Body: JSON.stringify(manifest), ContentType: "application/json", CacheControl: "no-store" }),
  );
}

const all = await listAll(PREFIX);
let sources = all.filter((o) => !o.key.startsWith(SIZED_PREFIX) && /\.(jpe?g|png|webp)$/i.test(o.key));
const manifest = FORCE ? {} : await readManifest();
const total = sources.length;
let todo = sources.filter((o) => manifest[o.key] !== o.etag);
if (SAMPLE) {
  // Evenly spread sample, so every folder is represented.
  const step = Math.max(1, Math.floor(todo.length / SAMPLE));
  todo = todo.filter((_, i) => i % step === 0).slice(0, SAMPLE);
}
console.log(`${total} images in the bucket${PREFIX ? ` under ${PREFIX}` : ""}; ${todo.length} to do${DRY ? " (dry run, nothing uploaded)" : ""}`);

const stats = { done: 0, failed: 0, sourceBytes: 0, bytesByWidth: Object.fromEntries(SIZED_WIDTHS.map((w) => [w, 0])), widths: [] };
const failures = [];

async function processOne(source) {
  const input = await getBuffer(source.key);
  const meta = await sharp(input, { failOn: "none" }).metadata();
  if ((meta.pages || 1) > 1) throw new Error("animated image, skipped");
  // EXIF orientation 5-8 means the stored picture is on its side.
  const sourceWidth = (meta.orientation || 1) >= 5 ? meta.height : meta.width;
  for (const width of SIZED_WIDTHS) {
    const body = await sharp(input, { failOn: "none" })
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: SIZED_QUALITY })
      .toBuffer();
    stats.bytesByWidth[width] += body.length;
    if (!DRY) {
      await s3.send(
        new PutObjectCommand({ Bucket, Key: sizedKey(source.key, width), Body: body, ContentType: "image/webp", CacheControl: VARIANT_CACHE_CONTROL }),
      );
    }
  }
  stats.sourceBytes += source.size;
  stats.widths.push(sourceWidth);
  manifest[source.key] = source.etag;
}

let next = 0;
let sinceSave = 0;
async function worker() {
  while (next < todo.length) {
    const source = todo[next++];
    try {
      await processOne(source);
      stats.done++;
    } catch (error) {
      stats.failed++;
      failures.push(`${source.key}: ${error.message}`);
    }
    const n = stats.done + stats.failed;
    if (n % 100 === 0) console.log(`  ${n} / ${todo.length}`);
    // Save progress now and then, so an interrupted run does not start over.
    if (++sinceSave >= 250) {
      sinceSave = 0;
      await writeManifest(manifest);
    }
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));
await writeManifest(manifest);

const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;
const sizedBytes = Object.values(stats.bytesByWidth).reduce((a, b) => a + b, 0);
console.log(`\ndone ${stats.done}, failed ${stats.failed}`);
console.log(`originals processed: ${mb(stats.sourceBytes)}`);
for (const width of SIZED_WIDTHS) console.log(`  w${width}: ${mb(stats.bytesByWidth[width])}`);
console.log(`shrunk copies total: ${mb(sizedBytes)}`);
if (stats.widths.length) {
  const sorted = [...stats.widths].sort((a, b) => a - b);
  const at = (p) => sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))];
  console.log(`original widths: min ${sorted[0]}, median ${at(0.5)}, 90% ${at(0.9)}, max ${sorted[sorted.length - 1]}`);
}
if (SAMPLE && stats.done) {
  console.log(`estimate for all ${total}: ${((sizedBytes / stats.done) * total / 1e9).toFixed(2)} GB of shrunk copies`);
}
if (failures.length) console.log(`\nfailures:\n${failures.slice(0, 50).join("\n")}`);
