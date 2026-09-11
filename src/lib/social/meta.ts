// Meta Graph API client for the LankaNewHomes Facebook Page + Instagram
// Business account. Publishes a photo carousel and a video/Reel from public
// URLs (our R2 bucket). Every function is a thin wrapper over one Graph call
// sequence and returns the ids Meta hands back, so the caller can log them.
//
// Config (env): META_PAGE_ID, META_PAGE_ACCESS_TOKEN (long-lived Page token),
// META_IG_USER_ID (Instagram Business account id), META_GRAPH_VERSION.
// With any of the first three missing the client runs in DRY-RUN mode: it
// returns what it would have posted without calling Meta. That lets the /cms
// button be exercised end-to-end before the accounts are connected.

const VERSION = process.env.META_GRAPH_VERSION || "v21.0";
const GRAPH = `https://graph.facebook.com/${VERSION}`;

export type MetaConfig = { pageId: string; pageToken: string; igUserId: string };

export function metaConfig(): MetaConfig | null {
  const pageId = process.env.META_PAGE_ID, pageToken = process.env.META_PAGE_ACCESS_TOKEN, igUserId = process.env.META_IG_USER_ID;
  return pageId && pageToken && igUserId ? { pageId, pageToken, igUserId } : null;
}

export const isMetaConfigured = () => metaConfig() !== null;

class GraphError extends Error {
  constructor(message: string, public readonly status: number, public readonly body: unknown) { super(message); }
}

async function graph<T = Record<string, unknown>>(path: string, token: string, params: Record<string, string | number | boolean | undefined>, method: "GET" | "POST" = "POST"): Promise<T> {
  const url = new URL(`${GRAPH}${path}`);
  const body = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined) body.set(k, String(v));
  body.set("access_token", token);
  const res = method === "GET"
    ? await fetch(`${url}?${body}`, { method: "GET" })
    : await fetch(url, { method: "POST", body, headers: { "content-type": "application/x-www-form-urlencoded" } });
  const json = (await res.json().catch(() => ({}))) as { error?: { message?: string; code?: number; error_subcode?: number } } & T;
  if (!res.ok || json.error) {
    const e = json.error ?? {};
    throw new GraphError(`Meta ${path}: ${e.message ?? res.statusText} (code ${e.code ?? res.status}${e.error_subcode ? `/${e.error_subcode}` : ""})`, res.status, json);
  }
  return json;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------- Facebook Page

/** Multi-photo Page post: upload each photo unpublished, then one feed post that attaches them all. */
export async function postFacebookCarousel(cfg: MetaConfig, imageUrls: string[], message: string): Promise<{ postId: string; permalink: string }> {
  const ids: string[] = [];
  for (const url of imageUrls.slice(0, 10)) {
    const r = await graph<{ id: string }>(`/${cfg.pageId}/photos`, cfg.pageToken, { url, published: false });
    ids.push(r.id);
  }
  const params: Record<string, string> = { message };
  ids.forEach((id, i) => { params[`attached_media[${i}]`] = JSON.stringify({ media_fbid: id }); });
  const post = await graph<{ id: string }>(`/${cfg.pageId}/feed`, cfg.pageToken, params);
  const link = await graph<{ permalink_url?: string }>(`/${post.id}`, cfg.pageToken, { fields: "permalink_url" }, "GET").catch(() => ({} as { permalink_url?: string }));
  return { postId: post.id, permalink: link.permalink_url ?? `https://www.facebook.com/${post.id}` };
}

/** Page video post from a public MP4 URL (the reel file). Meta encodes it asynchronously; the id is usable immediately for logging. */
export async function postFacebookVideo(cfg: MetaConfig, videoUrl: string, description: string, title?: string): Promise<{ videoId: string; permalink: string }> {
  const r = await graph<{ id: string }>(`/${cfg.pageId}/videos`, cfg.pageToken, { file_url: videoUrl, description, title });
  return { videoId: r.id, permalink: `https://www.facebook.com/${cfg.pageId}/videos/${r.id}` };
}

// ---------------------------------------------------------------- Instagram (Content Publishing API)

/** Creates a carousel container. Images must be JPEG, 4:5 … 1.91:1 — our cards are 4:5 (1080×1350). */
export async function createInstagramCarousel(cfg: MetaConfig, imageUrls: string[], caption: string): Promise<{ creationId: string }> {
  const children: string[] = [];
  for (const image_url of imageUrls.slice(0, 10)) {
    const r = await graph<{ id: string }>(`/${cfg.igUserId}/media`, cfg.pageToken, { image_url, is_carousel_item: true });
    children.push(r.id);
  }
  const r = await graph<{ id: string }>(`/${cfg.igUserId}/media`, cfg.pageToken, { media_type: "CAROUSEL", children: children.join(","), caption });
  return { creationId: r.id };
}

/** Creates a Reel container from a public MP4 URL (9:16, H.264, ≤ 90 s). Processing is asynchronous — poll with waitForInstagramContainer. */
export async function createInstagramReel(cfg: MetaConfig, videoUrl: string, caption: string, coverUrl?: string): Promise<{ creationId: string }> {
  const r = await graph<{ id: string }>(`/${cfg.igUserId}/media`, cfg.pageToken, { media_type: "REELS", video_url: videoUrl, caption, share_to_feed: true, cover_url: coverUrl });
  return { creationId: r.id };
}

export type ContainerStatus = "EXPIRED" | "ERROR" | "FINISHED" | "IN_PROGRESS" | "PUBLISHED";

export async function getInstagramContainerStatus(cfg: MetaConfig, creationId: string): Promise<{ status: ContainerStatus; detail?: string }> {
  const r = await graph<{ status_code: ContainerStatus; status?: string }>(`/${creationId}`, cfg.pageToken, { fields: "status_code,status" }, "GET");
  return { status: r.status_code, detail: r.status };
}

/** Polls until FINISHED (or failure). Bounded so a serverless request can't hang forever; returns the last seen status. */
export async function waitForInstagramContainer(cfg: MetaConfig, creationId: string, { timeoutMs = 45_000, intervalMs = 3_000 } = {}): Promise<ContainerStatus> {
  const until = Date.now() + timeoutMs;
  let status: ContainerStatus = "IN_PROGRESS";
  while (Date.now() < until) {
    status = (await getInstagramContainerStatus(cfg, creationId)).status;
    if (status !== "IN_PROGRESS") return status;
    await sleep(intervalMs);
  }
  return status;
}

export async function publishInstagramContainer(cfg: MetaConfig, creationId: string): Promise<{ mediaId: string; permalink: string }> {
  const r = await graph<{ id: string }>(`/${cfg.igUserId}/media_publish`, cfg.pageToken, { creation_id: creationId });
  const link = await graph<{ permalink?: string }>(`/${r.id}`, cfg.pageToken, { fields: "permalink" }, "GET").catch(() => ({} as { permalink?: string }));
  return { mediaId: r.id, permalink: link.permalink ?? `https://www.instagram.com/` };
}

// ---------------------------------------------------------------- token helpers (setup only)

/** Exchange a short-lived user token for a long-lived one (≈60 days). Used once, from the setup guide. */
export async function exchangeForLongLivedUserToken(appId: string, appSecret: string, shortLivedToken: string): Promise<{ accessToken: string; expiresIn?: number }> {
  const r = await graph<{ access_token: string; expires_in?: number }>(`/oauth/access_token`, shortLivedToken, {
    grant_type: "fb_exchange_token", client_id: appId, client_secret: appSecret, fb_exchange_token: shortLivedToken,
  }, "GET");
  return { accessToken: r.access_token, expiresIn: r.expires_in };
}

/** Pages this user manages, each with its own (non-expiring, when derived from a long-lived user token) Page token and linked IG account. */
export async function listManagedPages(userToken: string): Promise<{ id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[]> {
  const r = await graph<{ data: { id: string; name: string; access_token: string; instagram_business_account?: { id: string } }[] }>(`/me/accounts`, userToken, { fields: "id,name,access_token,instagram_business_account" }, "GET");
  return r.data;
}
