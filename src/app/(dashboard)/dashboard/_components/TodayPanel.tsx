"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Eye, FileDown, Heart, Mail, MessageCircle, MessageSquare, Phone, Sparkles } from "lucide-react";
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
      } catch (e) { if (alive) setError(e instanceof Error ? e.message : "Could not load today's activity."); }
    })();
    return () => { alive = false; };
  }, [d, tick]);

  const count = (k: string) => (events ?? []).filter((e) => e.event_type === k).length;
  const notable = (events ?? []).filter((e) => e.event_type !== "view").slice(0, 12);
  const quiet = events !== null && events.length === 0;

  return (
    <section className="border border-line bg-panel" aria-label="Today">
      <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">
        <Sparkles size={16} className="text-brand" /><h2 className="font-semibold">Today</h2>
        <span className="text-xs text-muted">since midnight, Toronto time · updates every minute</span>
        <Link href="/dashboard/analytics" className="ml-auto text-xs underline">Full analytics</Link>
      </div>
      {error ? <p className="px-4 py-4 text-sm text-bad">{error}</p> : (
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 lg:grid-cols-2">
            {TYPES.map((t) => (
              <div key={t.key} className="bg-panel px-4 py-3">
                <div className="flex items-center justify-between text-muted"><span className="d-label">{t.label}</span><t.icon size={14} /></div>
                <p className={`mt-1 text-2xl font-semibold tabular-nums ${count(t.key) > 0 && t.key !== "view" ? "text-brand" : ""}`}>{events ? count(t.key) : "…"}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-line lg:border-l lg:border-t-0">
            <p className="d-label px-4 pt-3">What happened</p>
            {events === null ? <div className="d-skeleton m-4 h-24" /> : quiet ? <p className="px-4 py-6 text-sm text-muted">Nothing yet today.</p> : notable.length === 0 ? <p className="px-4 py-6 text-sm text-muted">Only page views so far today ({count("view")}). No clicks or enquiries yet.</p> : (
              <ul className="divide-y divide-line">
                {notable.map((e, i) => (
                  <li key={`${String(e.id ?? i)}`} className="flex items-baseline gap-3 px-4 py-2 text-sm">
                    <span className="w-16 shrink-0 tabular-nums text-muted">{e.timestamp ? timeOf(String(e.timestamp)) : ""}</span>
                    <span className="min-w-0 flex-1">A visitor {VERB[String(e.event_type)] ?? "did something on"} <Link href={`/dashboard/projects/${String(idOf(e.project))}`} className="font-medium hover:underline">{d.labelOf("projects", idOf(e.project))}</Link>{e.city ? <span className="text-muted"> ({String(e.city)})</span> : null}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
