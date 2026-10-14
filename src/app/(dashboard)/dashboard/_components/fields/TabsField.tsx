"use client";

import { useState } from "react";
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
  return (
    <div>
      <div role="tablist" className="d-scroll -mx-1 mb-4 flex gap-1 overflow-x-auto border-b border-line px-1">
        {tabs.map((t, i) => (
          <button key={`${t.label}-${i}`} role="tab" aria-selected={t === current} type="button" onClick={() => setActive(i)} className={`relative whitespace-nowrap px-3 py-2 text-sm transition ${t === current ? "font-semibold text-fg" : "text-muted hover:text-fg"}`}>
            {t.label}
            {hasError(t) ? <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full bg-bad align-middle" /> : null}
            {t === current ? <span className="absolute inset-x-2 -bottom-px h-0.5 rounded bg-accent" /> : null}
          </button>
        ))}
      </div>
      <FieldsRenderer fields={current.fields} data={sub} onChange={setSub} path={current.name ? [...path, current.name] : path} ctx={ctx} readOnly={readOnly} />
    </div>
  );
}
