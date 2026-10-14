"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronsUpDown, Search, X } from "lucide-react";
import { inputCls } from "./fields/shared";

export type ComboOption = { value: string | number; label: string; hint?: string };

/** Searchable single/multi picker used by Select (long lists) and Relationship fields. */
export function Combobox({ options, value, onChange, multiple, placeholder = "Select…", disabled, loading }: {
  options: ComboOption[];
  value: (string | number)[];
  onChange: (next: (string | number)[]) => void;
  multiple?: boolean;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const byValue = useMemo(() => new Map(options.map((o) => [o.value, o])), [options]);
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (s ? options.filter((o) => o.label.toLowerCase().includes(s) || o.hint?.toLowerCase().includes(s)) : options).slice(0, 80);
  }, [options, q]);
  const pickOne = (v: string | number) => {
    if (multiple) onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
    else { onChange([v]); setOpen(false); setQ(""); }
  };
  const label = (v: string | number) => byValue.get(v)?.label ?? String(v);

  return (
    <div ref={ref} className="relative">
      <button type="button" disabled={disabled} onClick={() => setOpen((o) => !o)} className={`${inputCls} flex min-h-[38px] items-center justify-between gap-2 text-left`}>
        <span className="flex min-w-0 flex-1 flex-wrap items-center gap-1">
          {value.length === 0 ? <span className="text-muted/70">{loading ? "Loading…" : placeholder}</span> : multiple ? value.map((v) => (
            <span key={String(v)} className="inline-flex items-center gap-1 rounded bg-subtle px-1.5 py-0.5 text-xs">
              {label(v)}
              {disabled ? null : <X size={11} className="cursor-pointer text-muted hover:text-fg" onClick={(e) => { e.stopPropagation(); onChange(value.filter((x) => x !== v)); }} />}
            </span>
          )) : <span className="truncate">{label(value[0])}</span>}
        </span>
        <ChevronsUpDown size={14} className="shrink-0 text-muted" />
      </button>
      {open ? (
        <div className="absolute z-30 mt-1 w-full min-w-56 rounded-lg border border-line bg-panel shadow-card">
          <div className="flex items-center gap-2 border-b border-line px-2.5 py-2">
            <Search size={14} className="text-muted" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search…" className="w-full bg-transparent text-sm outline-none" />
          </div>
          <ul className="d-scroll max-h-60 overflow-y-auto py-1" role="listbox">
            {filtered.length === 0 ? <li className="px-3 py-2 text-sm text-muted">{loading ? "Loading…" : "No matches"}</li> : null}
            {filtered.map((o) => {
              const on = value.includes(o.value);
              return (
                <li key={String(o.value)}>
                  <button type="button" role="option" aria-selected={on} onClick={() => pickOne(o.value)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm hover:bg-subtle">
                    <Check size={14} className={on ? "text-accent" : "opacity-0"} />
                    <span className="min-w-0 flex-1 truncate">{o.label}</span>
                    {o.hint ? <span className="text-xs text-muted">{o.hint}</span> : null}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
