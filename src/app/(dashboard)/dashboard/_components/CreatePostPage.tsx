"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Copy, Download, Loader2, Printer, Send } from "lucide-react";
import { useDash } from "./DashProvider";
import { Combobox, type ComboOption } from "./Combobox";
import { PageHero } from "./PageHero";
import { apiFind, apiGet, type Doc } from "../_data/api";

// Create a social post for a listing (owner, 2026-10-16: "automate the social posts"). Pick a listing, tick up to 5 photos, and get the five
// 1080x1350 Instagram slides, two 1200x630 Facebook images, both captions built from the listing's own fields, and the UTM tracking links.
// Photos are plain (no text on them), per the owner's rule. Nothing is posted from here: download, copy, post, or print the caption sheet.

const SITE = "https://www.lankanewhomes.com";
const track = (slug: string, source: "instagram" | "facebook") => `${SITE}/projects/${slug}?utm_source=${source}&utm_medium=social&utm_campaign=${slug}-social-${new Date().toISOString().slice(0, 7)}`;
const proxied = (url: string) => `/api/social/image?u=${encodeURIComponent(url)}`;
const camel = (s: string) => s.replace(/[^A-Za-z0-9 ]+/g, " ").split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join("");

async function crop(url: string, w: number, h: number): Promise<string> {
  const img = await new Promise<HTMLImageElement>((resolve, reject) => { const el = new Image(); el.onload = () => resolve(el); el.onerror = () => reject(new Error("Could not load a photo")); el.src = proxied(url); });
  const canvas = document.createElement("canvas"); canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext("2d"); if (!ctx) throw new Error("No canvas");
  const r = Math.max(w / img.width, h / img.height);
  const sw = w / r, sh = h / r;
  ctx.drawImage(img, (img.width - sw) / 2, (img.height - sh) / 2, sw, sh, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
}

type Built = { name: string; slug: string; photos: { url: string; label: string }[]; ig: string; fb: string; igLink: string; fbLink: string };
type Slide = { file: string; data: string };

function buildCaptions(p: Doc, developerName: string): Pick<Built, "ig" | "fb" | "igLink" | "fbLink"> {
  const name = String(p.name ?? ""); const slug = String(p.slug ?? "");
  const city = String(p.city ?? "").trim();
  const summary = String(p.summary ?? "").trim();
  const price = String(p.priceRange ?? "").trim();
  const status = String(p.status ?? "").trim();
  const igLink = track(slug, "instagram"); const fbLink = track(slug, "facebook");
  const priceLine = price ? `${price}.\n\n` : "";
  const tags = ["#" + camel(name), city ? "#" + camel(city) : "", "#SriLankaRealEstate", "#NewHomesSriLanka", developerName ? "#" + camel(developerName.replace(/\(.*?\)|Pvt|Ltd/gi, "")) : "", "#LankaNewHomes"].filter((t) => t.length > 1).join(" ");
  const ig = `${name}${city ? ` in ${city}` : ""}.      📍\n${summary}\n\n${priceLine}See the floor plans, photos and details on LankaNewHomes. Link in bio.       👆\nWhich photo is your favourite? Tell us below         👇\n${tags}`;
  const fb = `${summary}${status ? ` Status: ${status}.` : ""}\n\n${priceLine}Floor plans, photos and details here:\n${fbLink}\n\nWhich photo is your favourite?            👇`;
  return { ig, fb, igLink, fbLink };
}

export function CreatePostPage() {
  const d = useDash();
  const [opts, setOpts] = useState<ComboOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [picked, setPicked] = useState<number | null>(null);
  const [built, setBuilt] = useState<Built | null>(null);
  const [chosen, setChosen] = useState<string[]>([]);
  const [ig, setIg] = useState(""); const [fb, setFb] = useState("");
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState("");
  const [onIg, setOnIg] = useState(true); const [onFb, setOnFb] = useState(true);
  const [posting, setPosting] = useState(false); const [confirmPost, setConfirmPost] = useState(false);
  const [postResult, setPostResult] = useState<{ configured: boolean; results: { platform: string; status: string; permalink?: string | null; error?: string }[] } | null>(null);
  const token = useRef(0);

  const search = async (q: string) => {
    setSearching(true);
    try {
      const res = await apiFind("projects", { limit: 20, sort: "name", where: q ? { name: { like: q } } : undefined, select: { name: true, slug: true, city: true } });
      setOpts(res.docs.map((x) => ({ value: x.id as number, label: String(x.name), hint: String(x.city ?? "") })));
    } catch { /* the list is optional */ }
    setSearching(false);
  };

  const choose = async (id: number) => {
    setPicked(id); setSlides(null); setBuilt(null);
    try {
      const p = await apiGet("projects", id);
      const dev = p.developer ? await apiGet("developers", typeof p.developer === "object" ? ((p.developer as Doc).id as number) : (p.developer as number)).catch(() => null) : null;
      const gallery = ((p.gallery as Doc[] | undefined) ?? []).map((g) => ({ url: String(g.image ?? ""), label: String(g.label ?? "") })).filter((g) => g.url.startsWith("https://media.lankanewhomes.com/"));
      const hero = typeof p.heroImage === "string" && p.heroImage.startsWith("https://media.lankanewhomes.com/") ? [{ url: p.heroImage, label: "Hero" }] : [];
      const seen = new Set<string>(); const photos = [...hero, ...gallery].filter((x) => (seen.has(x.url) ? false : (seen.add(x.url), true)));
      const caps = buildCaptions(p, dev ? String(dev.name ?? "") : "");
      setBuilt({ name: String(p.name), slug: String(p.slug), photos, ...caps }); setIg(caps.ig); setFb(caps.fb);
      setChosen(photos.slice(0, 5).map((x) => x.url));
    } catch (e) { d.toast(e instanceof Error ? e.message : "Could not load the listing.", "warn"); }
  };

  const toggle = (url: string) => setChosen((cur) => (cur.includes(url) ? cur.filter((u) => u !== url) : cur.length >= 5 ? cur : [...cur, url]));

  const make = async () => {
    if (!built || chosen.length === 0) return;
    const mine = ++token.current; setWorking(true);
    try {
      const out: Slide[] = [];
      for (let i = 0; i < chosen.length; i++) out.push({ file: i === 0 ? "instagram-1-cover.jpg" : `instagram-${i + 1}.jpg`, data: await crop(chosen[i], 1080, 1350) });
      out.push({ file: "facebook-1.jpg", data: await crop(chosen[0], 1200, 630) });
      if (chosen[2] ?? chosen[1]) out.push({ file: "facebook-2.jpg", data: await crop(chosen[2] ?? chosen[1], 1200, 630) });
      if (mine === token.current) setSlides(out);
    } catch (e) { d.toast(e instanceof Error ? e.message : "Could not make the images.", "warn"); }
    if (mine === token.current) setWorking(false);
  };

  const downloadAll = () => (slides ?? []).forEach((s, i) => setTimeout(() => { const a = document.createElement("a"); a.href = s.data; a.download = `${built?.slug}_${s.file}`; a.click(); }, i * 250));
  const copy = async (key: string, text: string) => { try { await navigator.clipboard.writeText(text); setCopied(key); setTimeout(() => setCopied(""), 1500); } catch { d.toast("Could not copy", "warn"); } };

  const postNow = async () => {
    if (!built || !slides || !picked) return;
    setPosting(true); setConfirmPost(false); setPostResult(null);
    try {
      const igImgs = slides.filter((x) => x.file.startsWith("instagram")).map((x) => x.data);
      const fbImgs = igImgs; // Facebook takes the same 4:5 slides as a multi-photo post
      const res = await fetch("/payload-api/social-post-custom", { method: "POST", credentials: "include", headers: { "content-type": "application/json" }, body: JSON.stringify({ projectId: picked, slug: built.slug, instagram: onIg ? { caption: ig, images: igImgs } : undefined, facebook: onFb ? { caption: fb, images: fbImgs } : undefined }) });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Could not post.");
      setPostResult(json);
    } catch (e) { d.toast(e instanceof Error ? e.message : "Could not post.", "warn"); }
    setPosting(false);
  };

  const printSheet = () => {
    if (!built || !slides) return;
    const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\n/g, "<br>");
    const ig5 = slides.filter((s) => s.file.startsWith("instagram")).map((s) => `<img src="${s.data}" style="width:128px;height:160px;object-fit:cover;margin-right:6px">`).join("");
    const fb2 = slides.filter((s) => s.file.startsWith("facebook")).map((s) => `<img src="${s.data}" style="width:330px;margin-right:8px">`).join("");
    const w = window.open("", "_blank"); if (!w) { d.toast("Allow pop-ups to print the sheet", "warn"); return; }
    w.document.write(`<html><head><meta charset="utf-8"><title>${esc(built.name)} - social posts</title><style>@page{size:A4;margin:0}body{font-family:Helvetica,Arial,sans-serif;color:#1c1c20;margin:0;font-size:12px;line-height:1.55}.top{background:#1c1c20;border-top:5px solid #f47b36;color:#fff;padding:22px 36px}.top small{color:#b9b8b2;letter-spacing:.08em;font-size:10px}.top h1{margin:4px 0 0;font-size:24px;font-weight:400}.wrap{padding:22px 36px}h2{font-size:13px;margin:22px 0 8px;padding-bottom:5px;border-bottom:2px solid #1c1c20}.link{border:1px solid #e4e2db;background:#faf7f2;padding:9px 12px;margin:0 0 8px}.link b{display:block;font-size:10px;letter-spacing:.06em;color:#6b6a66;margin-bottom:3px}.link span{font-family:Menlo,Consolas,monospace;font-size:9.5px;word-break:break-all}.cap{border:1px solid #e4e2db;padding:14px 16px;font-size:12.5px;line-height:1.6;border-left:4px solid #f47b36}.note{color:#6b6a66;font-size:11px;margin-top:6px}.pb{page-break-before:always}</style></head><body><div class="top"><small>LANKANEWHOMES · SOCIAL POSTS</small><h1>${esc(built.name)}</h1></div><div class="wrap"><h2>Tracking links (paste these, not the plain link)</h2><div class="link"><b>INSTAGRAM: bio or story</b><span>${esc(built.igLink)}</span></div><div class="link"><b>FACEBOOK: post</b><span>${esc(built.fbLink)}</span></div><div class="note">Visits, saves, enquiries and clicks from these links are counted as organic social in the analytics.</div><h2>Instagram carousel (1080 x 1350, first slide is the cover)</h2><div>${ig5}</div><h2>Instagram caption</h2><div class="cap">${esc(ig)}</div></div><div class="pb"></div><div class="top"><small>LANKANEWHOMES · SOCIAL POSTS</small><h1>${esc(built.name)}: Facebook</h1></div><div class="wrap"><h2>Facebook images (1200 x 630)</h2><div>${fb2}</div><h2>Facebook caption</h2><div class="cap">${esc(fb)}</div><div class="note">Facts and prices are the developer's published figures. No text is drawn on the photos.</div></div></body></html>`);
    w.document.close(); setTimeout(() => w.print(), 400);
  };

  return (
    <div>
      <Link href="/dashboard/social" className="mb-3 inline-flex items-center gap-1 text-sm text-muted hover:text-fg"><ArrowLeft size={14} /> Back to social content</Link>
      <PageHero title="Create a post." description="Pick a listing, choose up to 5 photos, and get the Instagram slides, Facebook images, captions and tracking links. Nothing is posted from here." />
      <div className="d-box space-y-5">
        <section className="border border-line bg-panel p-4">
          <h2 className="mb-2 font-semibold">1. Listing</h2>
          <div className="max-w-md">
            <Combobox options={opts} value={picked ? [picked] : []} onChange={(v) => v[0] && choose(Number(v[0]))} placeholder="Search a listing…" remote loading={searching} onQuery={search} labelFor={() => built?.name ?? "Listing"} />
          </div>
        </section>

        {built ? (
          <>
            <section className="border border-line bg-panel p-4">
              <h2 className="mb-1 font-semibold">2. Photos <span className="text-sm font-normal text-muted">({chosen.length} of 5 chosen, the first is the cover)</span></h2>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-8">
                {built.photos.slice(0, 40).map((ph) => { const n = chosen.indexOf(ph.url); return (
                  <button type="button" key={ph.url} onClick={() => toggle(ph.url)} title={ph.label} className={`relative aspect-[4/5] overflow-hidden border-2 ${n >= 0 ? "border-fg" : "border-transparent"}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- proxied listing photo */}
                    <img src={proxied(ph.url)} alt={ph.label} loading="lazy" className="h-full w-full object-cover" />
                    {n >= 0 ? <span className="absolute left-1 top-1 grid h-5 w-5 place-items-center bg-fg text-xs text-bg">{n + 1}</span> : null}
                  </button>); })}
              </div>
              <button type="button" onClick={make} disabled={working || chosen.length === 0} className="mt-3 inline-flex items-center gap-2 bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{working ? <Loader2 size={14} className="animate-spin" /> : null} Make the images</button>
            </section>

            <section className="border border-line bg-panel p-4">
              <h2 className="mb-2 font-semibold">3. Tracking links</h2>
              {([["Instagram: bio or story", "ig", built.igLink], ["Facebook: post", "fb", built.fbLink]] as const).map(([label, key, link]) => (
                <div key={key} className="mb-2 flex items-center gap-2 border border-line bg-subtle px-3 py-2"><div className="min-w-0 flex-1"><p className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</p><p className="break-all font-mono text-xs">{link}</p></div><button type="button" onClick={() => copy(key, link)} className="inline-flex shrink-0 items-center gap-1 border border-line px-2.5 py-1.5 text-xs hover:bg-bg">{copied === key ? <Check size={13} /> : <Copy size={13} />} Copy</button></div>
              ))}
            </section>

            <section className="grid gap-4 md:grid-cols-2">
              {([["Instagram caption", ig, setIg, "igc"], ["Facebook caption", fb, setFb, "fbc"]] as const).map(([label, val, set, key]) => (
                <div key={key} className="border border-line bg-panel p-4">
                  <div className="mb-2 flex items-center justify-between"><h2 className="font-semibold">{label}</h2><button type="button" onClick={() => copy(key, val)} className="inline-flex items-center gap-1 border border-line px-2.5 py-1.5 text-xs hover:bg-subtle">{copied === key ? <Check size={13} /> : <Copy size={13} />} Copy</button></div>
                  <textarea value={val} onChange={(e) => set(e.target.value)} rows={12} className="w-full border border-line bg-bg p-2 text-sm outline-none focus:border-ink" />
                </div>
              ))}
            </section>

            {slides ? (
              <section className="border border-line bg-panel p-4">
                <div className="mb-3 flex flex-wrap items-center gap-2"><h2 className="font-semibold">4. Your images</h2>
                  <button type="button" onClick={downloadAll} className="ml-auto inline-flex items-center gap-1.5 bg-accent px-3 py-1.5 text-sm font-medium text-white"><Download size={14} /> Download all</button>
                  <button type="button" onClick={printSheet} className="inline-flex items-center gap-1.5 border border-line px-3 py-1.5 text-sm hover:bg-subtle"><Printer size={14} /> Print caption sheet (save as PDF)</button></div>
                <div className="mb-4 border border-line bg-subtle p-3 text-sm">
                  <p className="mb-2 font-semibold">5. Post it</p>
                  <div className="flex flex-wrap items-center gap-4">
                    <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={onIg} onChange={(e) => setOnIg(e.target.checked)} /> Instagram (5-slide carousel)</label>
                    <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={onFb} onChange={(e) => setOnFb(e.target.checked)} /> Facebook Page (multi-photo post)</label>
                    <button type="button" onClick={() => setConfirmPost(true)} disabled={posting || (!onIg && !onFb)} className="ml-auto inline-flex items-center gap-1.5 bg-accent px-4 py-2 text-sm font-medium text-white disabled:opacity-50">{posting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />} Post now</button>
                  </div>
                  {confirmPost ? <p className="mt-3 border border-warn bg-panel p-3">Post these {slides.filter((x) => x.file.startsWith("instagram")).length} images and the captions above to {[onIg ? "Instagram" : "", onFb ? "Facebook" : ""].filter(Boolean).join(" and ")} now? <button type="button" onClick={postNow} className="ml-2 bg-fg px-3 py-1 text-bg">Yes, post</button> <button type="button" onClick={() => setConfirmPost(false)} className="ml-1 border border-line px-3 py-1">Cancel</button></p> : null}
                  {postResult ? (
                    <div className="mt-3 space-y-1">
                      {!postResult.configured ? <p className="text-muted"><b>Instagram and Facebook are not connected yet,</b> so nothing was sent. The images were stored and what would be posted is logged in Social posts. Once META_PAGE_ID, META_PAGE_ACCESS_TOKEN and META_IG_USER_ID are set, this button posts for real.</p> : null}
                      {postResult.results.map((r) => <p key={r.platform}><b className="capitalize">{r.platform}:</b> {r.status === "published" ? <>posted {r.permalink ? <a href={r.permalink} target="_blank" rel="noopener noreferrer" className="underline">view</a> : null}</> : r.status === "processing" ? "Instagram is still processing it; check again in a minute from the listing's Social tab" : r.status === "dry_run" ? "dry run (not sent)" : `failed: ${r.error}`}</p>)}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-3">{slides.map((s) => (
                  <a key={s.file} href={s.data} download={`${built.slug}_${s.file}`} className="block" title={`Download ${s.file}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element -- generated data URL */}
                    <img src={s.data} alt={s.file} className={s.file.startsWith("facebook") ? "h-28 w-auto border border-line" : "h-40 w-auto border border-line"} />
                    <span className="mt-1 block text-center text-[11px] text-muted">{s.file}</span>
                  </a>))}</div>
              </section>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  );
}
