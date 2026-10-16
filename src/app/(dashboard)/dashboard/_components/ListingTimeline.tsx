"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { CheckCircle2, Mail, MessageCircle, Pencil, PlusCircle, Rocket } from "lucide-react";
import { apiFind, apiGet, type Doc } from "../_data/api";

// Activity tab of a project or land (owner, 2026-10-15): when it was created, published and edited (and by whom), the enquiries it got,
// the emails about it and the tasks finished for it. Read live from Payload.
type Event = { at: string; icon: typeof Mail; tone: string; title: string; detail?: string; href?: string };
const when = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });

export function ListingTimeline() {
  const { id } = useParams<{ id: string }>();
  const path = usePathname();
  const isLand = path.includes("/dashboard/lands/");
  const slug = path.split("/")[2] ?? "projects"; // /dashboard/<slug>/<id>
  const isListing = slug === "projects" || slug === "lands";
  const [events, setEvents] = useState<Event[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id || id === "new") return;
    let alive = true;
    const load = async () => {
      try {
        const doc = await apiGet(slug, id);
        const name = String(isLand ? doc.title : doc.name);
        const ev: Event[] = [];
        const add = (e: Event) => { if (e.at && !Number.isNaN(Date.parse(e.at))) ev.push(e); };
        const act = await apiFind("developer-activity", { limit: 200, sort: "-at", where: isListing ? { [isLand ? "landId" : "projectId"]: { equals: Number(id) } } : { and: [{ entityType: { equals: slug } }, { entityId: { equals: Number(id) } }] } }).catch(() => ({ docs: [] as Doc[] }));
        for (const a of act.docs) add({ at: String(a.at), icon: /published|unpublished/.test(String(a.title)) ? Rocket : /created/.test(String(a.title)) ? PlusCircle : Pencil, tone: "text-fg", title: String(a.title), detail: [a.detail, a.actor ? `by ${String(a.actor)}` : ""].filter(Boolean).join(" · ") || undefined });
        if (!act.docs.some((a) => /created/.test(String(a.title)))) add({ at: String(doc.createdAt), icon: PlusCircle, tone: "text-fg", title: isListing ? `${isLand ? "Land" : "Listing"} created` : "Profile created", detail: name });
        if (!isListing) {
          const to = String(doc.contact_email ?? "");
          if (to) {
            const mails = await apiFind("email-log", { limit: 100, sort: "-sentAt", where: { toEmail: { contains: to } } }).catch(() => ({ docs: [] as Doc[] }));
            for (const m of mails.docs) add({ at: String(m.sentAt), icon: Mail, tone: "text-fg", title: `Email sent: ${String(m.subject)}`, detail: `${String(m.kind ?? "Email")} · to ${String(m.toEmail ?? "")}` });
          }
          if (slug === "construction-companies") {
            const linked = await apiFind("projects", { limit: 100, where: { additional_builders: { contains: Number(id) } }, select: { name: true, updatedAt: true } }).catch(() => ({ docs: [] as Doc[] }));
            for (const p of linked.docs) add({ at: String(p.updatedAt), icon: PlusCircle, tone: "text-fg", title: `Credited on project: ${String(p.name)}`, href: `/dashboard/projects/${p.id}` });
          }
        }
        if (isListing && !isLand) {
          const leads = await apiFind("leads", { limit: 100, sort: "-createdAt", where: { project: { equals: Number(id) } }, select: { name: true, createdAt: true } }).catch(() => ({ docs: [] as Doc[] }));
          for (const l of leads.docs) add({ at: String(l.createdAt), icon: MessageCircle, tone: "text-brand", title: `Enquiry from ${String(l.name ?? "a buyer")}`, href: `/dashboard/leads/${l.id}` });
        }
        const todos = !isListing ? { docs: [] as Doc[] } : await apiFind("listing-todos", { limit: 200, where: { and: [{ done: { equals: true } }, { [isLand ? "land" : "project"]: { equals: Number(id) } }] }, select: { title: true, doneAt: true } }).catch(() => ({ docs: [] as Doc[] }));
        for (const t of todos.docs) if (t.doneAt) add({ at: String(t.doneAt), icon: CheckCircle2, tone: "text-ok", title: `Task done: ${String(t.title)}` });
        const mails = !isListing ? { docs: [] as Doc[] } : await apiFind("email-log", { limit: 100, sort: "-sentAt", where: { subject: { contains: name } } }).catch(() => ({ docs: [] as Doc[] }));
        for (const m of mails.docs) add({ at: String(m.sentAt), icon: Mail, tone: "text-fg", title: `Email sent: ${String(m.subject)}`, detail: `${String(m.kind ?? "Email")} · to ${String(m.toEmail ?? "")}` });
        ev.sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
        if (alive) { setEvents(ev); setError(""); }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : "Could not load the activity.");
      }
    };
    load();
    const timer = setInterval(load, 60_000); // new activity shows up without reloading the page
    return () => { alive = false; clearInterval(timer); };
  }, [id, isLand, slug, isListing]);

  if (!id || id === "new") return <p className="text-sm text-muted">Save first, then the activity appears here.</p>;
  if (error) return <p className="text-sm text-bad">{error}</p>;
  if (!events) return <div className="d-skeleton h-40 w-full" />;
  return (
    <section className="border border-line bg-panel">
      <h2 className="border-b border-line px-4 py-3 font-semibold">Activity timeline</h2>
      {events.length === 0 ? <p className="px-4 py-10 text-center text-sm text-muted">Nothing recorded yet.</p> : null}
      <ul>
        {events.map((e, i) => {
          const Icon = e.icon;
          const body = <><span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center border border-line bg-bg ${e.tone}`}><Icon size={14} /></span><span className="min-w-0 flex-1"><b className="block text-sm font-medium">{e.title}</b>{e.detail ? <i className="block text-xs not-italic text-muted">{e.detail}</i> : null}</span><span className="shrink-0 whitespace-nowrap text-xs text-muted">{when(e.at)}</span></>;
          return <li key={`${e.at}-${i}`} className="border-t border-line first:border-0">{e.href ? <Link href={e.href} className="flex items-start gap-3 px-4 py-2.5 hover:bg-subtle/60">{body}</Link> : <div className="flex items-start gap-3 px-4 py-2.5">{body}</div>}</li>;
        })}
      </ul>
    </section>
  );
}
