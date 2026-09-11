import type { Payload } from "payload";
import { buildCaption } from "./caption";
import { getProjectBySlugRaw } from "@/lib/project-store";
import {
  createInstagramCarousel,
  createInstagramReel,
  getInstagramContainerStatus,
  metaConfig,
  postFacebookCarousel,
  postFacebookVideo,
  publishInstagramContainer,
  waitForInstagramContainer,
  type MetaConfig,
} from "./meta";

// Posts a listing's generated social assets (SocialAssets row) to the
// LankaNewHomes Facebook Page and Instagram account, logging one SocialPosts
// row per platform × kind. Used by the /cms Social tab button, the
// auto-post hook (project flips to published), and nothing else.

export type Platform = "facebook" | "instagram";
export type Kind = "carousel" | "reel";
export type PostStatus = "published" | "processing" | "failed" | "dry_run";

export type SocialPostRecord = {
  id: string | number;
  platform: Platform;
  kind: Kind;
  status: PostStatus;
  externalId?: string | null;
  creationId?: string | null;
  permalink?: string | null;
  error?: string | null;
  postedAt?: string | null;
  triggeredBy?: string | null;
};

export type SocialAssetsRecord = {
  reelUrl?: string | null;
  reelPosterUrl?: string | null;
  reelDurationSec?: number | null;
  cards?: { url: string }[] | null;
  generatedAt?: string | null;
  notes?: string | null;
};

type ProjectDoc = { id: string | number; slug: string; name: string; developer?: unknown; isPublished?: boolean; social?: { caption?: string | null; autoPost?: boolean | null } | null };

export async function loadSocialContext(payload: Payload, projectId: string | number) {
  const project = (await payload.findByID({ collection: "projects", id: projectId, depth: 0, overrideAccess: true })) as unknown as ProjectDoc;
  const { docs } = await payload.find({ collection: "social-assets", where: { project: { equals: project.id } }, limit: 1, depth: 0, overrideAccess: true });
  const assets = (docs[0] as unknown as (SocialAssetsRecord & { id: string | number }) | undefined) ?? null;
  let caption = project.social?.caption?.trim() ?? "";
  if (!caption) {
    const shaped = await getProjectBySlugRaw(project.slug).catch(() => undefined);
    caption = shaped ? buildCaption(shaped) : `${project.name}\n\nlankanewhomes.com/projects/${project.slug}`;
  }
  return { project, assets, caption };
}

export async function listSocialPosts(payload: Payload, projectId: string | number, limit = 30): Promise<SocialPostRecord[]> {
  const { docs } = await payload.find({ collection: "social-posts", where: { project: { equals: projectId } }, sort: "-createdAt", limit, depth: 0, overrideAccess: true });
  return docs as unknown as SocialPostRecord[];
}

async function record(payload: Payload, projectId: string | number, data: Omit<SocialPostRecord, "id"> & { caption: string; details?: unknown }): Promise<SocialPostRecord> {
  const doc = await payload.create({
    collection: "social-posts",
    overrideAccess: true,
    data: { project: projectId, ...data, postedAt: data.postedAt ?? new Date().toISOString() } as never,
  });
  return doc as unknown as SocialPostRecord;
}

async function postOne(cfg: MetaConfig | null, platform: Platform, kind: Kind, assets: SocialAssetsRecord, caption: string, projectName: string) {
  const cards = (assets.cards ?? []).map((c) => c.url).filter(Boolean);
  if (kind === "carousel" && cards.length === 0) throw new Error("No carousel cards generated yet.");
  if (kind === "reel" && !assets.reelUrl) throw new Error("No reel generated yet.");
  const media = kind === "carousel" ? { imageUrls: cards } : { videoUrl: assets.reelUrl!, coverUrl: assets.reelPosterUrl ?? undefined };
  if (!cfg) return { status: "dry_run" as const, details: { platform, kind, caption, ...media } };

  if (platform === "facebook") {
    if (kind === "carousel") {
      const r = await postFacebookCarousel(cfg, cards, caption);
      return { status: "published" as const, externalId: r.postId, permalink: r.permalink, details: media };
    }
    const r = await postFacebookVideo(cfg, assets.reelUrl!, caption, projectName);
    return { status: "published" as const, externalId: r.videoId, permalink: r.permalink, details: media };
  }

  // Instagram: create a container, wait (bounded) for Meta to process it, publish.
  const { creationId } = kind === "carousel"
    ? await createInstagramCarousel(cfg, cards, caption)
    : await createInstagramReel(cfg, assets.reelUrl!, caption, assets.reelPosterUrl ?? undefined);
  const status = await waitForInstagramContainer(cfg, creationId, { timeoutMs: kind === "reel" ? 45_000 : 20_000 });
  if (status === "FINISHED") {
    const r = await publishInstagramContainer(cfg, creationId);
    return { status: "published" as const, externalId: r.mediaId, creationId, permalink: r.permalink, details: media };
  }
  if (status === "IN_PROGRESS") return { status: "processing" as const, creationId, details: media };
  throw new Error(`Instagram container ${creationId} ended in ${status}.`);
}

export async function publishProjectSocial(
  payload: Payload,
  projectId: string | number,
  { platforms = ["facebook", "instagram"], kinds = ["carousel", "reel"] }: { platforms?: Platform[]; kinds?: Kind[] } = {},
  triggeredBy = "manual",
): Promise<{ configured: boolean; posts: SocialPostRecord[] }> {
  const { project, assets, caption } = await loadSocialContext(payload, projectId);
  if (!assets) throw new Error(`No social assets for ${project.slug} — run: npm run social:generate -- ${project.slug}`);
  const cfg = metaConfig();
  const posts: SocialPostRecord[] = [];
  for (const platform of platforms) {
    for (const kind of kinds) {
      try {
        const r = await postOne(cfg, platform, kind, assets, caption, project.name);
        posts.push(await record(payload, project.id, { platform, kind, caption, triggeredBy, ...r }));
      } catch (error) {
        posts.push(await record(payload, project.id, { platform, kind, caption, triggeredBy, status: "failed", error: error instanceof Error ? error.message : String(error) }));
      }
    }
  }
  return { configured: cfg !== null, posts };
}

/** For a `processing` Instagram row: check the container once more and publish it if Meta has finished encoding. */
export async function finishInstagramPost(payload: Payload, socialPostId: string | number): Promise<SocialPostRecord> {
  const post = (await payload.findByID({ collection: "social-posts", id: socialPostId, depth: 0, overrideAccess: true })) as unknown as SocialPostRecord;
  const cfg = metaConfig();
  if (!cfg || post.status !== "processing" || !post.creationId) return post;
  let data: Partial<SocialPostRecord>;
  try {
    const { status, detail } = await getInstagramContainerStatus(cfg, post.creationId);
    if (status === "FINISHED") {
      const r = await publishInstagramContainer(cfg, post.creationId);
      data = { status: "published", externalId: r.mediaId, permalink: r.permalink, postedAt: new Date().toISOString() };
    } else if (status === "IN_PROGRESS") {
      return post;
    } else {
      data = { status: "failed", error: `Instagram container ${status}${detail ? `: ${detail}` : ""}` };
    }
  } catch (error) {
    data = { status: "failed", error: error instanceof Error ? error.message : String(error) };
  }
  const updated = await payload.update({ collection: "social-posts", id: socialPostId, data: data as never, overrideAccess: true });
  return updated as unknown as SocialPostRecord;
}
