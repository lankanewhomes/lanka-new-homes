"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ANALYTICS_START } from "@/lib/analytics-start";
import { ANALYTICS_TZ_LABEL, addDays, dayKey, shortDay } from "@/lib/analytics-time";

// Pick any period to look at: a quick choice (today, yesterday, 7 / 28 / 90 days), the two arrows to step back or forward by the same
// length, or exact From / To dates. Days are Sri Lanka days, the same ones GA4 uses.

export type Range = { start: string; end: string };

export const lastDays = (days: number): Range => { const end = dayKey(); return { start: addDays(end, -(days - 1)), end }; };
/** From the first counted day (11 Oct 2026) up to today, so new days appear on their own. */
export const sinceStart = (): Range => ({ start: dayKey(ANALYTICS_START), end: dayKey() });
export const rangeLength = (r: Range) => Math.round((Date.parse(`${r.end}T00:00:00Z`) - Date.parse(`${r.start}T00:00:00Z`)) / 86400000) + 1;

const PRESETS: { label: string; make: () => Range }[] = [
  { label: "Today", make: () => lastDays(1) },
  { label: "Yesterday", make: () => { const d = addDays(dayKey(), -1); return { start: d, end: d }; } },
  { label: "7 days", make: () => lastDays(7) },
  { label: "28 days", make: () => lastDays(28) },
  { label: "90 days", make: () => lastDays(90) },
];

export function describeRange(r: Range): string {
  const today = dayKey();
  if (r.start === r.end) return r.start === today ? "Today" : r.start === addDays(today, -1) ? "Yesterday" : shortDay(r.start);
  return `${shortDay(r.start)} to ${shortDay(r.end)}`;
}

export function RangePicker({ value, onChange, light = false }: { value: Range; onChange: (next: Range) => void; light?: boolean }) {
  const today = dayKey();
  const len = rangeLength(value);
  const step = (dir: -1 | 1) => {
    const next = { start: addDays(value.start, dir * len), end: addDays(value.end, dir * len) };
    if (next.end > today) onChange({ start: addDays(today, -(len - 1)), end: today });
    else onChange(next);
  };
  // One tidy panel: a joined row of quick choices, then the period with its arrows, then exact dates. On the dark hero it is a
  // faint white-on-dark panel; on a plain page it is a normal bordered box.
  const panel = light ? "border border-white/25 bg-white/[0.06] text-white" : "border border-line bg-panel";
  const edge = light ? "border-white/25" : "border-line";
  const seg = (active: boolean) => `whitespace-nowrap px-3.5 py-2 text-[13px] font-medium transition ${active ? (light ? "bg-white text-[#17171b]" : "bg-ink text-white") : (light ? "hover:bg-white/15" : "hover:bg-subtle")}`;
  const arrow = `grid h-10 w-10 shrink-0 place-items-center transition disabled:opacity-35 ${light ? "hover:bg-white/15" : "hover:bg-subtle"}`;
  const label = `mb-1 block text-[10.5px] font-semibold uppercase tracking-[0.08em] ${light ? "text-white/65" : "text-muted"}`;
  const field = `h-10 w-full border px-2.5 text-sm ${light ? "border-white/25 bg-transparent text-white [color-scheme:dark]" : "border-line bg-panel"}`;
  return (
    <div className={`w-full max-w-[560px] space-y-3 p-3 ${panel}`} role="group" aria-label="Choose dates">
      <div className={`flex overflow-x-auto border ${edge}`}>
        {PRESETS.map((p, i) => {
          const r = p.make();
          return <button key={p.label} type="button" onClick={() => onChange(r)} className={`${seg(r.start === value.start && r.end === value.end)} flex-1 ${i > 0 ? `border-l ${edge}` : ""}`}>{p.label}</button>;
        })}
      </div>
      <div className={`flex items-stretch border ${edge}`}>
        <button type="button" aria-label="Earlier dates" title="Go back by the same number of days" onClick={() => step(-1)} className={`${arrow} border-r ${edge}`}><ChevronLeft size={17} /></button>
        <div className="flex min-w-0 flex-1 flex-col items-center justify-center px-3 py-1 text-center">
          <span className="truncate text-[15px] font-semibold leading-tight">{describeRange(value)}</span>
          <span className={`text-[11px] ${light ? "text-white/65" : "text-muted"}`}>{len === 1 ? "1 day" : `${len} days`} · {ANALYTICS_TZ_LABEL}</span>
        </div>
        <button type="button" aria-label="Later dates" title="Go forward by the same number of days" disabled={value.end >= today} onClick={() => step(1)} className={`${arrow} border-l ${edge}`}><ChevronRight size={17} /></button>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <label><span className={label}>From</span><input type="date" value={value.start} max={value.end} onChange={(e) => e.target.value && onChange({ start: e.target.value, end: value.end })} className={field} /></label>
        <label><span className={label}>To</span><input type="date" value={value.end} min={value.start} max={today} onChange={(e) => e.target.value && onChange({ start: value.start, end: e.target.value })} className={field} /></label>
      </div>
    </div>
  );
}
