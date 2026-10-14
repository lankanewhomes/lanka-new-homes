"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Copy, GripVertical, MoveDown, MoveUp, Plus, Trash2 } from "lucide-react";
import { FieldsRenderer } from "../FieldsRenderer";
import type { Row } from "../../_mock/types";
import { FieldShell, isReadOnly, type FieldProps } from "./shared";

/** Payload array: repeatable rows that can be reordered (drag handle or arrows), duplicated and removed. */
export function ArrayField({ field, value, onChange, path, ctx, readOnly }: FieldProps<Row[]>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const rows = Array.isArray(value) ? value : [];
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [drag, setDrag] = useState<number | null>(null);
  const singular = field.rowLabel ?? "Row";
  const move = (from: number, to: number) => {
    if (to < 0 || to >= rows.length || from === to) return;
    const next = [...rows];
    next.splice(to, 0, next.splice(from, 1)[0]);
    onChange(next);
  };
  const title = (r: Row, i: number) => {
    const first = (field.fields ?? []).find((f) => f.name && (f.type === "text" || f.type === "email") && typeof r[f.name] === "string" && r[f.name]);
    return first ? String(r[first.name!]) : `${singular} ${i + 1}`;
  };
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="space-y-2">
        {rows.length === 0 ? <p className="rounded-md border border-dashed border-line px-3 py-3 text-center text-sm text-muted">No {singular.toLowerCase()}s yet.</p> : null}
        {rows.map((r, i) => {
          const id = String(r.id ?? i);
          const isOpen = open[id] ?? i < 1;
          return (
            <div key={id} onDragOver={(e) => drag !== null && e.preventDefault()} onDrop={() => { if (drag !== null) move(drag, i); setDrag(null); }} className={`rounded-lg border bg-panel ${drag === i ? "opacity-50" : ""} border-line`}>
              <div className="flex items-center gap-1 px-2 py-1.5">
                <span draggable={!ro} onDragStart={() => setDrag(i)} onDragEnd={() => setDrag(null)} className="cursor-grab p-1 text-muted active:cursor-grabbing" aria-label="Drag to reorder"><GripVertical size={15} /></span>
                <button type="button" onClick={() => setOpen({ ...open, [id]: !isOpen })} className="flex min-w-0 flex-1 items-center gap-1.5 text-left text-sm font-medium">
                  {isOpen ? <ChevronDown size={15} /> : <ChevronRight size={15} />}
                  <span className="text-muted">{i + 1}.</span>
                  <span className="truncate">{title(r, i)}</span>
                </button>
                {ro ? null : (
                  <>
                    <button type="button" aria-label="Move up" disabled={i === 0} onClick={() => move(i, i - 1)} className="rounded p-1 text-muted hover:bg-subtle hover:text-fg disabled:opacity-30"><MoveUp size={14} /></button>
                    <button type="button" aria-label="Move down" disabled={i === rows.length - 1} onClick={() => move(i, i + 1)} className="rounded p-1 text-muted hover:bg-subtle hover:text-fg disabled:opacity-30"><MoveDown size={14} /></button>
                    <button type="button" aria-label="Duplicate" onClick={() => onChange([...rows.slice(0, i + 1), { ...structuredClone(r), id: `${id}-copy-${Date.now()}` }, ...rows.slice(i + 1)])} className="rounded p-1 text-muted hover:bg-subtle hover:text-fg"><Copy size={14} /></button>
                    <button type="button" aria-label="Remove" onClick={() => onChange(rows.filter((_, k) => k !== i))} className="rounded p-1 text-muted hover:bg-subtle hover:text-bad"><Trash2 size={14} /></button>
                  </>
                )}
              </div>
              {isOpen ? (
                <div className="border-t border-line p-3">
                  <FieldsRenderer fields={field.fields ?? []} data={r} onChange={(next) => onChange(rows.map((x, k) => (k === i ? (next as Row) : x)))} path={[...path, i]} ctx={ctx} readOnly={ro} />
                </div>
              ) : null}
            </div>
          );
        })}
        {ro ? null : (
          <button type="button" onClick={() => { const id = `new-${Date.now()}`; onChange([...rows, { id }]); setOpen({ ...open, [id]: true }); }} className="inline-flex items-center gap-1.5 rounded-md border border-line bg-panel px-3 py-1.5 text-sm hover:border-accent/60 hover:text-accent">
            <Plus size={14} /> Add {singular.toLowerCase()}
          </button>
        )}
      </div>
    </FieldShell>
  );
}
