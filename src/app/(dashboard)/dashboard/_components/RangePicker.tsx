"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { ANALYTICS_TZ_LABEL, addDays, dayKey, shortDay } from "@/lib/analytics-time";

// Pick any period to look at: a quick choice (today, yesterday, 7 / 28 / 90 days), the two arrows to step back or forward by the same
// length, or exact From / To dates. Days are Sri Lanka days, the same ones GA4 uses.

export type Range = { start: string; end: string };

export const lastDays = (days: number): Range => { const end = dayKey(); return { start: addDays(end, -(days - 1)), end }; };
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
  const chip = (active: boolean) => light
    ? `rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-white bg-white text-[#17171b]" : "border-white/70 text-white hover:bg-white hover:text-[#17171b]"}`
    : `rounded-full border px-4 py-1.5 text-sm font-medium transition ${active ? "border-ink bg-ink text-white" : "border-line hover:bg-subtle"}`;
  const field = light ? "border border-white/70 bg-transparent px-2 py-1.5 text-sm text-white [color-scheme:dark]" : "border border-line bg-panel px-2 py-1.5 text-sm";
  const arrow = light ? "grid h-9 w-9 place-items-center border border-white/70 text-white hover:bg-white hover:text-[#17171b] disabled:opacity-40" : "grid h-9 w-9 place-items-center border border-line hover:bg-subtle disabled:opacity-40";
  return (
    <div className="flex flex-col gap-2" role="group" aria-label="Choose dates">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" aria-label="Earlier dates" title="Go back by the same number of days" onClick={() => step(-1)} className={arrow}><ChevronLeft size={16} /></button>
        <span className={`min-w-[150px] text-center text-sm font-medium ${light ? "text-white" : ""}`}>{describeRange(value)}</span>
        <button type="button" aria-label="Later dates" title="Go forward by the same number of days" disabled={value.end >= today} onClick={() => step(1)} className={arrow}><ChevronRight size={16} /></button>
        {PRESETS.map((p) => {
          const r = p.make();
          return <button key={p.label} type="button" onClick={() => onChange(r)} className={chip(r.start === value.start && r.end === value.end)}>{p.label}</button>;
        })}
      </div>
      <div className={`flex flex-wrap items-center gap-2 text-xs ${light ? "text-white/80" : "text-muted"}`}>
        <label className="flex items-center gap-1.5">From <input type="date" value={value.start} max={value.end} onChange={(e) => e.target.value && onChange({ start: e.target.value, end: value.end })} className={field} /></label>
        <label className="flex items-center gap-1.5">To <input type="date" value={value.end} min={value.start} max={today} onChange={(e) => e.target.value && onChange({ start: value.start, end: e.target.value })} className={field} /></label>
        <span>{ANALYTICS_TZ_LABEL}</span>
      </div>
    </div>
  );
}
