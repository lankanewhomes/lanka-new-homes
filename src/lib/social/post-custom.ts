import type { Payload } from "payload";
import { mirrorToR2 } from "@/lib/listing-import/mirror";
import { createInstagramCarousel, metaConfig, postFacebookCarousel, publishInstagramContainer, waitForInstagramContainer } from "./meta";

// Posts the images made in the dashboard's "Create a post" page. The browser sends the cropped JPEGs (data URLs); they are stored in R2 so Meta
// can fetch them, then posted to the Facebook Page and Instagram as carousels. Without META_* settings this is a dry run: nothing is sent to Meta
// and the would-be request is logged. Every attempt is logged in Social posts (one row per platform).

export type CustomPostInput = { projectId: string | number; slug: string; instagram?: { caption: string; images: string[] }; facebook?: { caption: string; images: string[] } };
export type CustomPostResult = { configured: boolean; results: { platform: "instagram" | "facebook"; status: "published" | "processing" | "failed" | "dry_run"; permalink?: string | null; error?: string; urls: string[] }[] };

async function store(slug: string, platform: string, images: string[], stamp: string): Promise<string[]> {
  const urls: string[] = [];
  for (let i = 0; i < images.length && i < 10; i++) {
    const m = images[i].match(/^data:image\/jpeg;base64,(.+)$/);
    if (!m) throw new Error("Images must be JPEG data URLs.");
    const buf = Buffer.from(m[1], "base64");
    if (buf.byteLength > 8 * 1024 * 1024) throw new Error("An image is larger than 8 MB.");
    urls.push(await mirrorToR2(`projects/${slug}/social/${stamp}/${platform}-${i + 1}.jpg`, buf, "image/jpeg"));
  }
  return urls;
}

export async function postCustom(payload: Payload, input: CustomPostInput, actor: string): Promise<CustomPostResult> {
  const cfg = metaConfig();
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, "").slice(0, 14);
  const results: CustomPostResult["results"] = [];
  for (const platform of ["instagram", "facebook"] as const) {
    const part = input[platform];
    if (!part || part.images.length === 0) continue;
    let urls: string[] = [];
    try {
      urls = await store(input.slug, platform, part.images, stamp);
      let status: "published" | "processing" | "dry_run" = "dry_run"; let permalink: string | null = null; let externalId: string | undefined; let creationId: string | undefined;
      if (cfg) {
        if (platform === "facebook") { const r = await postFacebookCarousel(cfg, urls, part.caption); status = "published"; permalink = r.permalink; externalId = r.postId; }
        else {
          const { creationId: id } = await createInstagramCarousel(cfg, urls, part.caption); creationId = id;
          const s = await waitForInstagramContainer(cfg, id, { timeoutMs: 20_000 });
          if (s === "FINISHED") { const r = await publishInstagramContainer(cfg, id); status = "published"; permalink = r.permalink; externalId = r.mediaId; }
          else if (s === "IN_PROGRESS") status = "processing";
          else throw new Error(`Instagram container ${id} ended in ${s}.`);
        }
      }
      await payload.create({ collection: "social-posts", overrideAccess: true, data: { project: input.projectId, platform, kind: "carousel", status, caption: part.caption, permalink, externalId, creationId, triggeredBy: actor, details: { urls, dashboard: true }, postedAt: new Date().toISOString() } as never });
      results.push({ platform, status, permalink, urls });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await payload.create({ collection: "social-posts", overrideAccess: true, data: { project: input.projectId, platform, kind: "carousel", status: "failed", caption: part.caption, error: message, triggeredBy: actor, postedAt: new Date().toISOString() } as never }).catch(() => undefined);
      results.push({ platform, status: "failed", error: message, urls });
    }
  }
  return { configured: cfg !== null, results };
}
