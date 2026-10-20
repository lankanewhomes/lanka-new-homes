"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { BadgeCheck, CheckCircle2, Eye, FileDown, Heart, Mail, MessageCircle, MessageSquare, Pencil, Phone, PlusCircle, Rocket, Send, Sparkles, UserPlus } from "lucide-react";
import { useDash } from "./DashProvider";
import { allOf } from "../_data/scope";
import { apiFind, type Doc } from "../_data/api";
import { ANALYTICS_START } from "@/lib/analytics-start";

// "Today": what happened since midnight in Toronto time (owner, 2026-10-16: "also add if something happened today"). Real visitors only (bots and
// repeat clicks are removed, like the rest of Analytics). Refreshes every minute.

const TZ = "America/Toronto";
const TYPES: { key: string; label: string; icon: typeof Eye; verb: string }[] = [
  { key: "view", label: "Page views", icon: Eye, verb: "viewed" },
  { key: "lead_submitted", label: "Enquiries", icon: MessageCircle, verb: "sent an enquiry about" },
  { key: "whatsapp_click", label: "WhatsApp clicks", icon: MessageSquare, verb: "tapped WhatsApp on" },
  { key: "phone_click", label: "Phone clicks", icon: Phone, verb: "tapped the phone number on" },
  { key: "email_click", label: "Email clicks", icon: Mail, verb: "tapped the email on" },
  { key: "brochure_download", label: "Brochures", icon: FileDown, verb: "downloaded the brochure of" },
  { key: "save", label: "Saves", icon: Heart, verb: "saved" },
];
const VERB = Object.fromEntries(TYPES.map((t) => [t.key, t.verb]));
type Happening = { at: string; icon: typeof Mail; title: string; detail?: string; href?: string };
const idOf = (v: unknown) => (v && typeof v === "object" ? (v as { id?: unknown }).id : v);

/** Midnight at the start of today in Toronto, as an ISO instant. */
function startOfTodayToronto(): string {
  const parts = (ms: number) => {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: TZ, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(ms));
    const g = (t: string) => Number(f.find((x) => x.type === t)?.value);
    return { y: g("year"), m: g("month"), d: g("day"), h: g("hour"), min: g("minute") };
  };
  const now = parts(Date.now());
  const asUtc = Date.UTC(now.y, now.m - 1, now.d, 0, 0);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) { const p = parts(guess); guess += asUtc - Date.UTC(p.y, p.m - 1, p.d, p.h, p.min); }
  return new Date(guess).toISOString();
}
const timeOf = (iso: string) => new Date(iso).toLocaleTimeString("en-CA", { timeZone: TZ, hour: "numeric", minute: "2-digit" });

export function TodayPanel() {
  const d = useDash();
  const [events, setEvents] = useState<Doc[] | null>(null);
  const [tick, setTick] = useState(0);
  const [error, setError] = useState("");
  const [happenings, setHappenings] = useState<Happening[] | null>(null);

  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60_000); return () => clearInterval(t); }, []);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const start = new Date(Math.max(Date.parse(startOfTodayToronto()), Date.parse(ANALYTICS_START))).toISOString();
        const res = await apiFind("analytics", { limit: 500, sort: "-timestamp", where: allOf(d.scope("analytics"), { timestamp: { greater_than_equal: start }, is_bot: { equals: false }, is_duplicate: { equals: false } }), select: { event_type: true, project: true, timestamp: true, city: true } });
        if (!alive) return;
        d.ensureLabels("projects", res.docs.map((e) => idOf(e.project)));
        setEvents(res.docs); setError("");
        const since = { greater_than_equal: start };
        const safe = <T,>(p: Promise<T>, fallback: T) => p.catch(() => fallback);
        const none = { docs: [] as Doc[], totalDocs: 0 };
        const isAdmin = d.role === "admin";
        const [act, mails, todos, posts, devs] = await Promise.all([
          isAdmin ? safe(apiFind("developer-activity", { limit: 100, sort: "-at", where: allOf(d.scope("developer-activity"), { at: since }) }), none) : Promise.resolve(none),
          isAdmin ? safe(apiFind("email-log", { limit: 50, sort: "-sentAt", where: allOf(d.scope("email-log"), { sentAt: since }) }), none) : Promise.resolve(none),
          isAdmin ? safe(apiFind("listing-todos", { limit: 50, sort: "-doneAt", where: allOf(d.scope("listing-todos"), { doneAt: since }), select: { title: true, doneAt: true, listingName: true } }), none) : Promise.resolve(none),
          safe(apiFind("social-posts", { limit: 20, sort: "-postedAt", where: allOf(d.scope("social-posts"), { postedAt: since, status: { in: ["published", "processing"] } }) }), none),
          isAdmin ? safe(apiFind("developers", { limit: 20, sort: "-createdAt", where: { createdAt: since }, select: { name: true, createdAt: true } }), none) : Promise.resolve(none),
        ]);
        if (!alive) return;
        const list: Happening[] = [];
        for (const a of act.docs) {
          const kind = String(a.kind ?? ""); const title = String(a.title ?? "");
          const icon = kind === "verification" ? BadgeCheck : /published/i.test(title) ? Rocket : /created|added/i.test(title) ? PlusCircle : Pencil;
          const href = a.projectId ? `/dashboard/projects/${String(a.projectId)}` : a.landId ? `/dashboard/lands/${String(a.landId)}` : a.developer ? `/dashboard/developers/${String(idOf(a.developer))}` : undefined;
          if (a.at) list.push({ at: String(a.at), icon, title: `${a.developerName ? `${String(a.developerName)}: ` : ""}${title}`, detail: a.detail ? String(a.detail) : undefined, href });
        }
        for (const m of mails.docs) if (m.sentAt) list.push({ at: String(m.sentAt), icon: Send, title: `Email sent to ${String(m.developerName ?? m.toEmail ?? "")}`, detail: String(m.subject ?? ""), href: m.developer ? `/dashboard/developers/${String(idOf(m.developer))}` : undefined });
        for (const t of todos.docs) if (t.doneAt) list.push({ at: String(t.doneAt), icon: CheckCircle2, title: `To-do done: ${String(t.title ?? "")}`, detail: t.listingName ? String(t.listingName) : undefined, href: "/dashboard/listing-todos" });
        for (const p of posts.docs) if (p.postedAt) list.push({ at: String(p.postedAt), icon: Send, title: `${String(p.platform) === "instagram" ? "Instagram" : "Facebook"} post ${String(p.status) === "processing" ? "processing" : "published"}`, detail: p.permalink ? String(p.permalink) : undefined, href: "/dashboard/social" });
        for (const v of devs.docs) if (v.createdAt) list.push({ at: String(v.createdAt), icon: UserPlus, title: `New developer: ${String(v.name ?? "")}`, href: `/dashboard/developers/${String(v.id)}` });
        list.sort((x, y) => Date.parse(y.at) - Date.parse(x.at));
        setHappenings(list);
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Could not load today's activity."); }
    })();
    return () => { alive = false; };
  }, [d, tick]);

  const count = (k: string) => (events ?? []).filter((e) => e.event_type === k).length;
  const notable = (events ?? []).filter((e) => e.event_type !== "view").slice(0, 12);
  const quiet = events !== null && events.length === 0;

  const box = "border border-[#e6d3a3] bg-white";
  return (
    <section className="border border-[#e6d3a3] bg-[#fbf1dc] p-4 sm:p-6" aria-label="Today">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Sparkles size={18} className="text-brand" /><h2 className="text-lg font-semibold">Today</h2>
        <span className="text-sm text-muted">since midnight, Toronto time · updates every minute</span>
        <Link href="/dashboard/analytics" className="ml-auto text-sm font-medium underline">Full analytics</Link>
      </div>
      {error ? <p className="mt-4 text-sm text-bad">{error}</p> : (
        <>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {TYPES.map((t) => (
              <div key={t.key} className={`${box} p-4`}>
                <div className="flex items-center justify-between gap-2 text-muted"><span className="text-sm">{t.label}</span><t.icon size={16} /></div>
                <p className={`mt-3 text-3xl font-semibold tabular-nums ${count(t.key) > 0 && t.key !== "view" ? "text-brand" : ""}`}>{events ? count(t.key) : "…"}</p>
              </div>
            ))}
          </div>
          <div className={`mt-4 grid gap-4 ${d.role === "admin" ? "lg:grid-cols-2" : ""}`}>
            <div className={box}>
              <h3 className="border-b border-[#e6d3a3] px-4 py-3 font-semibold">What happened</h3>
              {events === null ? <div className="d-skeleton m-4 h-24" /> : quiet ? <p className="px-4 py-6 text-sm text-muted">Nothing yet today.</p> : notable.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Only page views so far today ({count("view")}). No clicks or enquiries yet.</p> : (
                <ul className="divide-y divide-line">
                  {notable.map((e, i) => (
                    <li key={`${String(e.id ?? i)}`} className="flex items-baseline gap-3 px-4 py-2.5 text-sm">
                      <span className="w-16 shrink-0 tabular-nums text-muted">{e.timestamp ? timeOf(String(e.timestamp)) : ""}</span>
                      <span className="min-w-0 flex-1">A visitor {VERB[String(e.event_type)] ?? "did something on"} <Link href={`/dashboard/projects/${String(idOf(e.project))}`} className="font-medium hover:underline">{d.labelOf("projects", idOf(e.project))}</Link>{e.city ? <span className="text-muted"> ({String(e.city)})</span> : null}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {d.role === "admin" ? <div className={box}>
              <h3 className="border-b border-[#e6d3a3] px-4 py-3 font-semibold">On the platform</h3>
              {happenings === null ? <div className="d-skeleton m-4 h-16" /> : happenings.length === 0 ? <p className="px-4 py-6 text-sm text-muted">No listings, emails, verifications or tasks yet today.</p> : (
                <ul className="divide-y divide-line">
                  {happenings.slice(0, 15).map((h, i) => {
                    const Icon = h.icon;
                    const body = <><span className="w-16 shrink-0 tabular-nums text-muted">{timeOf(h.at)}</span><Icon size={14} className="mt-0.5 shrink-0 text-muted" /><span className="min-w-0 flex-1"><b className="font-medium">{h.title}</b>{h.detail ? <span className="block truncate text-xs text-muted">{h.detail}</span> : null}</span></>;
                    return <li key={`${h.at}-${i}`}>{h.href ? <Link href={h.href} className="flex items-start gap-3 px-4 py-2.5 text-sm hover:bg-subtle/60">{body}</Link> : <div className="flex items-start gap-3 px-4 py-2.5 text-sm">{body}</div>}</li>;
                  })}
                </ul>
              )}
            </div> : null}
          </div>
        </>
      )}
    </section>
  );
}
