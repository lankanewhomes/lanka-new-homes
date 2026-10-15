import type { Payload } from "payload";
import { graph, metaConfig, type MetaConfig } from "./meta";

// Reads what is already on the LankaNewHomes Instagram account and Facebook Page (posts, reels, videos, stories) through Meta's Graph
// API, matches each item to a listing, and keeps it in the Social posts collection so admins and the listing's developer can see it
// in the dashboard (/dashboard/social). Runs every day (/api/cron/social-sync) and on demand from the dashboard.
//
// Matching is deliberately strict: a post is linked to a listing only when its caption or link names that listing (see matchProject).
// Anything else is kept as "unmatched" for an admin to assign, never guessed. Needs META_PAGE_ID, META_PAGE_ACCESS_TOKEN and
// META_IG_USER_ID, and a token that can READ content (pages_read_engagement, instagram_basic); without them the sync reports
// "not connected" and changes nothing.

export type SocialKind = "carousel" | "reel" | "photo" | "video" | "story";
export type SocialItem = {
  platform: "facebook" | "instagram";
  kind: SocialKind;
  externalId: string;
  caption: string;
  permalink: string;
  postedAt: string | null;
  mediaUrl?: string;
  thumbnailUrl?: string;
  likes?: number;
  comments?: number;
};

// ---------------------------------------------------------------- mapping Graph responses

type IgMedia = { id: string; caption?: string; media_type?: string; media_product_type?: string; permalink?: string; timestamp?: string; thumbnail_url?: string; media_url?: string; like_count?: number; comments_count?: number };

export function mapInstagramMedia(m: IgMedia, story = false): SocialItem {
  const kind: SocialKind = story || m.media_product_type === "STORY" ? "story" : m.media_product_type === "REELS" ? "reel" : m.media_type === "CAROUSEL_ALBUM" ? "carousel" : m.media_type === "VIDEO" ? "video" : "photo";
  return {
    platform: "instagram", kind, externalId: m.id, caption: m.caption ?? "", permalink: m.permalink ?? `https://www.instagram.com/p/${m.id}/`,
    postedAt: m.timestamp ?? null, mediaUrl: m.media_url, thumbnailUrl: m.thumbnail_url ?? (m.media_type === "VIDEO" ? undefined : m.media_url), likes: m.like_count, comments: m.comments_count,
  };
}

type FbPost = { id: string; message?: string; permalink_url?: string; created_time?: string; full_picture?: string; attachments?: { data?: { media_type?: string; type?: string; media?: { image?: { src?: string } }; subattachments?: { data?: unknown[] } }[] } };

export function mapFacebookPost(p: FbPost): SocialItem {
  const a = p.attachments?.data?.[0];
  const type = `${a?.media_type ?? ""} ${a?.type ?? ""}`.toLowerCase();
  const kind: SocialKind = a?.subattachments?.data?.length ? "carousel" : /video/.test(type) ? "video" : "photo";
  return { platform: "facebook", kind, externalId: p.id, caption: p.message ?? "", permalink: p.permalink_url ?? `https://www.facebook.com/${p.id}`, postedAt: p.created_time ?? null, thumbnailUrl: p.full_picture ?? a?.media?.image?.src };
}

type FbVideo = { id: string; description?: string; title?: string; permalink_url?: string; created_time?: string; picture?: string };
export function mapFacebookVideo(v: FbVideo): SocialItem {
  return { platform: "facebook", kind: "video", externalId: v.id, caption: [v.title, v.description].filter(Boolean).join("\n"), permalink: v.permalink_url ? (v.permalink_url.startsWith("http") ? v.permalink_url : `https://www.facebook.com${v.permalink_url}`) : `https://www.facebook.com/watch/?v=${v.id}`, postedAt: v.created_time ?? null, thumbnailUrl: v.picture };
}

// ---------------------------------------------------------------- matching posts to listings

export type MatchProject = { id: number | string; name: string; slug: string };
export type Match = { project: MatchProject; by: "link" | "name" | "hashtag" };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[̀-ͯ]/g, "").replace(/&/g, " and ").replace(/[^a-z0-9]+/g, " ").trim();
const squash = (s: string) => norm(s).replace(/ /g, "");
const GENERIC = new Set(["the", "residencies", "residences", "residence", "apartments", "apartment", "villas", "villa", "towers", "tower", "lands", "land", "city", "homes", "home", "park", "gardens", "garden", "suites", "heights", "estate"]);

/** The names a listing is known by: "The Golf - Colombo 08" is also "The Golf" and "The Golf Colombo 08". */
function aliases(p: MatchProject): string[] {
  const full = norm(p.name);
  const out = new Set<string>([full]);
  const head = norm(p.name.split(/\s[-–—|]\s/)[0]);
  if (head && head !== full) out.add(head);
  return [...out].filter((a) => a.length >= 5 && a.split(" ").some((w) => !GENERIC.has(w) && w.length >= 3));
}

/**
 * Links a caption to a listing. Order of trust: a lankanewhomes.com/projects/<slug> link, then the listing's name as whole words, then a
 * hashtag made of the name (#thegolfcolombo08). When two listings tie, or a short alias like "The Golf" would also appear inside
 * another listing's longer name, the longest match wins; an unresolved tie stays unmatched rather than guessed.
 */
export function matchProject(caption: string, projects: MatchProject[]): Match | null {
  if (!caption.trim()) return null;
  const bySlug = [...caption.matchAll(/lankanewhomes\.com\/(?:projects|land)\/([a-z0-9-]+)/gi)].map((m) => m[1].toLowerCase());
  for (const slug of bySlug) {
    const p = projects.find((x) => x.slug.toLowerCase() === slug);
    if (p) return { project: p, by: "link" };
  }
  const text = ` ${norm(caption)} `;
  const hashtags = (caption.match(/#[\p{L}\p{N}_]+/gu) ?? []).map((h) => squash(h));
  let best: { p: MatchProject; len: number; by: Match["by"] }[] = [];
  const consider = (p: MatchProject, len: number, by: Match["by"]) => {
    if (!best.length || len > best[0].len) best = [{ p, len, by }];
    else if (len === best[0].len && !best.some((b) => b.p.id === p.id)) best.push({ p, len, by });
  };
  for (const p of projects) {
    for (const a of aliases(p)) {
      if (text.includes(` ${a} `)) consider(p, a.length, "name");
      else if (hashtags.some((h) => h === a.replace(/ /g, "") || (a.replace(/ /g, "").length >= 8 && h.includes(a.replace(/ /g, ""))))) consider(p, a.length - 0.5, "hashtag");
    }
  }
  return best.length === 1 ? { project: best[0].p, by: best[0].by } : null;
}

// ---------------------------------------------------------------- fetching from Meta

type Paged<T> = { data?: T[]; paging?: { next?: string } };

async function pagedGet<T>(path: string, token: string, params: Record<string, string | number>, maxPages = 6): Promise<T[]> {
  const out: T[] = [];
  let res = await graph<Paged<T>>(path, token, params, "GET");
  for (let i = 0; i < maxPages; i++) {
    out.push(...(res.data ?? []));
    const next = res.paging?.next;
    if (!next) break;
    const r = await fetch(next);
    res = (await r.json()) as Paged<T>;
    if (!r.ok) break;
  }
  return out;
}

export async function fetchMetaContent(cfg: MetaConfig): Promise<{ items: SocialItem[]; errors: string[] }> {
  const items: SocialItem[] = [];
  const errors: string[] = [];
  const igFields = "id,caption,media_type,media_product_type,permalink,timestamp,thumbnail_url,media_url,like_count,comments_count";
  await Promise.all([
    pagedGet<IgMedia>(`/${cfg.igUserId}/media`, cfg.pageToken, { fields: igFields, limit: 50 }).then((r) => items.push(...r.map((m) => mapInstagramMedia(m)))).catch((e) => errors.push(`Instagram posts: ${e.message}`)),
    // Stories only exist for 24 hours, so the daily run keeps each one it sees.
    pagedGet<IgMedia>(`/${cfg.igUserId}/stories`, cfg.pageToken, { fields: igFields, limit: 50 }, 1).then((r) => items.push(...r.map((m) => mapInstagramMedia(m, true)))).catch((e) => errors.push(`Instagram stories: ${e.message}`)),
    pagedGet<FbPost>(`/${cfg.pageId}/posts`, cfg.pageToken, { fields: "id,message,permalink_url,created_time,full_picture,attachments{media_type,type,media,subattachments}", limit: 50 }).then((r) => items.push(...r.map(mapFacebookPost))).catch((e) => errors.push(`Facebook posts: ${e.message}`)),
    pagedGet<FbVideo>(`/${cfg.pageId}/videos`, cfg.pageToken, { fields: "id,title,description,permalink_url,created_time,picture", limit: 50 }).then((r) => items.push(...r.map(mapFacebookVideo))).catch((e) => errors.push(`Facebook videos: ${e.message}`)),
  ]);
  // A Facebook video usually also appears as a post: keep the richer video row once.
  const seen = new Set<string>();
  return { items: items.filter((i) => (seen.has(`${i.platform}:${i.externalId}`) ? false : (seen.add(`${i.platform}:${i.externalId}`), true))), errors };
}

// ---------------------------------------------------------------- the daily sync

export type SocialSyncReport = { configured: boolean; at: string; fetched: number; created: number; updated: number; matched: number; unmatched: number; errors: string[]; message?: string };
export const SYNC_KEY = "social-sync-last";

export async function runSocialSync(payload: Payload): Promise<SocialSyncReport> {
  const at = new Date().toISOString();
  const cfg = metaConfig();
  const report: SocialSyncReport = { configured: Boolean(cfg), at, fetched: 0, created: 0, updated: 0, matched: 0, unmatched: 0, errors: [] };
  if (!cfg) {
    report.message = "Meta is not connected: add META_PAGE_ID, META_PAGE_ACCESS_TOKEN and META_IG_USER_ID.";
    await payload.kv.set(SYNC_KEY, report as never).catch(() => undefined);
    return report;
  }
  const { items, errors } = await fetchMetaContent(cfg);
  report.errors = errors;
  report.fetched = items.length;
  const projects = (await payload.find({ collection: "projects", limit: 2000, depth: 0, pagination: false, select: { name: true, slug: true } as never, overrideAccess: true })).docs as unknown as MatchProject[];
  for (const item of items) {
    const existing = (await payload.find({ collection: "social-posts", where: { and: [{ platform: { equals: item.platform } }, { externalId: { equals: item.externalId } }] }, limit: 1, depth: 0, overrideAccess: true })).docs[0] as { id: number | string; project?: unknown } | undefined;
    const match = matchProject(item.caption, projects);
    const data = {
      platform: item.platform, kind: item.kind, externalId: item.externalId, caption: item.caption, permalink: item.permalink, postedAt: item.postedAt ?? undefined,
      mediaUrl: item.mediaUrl, thumbnailUrl: item.thumbnailUrl, likes: item.likes, comments: item.comments, status: "published", source: "imported",
    };
    if (existing) {
      // Counts and captions refresh; a listing is only filled in when the post had none (never overrides a manual assignment).
      await payload.update({ collection: "social-posts", id: existing.id, data: { ...data, ...(existing.project || !match ? {} : { project: match.project.id, matchedBy: match.by }) } as never, overrideAccess: true, context: { skipSocialSync: true } });
      report.updated += 1;
    } else {
      await payload.create({ collection: "social-posts", data: { ...data, ...(match ? { project: match.project.id, matchedBy: match.by } : {}) } as never, overrideAccess: true });
      report.created += 1;
    }
    if (match || existing?.project) report.matched += 1; else report.unmatched += 1;
  }
  await payload.kv.set(SYNC_KEY, report as never).catch(() => undefined);
  return report;
}
