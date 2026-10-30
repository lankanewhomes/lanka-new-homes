"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertCircle, ExternalLink, Film, Heart, Image as ImageIcon, Images, Loader2, MessageCircle, Plus, RefreshCw, Search } from "lucide-react";
import { useDash } from "./DashProvider";
import { Combobox, type ComboOption } from "./Combobox";
import { PageHero, heroBtn } from "./PageHero";
import { allOf } from "../_data/scope";
import { ApiError, apiCount, apiCreate, apiFind, apiUpdate, type Doc, type Where } from "../_data/api";

// Social content: the posts, reels, videos and stories on the LankaNewHomes Instagram account and Facebook Page, each linked to the
// listing it is about. An admin sees everything (plus the posts that name no listing, to assign by hand); a developer sees the content
// about the listings they manage. Imported every day from Meta (src/lib/social/import.ts); admins can also run it now or add a post by link.

type SyncReport = { configured: boolean; at: string; fetched: number; created: number; updated: number; matched: number; unmatched: number; errors: string[]; message?: string };
type Tab = { key: string; label: string; where: Where | null; adminOnly?: boolean };
const TABS: Tab[] = [
  { key: "all", label: "All", where: null },
  { key: "instagram", label: "Instagram", where: { platform: { equals: "instagram" } } },
  { key: "facebook", label: "Facebook", where: { platform: { equals: "facebook" } } },
  { key: "tiktok", label: "TikTok", where: { platform: { equals: "tiktok" } } },
  { key: "reels", label: "Reels and videos", where: { kind: { in: ["reel", "video"] } } },
  { key: "stories", label: "Stories", where: { kind: { equals: "story" } } },
  { key: "land", label: "Land", where: { land: { exists: true } } },
  { key: "unmatched", label: "Not linked to a listing", where: { and: [{ project: { exists: false } }, { land: { exists: false } }] }, adminOnly: true },
];
const KINDS = [["photo", "Photo post"], ["carousel", "Carousel"], ["reel", "Reel"], ["video", "Video"], ["story", "Story"]] as const;
const KIND_LABEL: Record<string, string> = { photo: "Photo", carousel: "Carousel", reel: "Reel", video: "Video", story: "Story" };
// Brand colours for the platform name on each post (Facebook blue, Instagram pink, TikTok red; TikTok's own black would vanish in dark mode).
const PLATFORM: Record<string, { name: string; color: string }> = {
  facebook: { name: "Facebook", color: "#1877F2" },
  instagram: { name: "Instagram", color: "#E1306C" },
  tiktok: { name: "TikTok", color: "#FE2C55" },
};
const PAGE = 24;
const idOf = (v: unknown) => (v && typeof v === "object" ? (v as { id?: unknown }).id : v);

function Thumb({ post }: { post: Doc }) {
  const [broken, setBroken] = useState(false);
  const src = String(post.thumbnailUrl || post.mediaUrl || "");
  const Icon = post.kind === "reel" || post.kind === "video" ? Film : post.kind === "carousel" ? Images : ImageIcon;
  return (
    <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-subtle text-muted">
      {src && !broken ? (
        // eslint-disable-next-line @next/next/no-img-element -- remote thumbnail from Meta
        <img src={src} alt="" loading="lazy" onError={() => setBroken(true)} className="h-full w-full object-cover" />
      ) : <Icon size={28} />}
      <span className="absolute left-2 top-2 rounded-[3px] border border-white/40 bg-black/60 px-[7px] py-[3px] text-[10px] font-bold uppercase tracking-[0.06em] text-white">{KIND_LABEL[String(post.kind)] ?? String(post.kind)}</span>
    </div>
  );
}

export function SocialPage() {
  const d = useDash();
  const admin = d.role === "admin";
  const tabs = TABS.filter((t) => !t.adminOnly || admin);
  const [tab, setTab] = useState("all");
  const [q, setQ] = useState("");
  const [qd, setQd] = useState("");
  const [posts, setPosts] = useState<Doc[] | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState("");
  const [reload, setReload] = useState(0);
  const [sync, setSync] = useState<SyncReport | null | undefined>(undefined);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => { const t = setTimeout(() => setQd(q.trim()), 300); return () => clearTimeout(t); }, [q]);

  const active = tabs.find((t) => t.key === tab) ?? tabs[0];
  const where = useMemo(() => allOf(d.scope("social-posts"), active.where, qd ? { caption: { like: qd } } : null), [d, active, qd]);
  const whereKey = JSON.stringify(where);

  // First page (and every change of tab, search or reload).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await apiFind("social-posts", { page: 1, limit: PAGE, sort: "-postedAt", where: JSON.parse(whereKey) });
        if (!alive) return;
        setPosts(res.docs); setTotal(res.totalDocs); setPage(1); setError("");
        d.ensureLabels("projects", res.docs.map((p) => idOf(p.project)));
      } catch (e) {
        if (alive) { setError(e instanceof Error ? e.message : "Could not load the posts."); setPosts([]); }
      }
    })();
    return () => { alive = false; };
  }, [whereKey, reload, d]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const scope = d.scope("social-posts");
        const list = await Promise.all(tabs.map((t) => apiCount("social-posts", allOf(scope, t.where))));
        if (alive) setCounts(Object.fromEntries(tabs.map((t, i) => [t.key, list[i]])));
      } catch { /* counts are optional */ }
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tabs only depends on the role
  }, [d, reload]);

  useEffect(() => {
    let alive = true;
    fetch("/api/social/sync", { credentials: "include" }).then((r) => r.json()).then((j) => alive && setSync((j.last as SyncReport) ?? null)).catch(() => alive && setSync(null));
    return () => { alive = false; };
  }, [reload]);

  const loadMore = async () => {
    const next = page + 1;
    try {
      const res = await apiFind("social-posts", { page: next, limit: PAGE, sort: "-postedAt", where });
      setPosts((cur) => [...(cur ?? []), ...res.docs]);
      setPage(next);
      d.ensureLabels("projects", res.docs.map((p) => idOf(p.project)));
    } catch (e) { d.toast(e instanceof Error ? e.message : "Could not load more.", "warn"); }
  };

  const runSync = async () => {
    setSyncing(true);
    try {
      const r = await fetch("/api/social/sync", { method: "POST", credentials: "include" });
      const j = (await r.json()) as SyncReport & { error?: string };
      if (!r.ok) throw new Error(j.error ?? "Sync failed.");
      setSync(j);
      d.toast(j.configured ? `Checked: ${j.fetched} found, ${j.created} new` : "Meta is not connected yet", j.configured ? "ok" : "warn");
      setReload((n) => n + 1);
    } catch (e) { d.toast(e instanceof Error ? e.message : "Sync failed.", "warn"); }
    setSyncing(false);
  };

  const when = (iso: unknown) => (iso ? new Date(String(iso)).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "");
  const loading = posts === null;

  return (
    <div>
      <PageHero
        title="Social content."
        description={admin ? "Every post, reel, video and story on Instagram and Facebook, linked to the listing it is about." : "Posts, reels and stories about your listings on the LankaNewHomes Instagram and Facebook."}
        stat={{ label: admin ? "Posts and reels" : "About your listings", value: loading ? "…" : String(counts.all ?? total) }}
        actions={<>
          <a href="https://www.instagram.com/lankanewhomes/" target="_blank" rel="noopener noreferrer" className={heroBtn}>Instagram <ExternalLink size={13} /></a>
          <a href="https://www.facebook.com/lankanewhomes/" target="_blank" rel="noopener noreferrer" className={heroBtn}>Facebook <ExternalLink size={13} /></a>
          {admin ? <Link href="/dashboard/social/create" className={heroBtn}><Plus size={14} /> Create a post</Link> : null}
          {admin ? <button type="button" onClick={runSync} disabled={syncing} className={heroBtn}>{syncing ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Sync now</button> : null}
        </>}
      />

      <div className="d-box">
        <div className="mb-5 border border-line bg-panel px-4 py-3 text-sm">
          {sync === undefined ? <span className="text-muted">Checking the last update…</span> : sync === null ? (
            <span className="text-muted">Updated every day at about 9:00 Sri Lanka time. No update has run yet.</span>
          ) : !sync.configured ? (
            <span>{admin ? <b>Not connected to Instagram and Facebook yet. </b> : null}{admin ? "Add META_PAGE_ID, META_PAGE_ACCESS_TOKEN and META_IG_USER_ID (a token that can read posts) and this page fills itself every day. Until then, add posts by link below." : "Every post about your listings on LankaNewHomes Instagram and Facebook shows here."}</span>
          ) : (
            <span>Last update {new Date(sync.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}: {sync.fetched} items found, {sync.created} new, {sync.matched} linked to a listing{admin ? `, ${sync.unmatched} not linked` : ""}. Updated every day at about 9:00 Sri Lanka time.{sync.errors.length ? <span className="text-bad"> {sync.errors[0]}</span> : null}</span>
          )}
        </div>

        <div className="mb-4 flex flex-wrap gap-2" role="tablist" aria-label="Content type">
          {tabs.map((t) => (
            <button key={t.key} type="button" role="tab" aria-selected={tab === t.key} onClick={() => setTab(t.key)} className={`inline-flex items-center gap-2 border px-4 py-2 text-sm transition ${tab === t.key ? "border-ink bg-ink font-medium text-white" : "border-line bg-panel hover:border-fg/40"}`}>
              {t.label}<span className={`text-xs tabular-nums ${tab === t.key ? "text-white/70" : "text-muted"}`}>{counts[t.key] ?? "…"}</span>
            </button>
          ))}
          <div className="relative ml-auto min-w-52">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search captions…" className="w-full border border-line bg-panel py-2 pl-9 pr-3 text-sm outline-none focus:border-ink" />
          </div>
        </div>

        {error ? (
          <div className="border border-line bg-panel px-4 py-12 text-center">
            <span className="mx-auto grid h-12 w-12 place-items-center bg-subtle text-bad"><AlertCircle size={22} /></span>
            <p className="mt-2 font-medium">Could not load the posts</p><p className="mt-1 text-sm text-muted">{error}</p>
            <button type="button" onClick={() => { setError(""); setPosts(null); setReload((n) => n + 1); }} className="mt-3 border border-line px-3 py-1.5 text-sm hover:bg-subtle">Try again</button>
          </div>
        ) : loading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <div key={i} className="d-skeleton aspect-[4/6]" />)}</div>
        ) : posts.length === 0 ? (
          <div className="border border-line bg-panel px-4 py-14 text-center">
            <p className="font-medium">{qd || tab !== "all" ? "Nothing matches" : "No social content yet"}</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-muted">{qd || tab !== "all" ? "Try another tab or a different search." : admin ? "Once Instagram and Facebook are connected, or when you add a post by link, it shows here." : "When a post, reel or story about one of your listings goes out, it shows here."}</p>
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
              {posts.map((p) => (
                <article key={String(p.id)} className={`flex flex-col border border-line bg-panel${p.removedAt ? " opacity-60" : ""}`}>
                  <a href={String(p.permalink || "#")} target="_blank" rel="noopener noreferrer" aria-label="Open the post"><Thumb post={p} /></a>
                  <div className="flex flex-1 flex-col gap-1.5 p-3">
                    <p className="d-label">{(() => { const brand = PLATFORM[String(p.platform)] ?? PLATFORM.facebook; return <><span className="inline-flex items-center gap-1.5 font-semibold" style={{ color: brand.color }}><span aria-hidden="true" className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: brand.color }} />{brand.name}</span> · {when(p.postedAt)}{p.removedAt ? <span className="ml-1.5 border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">Deleted on {brand.name}</span> : null}</>; })()}</p>
                    {p.project ? <Link href={`/dashboard/projects/${idOf(p.project)}`} className="text-sm font-semibold hover:underline">{d.labelOf("projects", idOf(p.project))}</Link> : p.land ? <a href={`/land/${String((p.details as { landSlug?: string } | null)?.landSlug ?? "")}`} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold hover:underline">Land: {String((p.details as { landSlug?: string } | null)?.landSlug ?? "listing")}</a> : (p.details as { listingType?: string } | null)?.listingType === "business" ? <p className="text-sm font-semibold">LankaNewHomes: {String((p.details as { topic?: string } | null)?.topic ?? "business post")}</p> : admin ? <Assign post={p} onDone={() => setReload((n) => n + 1)} /> : null}
                    {p.caption ? <p className="line-clamp-3 text-xs leading-relaxed text-muted">{String(p.caption)}</p> : null}
                    <div className="mt-auto flex items-center gap-3 pt-1.5 text-xs text-muted">
                      {typeof p.likes === "number" ? <span className="inline-flex items-center gap-1"><Heart size={12} /> {p.likes}</span> : null}
                      {typeof p.comments === "number" ? <span className="inline-flex items-center gap-1"><MessageCircle size={12} /> {p.comments}</span> : null}
                      <a href={String(p.permalink || "#")} target="_blank" rel="noopener noreferrer" className="ml-auto inline-flex items-center gap-1 underline hover:text-fg">Open <ExternalLink size={11} /></a>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            {posts.length < total ? <button type="button" onClick={loadMore} className="mx-auto mt-5 block border border-line bg-panel px-5 py-2 text-sm hover:bg-subtle">Show more ({total - posts.length} left)</button> : null}
          </>
        )}

        {admin ? <AddByLink onAdded={() => setReload((n) => n + 1)} /> : null}
      </div>
    </div>
  );
}

/** A project picker that searches the listings by name. */
function ProjectPicker({ value, onChange }: { value: string | number | null; onChange: (id: string | number | null, name?: string) => void }) {
  const d = useDash();
  const [opts, setOpts] = useState<ComboOption[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const search = useCallback(async (term: string) => {
    try {
      const page = await apiFind("projects", { limit: 20, sort: "name", where: term ? { name: { like: term } } : null, select: { name: true } });
      setOpts(page.docs.map((r) => ({ value: r.id, label: String(r.name) })));
    } catch { setOpts([]); }
  }, []);
  useEffect(() => {
    let alive = true;
    apiFind("projects", { limit: 20, sort: "name", select: { name: true } }).then((r) => alive && setOpts(r.docs.map((x) => ({ value: x.id, label: String(x.name) })))).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <Combobox
      options={opts} value={value === null ? [] : [value]} remote placeholder="Choose the listing…"
      onQuery={(t) => { if (timer.current) clearTimeout(timer.current); timer.current = setTimeout(() => search(t), 250); }}
      labelFor={(v) => d.labelOf("projects", v)}
      onChange={(next) => { const id = next[0] ?? null; onChange(id, opts.find((o) => o.value === id)?.label); if (id !== null) d.ensureLabels("projects", [id]); }}
    />
  );
}

function Assign({ post, onDone }: { post: Doc; onDone: () => void }) {
  const d = useDash();
  return (
    <div className="space-y-1">
      <p className="text-xs text-warn">Not linked to a listing</p>
      <ProjectPicker value={null} onChange={async (id) => {
        if (id === null) return;
        try { await apiUpdate("social-posts", post.id, { project: id }); d.toast("Linked to the listing"); onDone(); } catch (e) { d.toast(e instanceof Error ? e.message : "Could not link it.", "warn"); }
      }} />
    </div>
  );
}

/** Add a post that is already on Instagram or Facebook by pasting its link and choosing the listing it is about. */
function AddByLink({ onAdded }: { onAdded: () => void }) {
  const d = useDash();
  const [url, setUrl] = useState("");
  const [kind, setKind] = useState<string>("photo");
  const [project, setProject] = useState<string | number | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    let host = "";
    try { host = new URL(url.trim()).hostname; } catch { d.toast("That does not look like a link.", "warn"); return; }
    const platform = /instagram\.com/.test(host) ? "instagram" : /facebook\.com|fb\.watch|fb\.com/.test(host) ? "facebook" : /tiktok\.com/.test(host) ? "tiktok" : null;
    if (!platform) { d.toast("Only Instagram, Facebook and TikTok links can be added.", "warn"); return; }
    if (project === null) { d.toast("Choose the listing this post is about.", "warn"); return; }
    setBusy(true);
    try {
      const clean = url.trim().split("?")[0].replace(/\/$/, "");
      await apiCreate("social-posts", { platform, kind, status: "published", source: "manual", externalId: clean.split("/").pop(), permalink: url.trim(), project, caption: note.trim() || undefined, postedAt: new Date().toISOString() });
      d.toast("Added");
      setUrl(""); setNote(""); setProject(null);
      onAdded();
    } catch (err) { d.toast(err instanceof ApiError ? err.message : "Could not add it.", "warn"); }
    setBusy(false);
  };
  return (
    <form onSubmit={submit} className="mt-6 border border-line bg-panel p-4">
      <h2 className="font-semibold">Add a post by link</h2>
      <p className="mt-0.5 text-sm text-muted">Paste the link of a post, reel, video or story and choose its listing. It shows here, and for that listing&apos;s developer, straight away.</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-[2fr_1fr_2fr]">
        <input required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://www.instagram.com/reel/…" className="border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-ink" />
        <select value={kind} onChange={(e) => setKind(e.target.value)} className="border border-line bg-panel px-3 py-2 text-sm" aria-label="Type">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <ProjectPicker value={project} onChange={(id) => setProject(id)} />
      </div>
      <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Short note or caption (optional)" className="mt-3 w-full border border-line bg-bg px-3 py-2 text-sm outline-none focus:border-ink" />
      <button type="submit" disabled={busy} className="mt-3 inline-flex items-center gap-1.5 bg-ink px-4 py-2 text-sm font-medium text-white hover:opacity-90 disabled:opacity-60">{busy ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />} Add post</button>
    </form>
  );
}
