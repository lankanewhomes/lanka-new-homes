"use client";

import { useState } from "react";
import { Check } from "lucide-react";
import { FieldsRenderer } from "../FieldsRenderer";
import { conditionPasses, pathKey, type FieldProps } from "./shared";

type Obj = Record<string, unknown>;

/** Payload tabs (named tabs store a nested object, unnamed ones are visual only). The tab bar marks tabs that contain errors. */
export function TabsField({ field, data, onChange, path, ctx, readOnly }: Omit<FieldProps, "value" | "onChange"> & { data: Obj; onChange: (next: Obj) => void }) {
  const tabs = (field.tabs ?? []).filter((t) => conditionPasses(t.condition, ctx));
  const [active, setActive] = useState(0);
  const current = tabs[Math.min(active, tabs.length - 1)];
  if (!current) return null;
  const hasError = (t: (typeof tabs)[number]) => {
    const prefix = t.name ? pathKey([...path, t.name]) : null;
    if (prefix) return Object.keys(ctx.errors).some((k) => k.startsWith(prefix));
    const names = new Set<string>();
    const collect = (fs: typeof t.fields) => fs.forEach((f) => { if (f.name) names.add(f.name); if (f.fields && !f.name) collect(f.fields); });
    collect(t.fields);
    return Object.keys(ctx.errors).some((k) => names.has(k.split(".")[path.length] ?? ""));
  };
  const sub = current.name ? ((data[current.name] as Obj) ?? {}) : data;
  const setSub = (next: Obj) => onChange(current.name ? { ...data, [current.name]: next } : next);
  // Many sections (a project has 19): a side menu of bordered rows like the account menu, with a dark open row. On phones it
  // becomes a dropdown. Short tab lists keep the horizontal bar.
  const side = tabs.length > 6;
  const content = <FieldsRenderer fields={current.fields} data={sub} onChange={setSub} path={current.name ? [...path, current.name] : path} ctx={ctx} readOnly={readOnly} />;
  if (side) {
    return (
      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <div className="lg:hidden">
          <label className="d-label mb-1.5 block" htmlFor="section-select">Section</label>
          <select id="section-select" value={active} onChange={(e) => setActive(Number(e.target.value))} className="w-full border border-line bg-panel px-3 py-2 text-sm">
            {tabs.map((t, i) => <option key={`${t.label}-${i}`} value={i}>{t.label}{hasError(t) ? " (needs attention)" : ""}</option>)}
          </select>
        </div>
        <nav aria-label="Sections" className="hidden lg:block">
          <ul role="tablist" className="d-scroll sticky top-20 max-h-[calc(100vh-7rem)] space-y-1.5 overflow-y-auto pr-1">
            {tabs.map((t, i) => (
              <li key={`${t.label}-${i}`}>
                <button type="button" role="tab" aria-selected={t === current} onClick={() => setActive(i)} className={`flex w-full items-center gap-2 border px-3 py-1.5 text-left text-sm transition ${t === current ? "border-ink bg-ink font-medium text-white" : "border-line bg-panel hover:border-fg/40"}`}>
                  <span className="flex-1 truncate">{t.label}</span>
                  {hasError(t) ? <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-bad" aria-label="needs attention" /> : null}
                  {t === current ? <Check size={14} className="shrink-0" /> : null}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0">
          <h2 className="mb-4 text-[22px] font-normal leading-tight">{current.label}</h2>
          {content}
        </div>
      </div>
    );
  }
  return (
    <div>
      <div role="tablist" className="d-scroll -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t, i) => (
          <button key={`${t.label}-${i}`} role="tab" aria-selected={t === current} type="button" onClick={() => setActive(i)} className={`relative whitespace-nowrap px-3 py-2 text-sm transition ${t === current ? "font-semibold text-fg" : "text-muted hover:text-fg"}`}>
            {t.label}
            {hasError(t) ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-bad align-middle" /> : null}
            {t === current ? <span className="absolute inset-x-2 -bottom-px h-0.5 bg-ink" /> : null}
          </button>
        ))}
      </div>
      {content}
    </div>
  );
}
