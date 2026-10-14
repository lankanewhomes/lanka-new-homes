"use client";

import type { ReactNode } from "react";
import { Lock } from "lucide-react";
import type { Role, Row, SchemaField } from "../../_mock/types";

export type FieldCtx = {
  role: Role;
  /** The whole record being edited (what admin conditions receive as `data`). */
  root: Row;
  /** The object the field sits in (what conditions receive as `siblingData`). */
  sibling: Record<string, unknown>;
  errors: Record<string, string>;
};

export type FieldProps<T = unknown> = {
  field: SchemaField;
  value: T;
  onChange: (value: T) => void;
  path: (string | number)[];
  ctx: FieldCtx;
  readOnly?: boolean;
};

export const pathKey = (p: (string | number)[]) => p.join(".");

export function getIn(obj: unknown, path: (string | number)[]): unknown {
  let cur: unknown = obj;
  for (const k of path) {
    if (cur == null || typeof cur !== "object") return undefined;
    cur = (cur as Record<string | number, unknown>)[k];
  }
  return cur;
}

export function setIn<T>(obj: T, path: (string | number)[], value: unknown): T {
  if (path.length === 0) return value as T;
  const [head, ...rest] = path;
  const base: Record<string | number, unknown> | unknown[] = Array.isArray(obj) ? [...obj] : { ...((obj as object) ?? {}) };
  (base as Record<string | number, unknown>)[head] = setIn((base as Record<string | number, unknown>)[head], rest, value);
  return base as T;
}

const condCache = new Map<string, ((data: unknown, sibling: unknown, opts: { user: { role: Role } }) => unknown) | null>();

/** Admin `condition` functions are exported as source text; evaluating them here makes fields show/hide like in Payload. */
export function conditionPasses(src: string | null | undefined, ctx: FieldCtx): boolean {
  if (!src) return true;
  let fn = condCache.get(src);
  if (fn === undefined) {
    try {
      // Mock UI only: the source text of the project's own admin conditions is evaluated so fields show/hide as in /cms.
      fn = new Function("__name", `return (${src})`)((x: unknown) => x) as typeof fn;
    } catch {
      fn = null;
    }
    condCache.set(src, fn ?? null);
  }
  if (!fn) return true;
  try {
    return Boolean(fn(ctx.root, ctx.sibling, { user: { role: ctx.role } }));
  } catch {
    return true;
  }
}

const MEDIA_NAME = /(^|_)(image|logo|photo|picture|banner|cover|thumbnail|poster|heroimage)s?$|^heroImage$|image$|Image$/;
export const isMediaField = (f: SchemaField) => f.type === "upload" || (f.type === "text" && !f.hasMany && Boolean(f.name) && MEDIA_NAME.test(f.name ?? "") && !/alt|caption|label|count|number|ratio/i.test(f.name ?? ""));

export const inputCls = "w-full rounded-md border border-line bg-panel px-3 py-2 text-sm text-fg placeholder:text-muted/70 outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20 disabled:cursor-not-allowed disabled:bg-subtle disabled:text-muted";

export function FieldShell({ field, ctx, path, children, inline }: { field: SchemaField; ctx: FieldCtx; path: (string | number)[]; children: ReactNode; inline?: boolean }) {
  const err = ctx.errors[pathKey(path)];
  return (
    <div className="min-w-0">
      {inline ? null : (
        <label className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium text-fg">
          <span>{field.label ?? field.name}</span>
          {field.required ? <span className="text-bad" title="Required">*</span> : null}
          {field.adminOnlyEdit && ctx.role !== "admin" ? <Lock size={12} className="text-muted" aria-label="Only an admin can change this" /> : null}
        </label>
      )}
      {children}
      {field.description ? <p className="mt-1.5 text-xs leading-relaxed text-muted">{field.description}</p> : null}
      {err ? <p className="mt-1 text-xs text-bad">{err}</p> : null}
    </div>
  );
}

export function isReadOnly(f: SchemaField, ctx: FieldCtx, forced?: boolean): boolean {
  return Boolean(forced || f.readOnly || (f.adminOnlyEdit && ctx.role !== "admin"));
}
