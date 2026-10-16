"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Building2, CheckCircle2, Mail, MapPin, MessageCircle, Pencil, Phone, PlusCircle, UserPlus } from "lucide-react";
import { apiFind, apiGet, type Doc } from "../_data/api";

// Overview tab of a developer: key numbers and a timeline of everything that happened with this company (owner, 2026-10-15): when
// they signed up, when they were verified, every email we sent, each listing added or edited, enquiries, finished tasks and the
// contact notes. Everything is read live from Payload; nothing is stored here.

type Event = { at: string; icon: typeof Mail; tone: string; title: string; detail?: string; href?: string };
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
const day = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const HOUR = 3600_000;

export function DeveloperOverview() {
  const { id } = useParams<{ id: string }>();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [stats, setStats] = useState<{ projects: number; lands: number; leads: number; emails: number; verified: boolean } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || id === "new") return;
    let alive = true;
    (async () => {
      try {
        const dev = await apiGet("developers", id);
        const ev: Event[] = [];
        const add = (e: Event | null) => { if (e && e.at && !Number.isNaN(Date.parse(e.at))) ev.push(e); };
        add({ at: String(dev.createdAt), icon: PlusCircle, tone: "text-fg", title: "Company profile created", detail: String(dev.name) });
        if (dev.user) {
          const u = await apiGet("users", typeof dev.user === "object" ? (dev.user as Doc).id as number : (dev.user as number)).catch(() => null);
          if (u?.createdAt) add({ at: String(u.createdAt), icon: UserPlus, tone: "text-fg", title: "Account signed up", detail: String(u.email ?? "") });
        }
        if (dev.verified_at) add({ at: String(dev.verified_at), icon: BadgeCheck, tone: "text-ok", title: "Verified Developer", detail: dev.verified_email ? `Confirmed with ${String(dev.verified_email)}` : "Approved by LankaNewHomes" });
        for (const c of (dev.contactLog as Doc[] | undefined) ?? []) add({ at: String(c.date), icon: Phone, tone: "text-fg", title: `Contact: ${String(c.channel ?? "note")}`, detail: String(c.summary ?? ""), href: c.link ? String(c.link) : undefined });

        const [emails, projects, lands, todos] = await Promise.all([
          apiFind("email-log", { limit: 200, sort: "-sentAt", where: { developer: { equals: Number(id) } } }).catch(() => ({ docs: [] as Doc[], totalDocs: 0 })),
          apiFind("projects", { limit: 100, sort: "-updatedAt", where: { developer: { equals: Number(id) } }, select: { name: true, isPublished: true, createdAt: true, updatedAt: true } }).catch(() => ({ docs: [] as Doc[], totalDocs: 0 })),
          apiFind("lands", { limit: 100, sort: "-updatedAt", where: { sellerName: { equals: String(dev.name) } }, select: { title: true, createdAt: true, updatedAt: true } }).catch(() => ({ docs: [] as Doc[], totalDocs: 0 })),
          apiFind("listing-todos", { limit: 200, where: { and: [{ done: { equals: true } }] }, select: { title: true, doneAt: true, project: true, listingName: true } }).catch(() => ({ docs: [] as Doc[], totalDocs: 0 })),
        ]);
        for (const e of emails.docs) add({ at: String(e.sentAt), icon: Mail, tone: "text-fg", title: `Email sent: ${String(e.subject)}`, detail: `${String(e.kind ?? "Email")} · to ${String(e.toEmail ?? "")}` });
        const projectIds = projects.docs.map((p) => p.id);
        for (const p of projects.docs) {
          const created = Date.parse(String(p.createdAt)); const updated = Date.parse(String(p.updatedAt));
          add({ at: String(p.createdAt), icon: Building2, tone: "text-fg", title: `Listing added: ${String(p.name)}`, detail: p.isPublished ? "Published" : "Draft", href: `/dashboard/projects/${p.id}` });
          if (updated - created > HOUR) add({ at: String(p.updatedAt), icon: Pencil, tone: "text-muted", title: `Listing edited: ${String(p.name)}`, href: `/dashboard/projects/${p.id}` });
        }
        for (const l of lands.docs) {
          const created = Date.parse(String(l.createdAt)); const updated = Date.parse(String(l.updatedAt));
          add({ at: String(l.createdAt), icon: MapPin, tone: "text-fg", title: `Land added: ${String(l.title)}`, href: `/dashboard/lands/${l.id}` });
          if (updated - created > HOUR) add({ at: String(l.updatedAt), icon: Pencil, tone: "text-muted", title: `Land edited: ${String(l.title)}`, href: `/dashboard/lands/${l.id}` });
        }
        let leadCount = 0;
        if (projectIds.length) {
          const leads = await apiFind("leads", { limit: 100, sort: "-createdAt", where: { project: { in: projectIds } }, select: { name: true, project: true, createdAt: true, source: true } }).catch(() => ({ docs: [] as Doc[], totalDocs: 0 }));
          leadCount = leads.totalDocs;
          const nameOf = new Map(projects.docs.map((p) => [p.id, String(p.name)]));
          for (const l of leads.docs) add({ at: String(l.createdAt), icon: MessageCircle, tone: "text-brand", title: `Enquiry from ${String(l.name ?? "a buyer")}`, detail: nameOf.get(typeof l.project === "object" ? ((l.project as Doc).id as number) : (l.project as number)), href: `/dashboard/leads/${l.id}` });
        }
        const mine = new Set(projectIds);
        for (const t of todos.docs) {
          const pid = typeof t.project === "object" && t.project ? ((t.project as Doc).id as number) : (t.project as number | undefined);
          if (pid && mine.has(pid) && t.doneAt) add({ at: String(t.doneAt), icon: CheckCircle2, tone: "text-ok", title: `Task done: ${String(t.title)}`, detail: String(t.listingName ?? "") });
        }
        ev.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
        if (!alive) return;
        setEvents(ev);
        setStats({ projects: projects.totalDocs, lands: lands.totalDocs, leads: leadCount, emails: emails.totalDocs, verified: Boolean(dev.domain_verified) });
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the timeline.");
      }
    })();
    return () => { alive = false; };
  }, [id]);

  const groups = useMemo(() => {
    const m = new Map<string, Event[]>();
    for (const e of events ?? []) { const k = day(e.at); m.set(k, [...(m.get(k) ?? []), e]); }
    return [...m.entries()];
  }, [events]);

  if (!id || id === "new") return <p className="text-sm text-muted">Save the developer first, then their timeline appears here.</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (!events || !stats) return <div className="d-skeleton h-48 w-full" />;
  const tile = (label: string, value: string) => <div className="border border-line bg-panel p-3"><p className="text-xs text-muted">{label}</p><p className="mt-1 text-xl font-semibold tabular-nums">{value}</p></div>;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {tile("Projects", String(stats.projects))}{tile("Lands", String(stats.lands))}{tile("Enquiries", String(stats.leads))}{tile("Emails sent", String(stats.emails))}{tile("Verified Developer", stats.verified ? "Yes" : "Not yet")}
      </div>
      <section className="border border-line bg-panel">
        <h2 className="border-b border-line px-4 py-3 font-semibold">Timeline</h2>
        {groups.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted">Nothing has happened yet.</p> : null}
        {groups.map(([date, list]) => (
          <div key={date} className="border-b border-line last:border-0">
            <p className="bg-subtle px-4 py-1.5 text-xs font-semibold uppercase tracking-wide text-muted">{date}</p>
            <ul>
              {list.map((e, i) => {
                const Icon = e.icon;
                const body = <><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center border border-line bg-bg ${e.tone}`}><Icon size={14} /></span><span className="min-w-0 flex-1"><b className="block text-sm font-medium">{e.title}</b>{e.detail ? <i className="block truncate text-xs not-italic text-muted">{e.detail}</i> : null}</span><span className="shrink-0 whitespace-nowrap text-xs text-muted">{when(e.at).split(", ").pop()}</span></>;
                return <li key={`${e.at}-${i}`} className="border-t border-line first:border-0">{e.href ? <Link href={e.href} className="flex items-start gap-3 px-4 py-2.5 hover:bg-subtle/60">{body}</Link> : <div className="flex items-start gap-3 px-4 py-2.5">{body}</div>}</li>;
              })}
            </ul>
          </div>
        ))}
      </section>
    </div>
  );
}
