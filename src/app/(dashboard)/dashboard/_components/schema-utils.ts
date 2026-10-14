import type { Row, SchemaField } from "../_mock/types";
import { conditionPasses, pathKey, type FieldCtx } from "./fields/shared";

/** Named top-level fields (looking through tabs, rows and collapsibles), in schema order. Used for list columns and filters. */
export function flatFields(fields: SchemaField[], prefix = ""): SchemaField[] {
  const out: SchemaField[] = [];
  for (const f of fields) {
    if (f.type === "tabs") for (const t of f.tabs ?? []) out.push(...flatFields(t.fields, t.name ? `${prefix}${t.name}.` : prefix));
    else if (f.type === "row" || f.type === "collapsible") out.push(...flatFields(f.fields ?? [], prefix));
    else if (f.name && f.type !== "ui" && f.type !== "join") out.push({ ...f, name: `${prefix}${f.name}` });
  }
  return out;
}

export const getPath = (row: Row, name: string): unknown => name.split(".").reduce<unknown>((o, k) => (o && typeof o === "object" ? (o as Record<string, unknown>)[k] : undefined), row);

/** Required-field check over the fields that are currently visible (admin conditions respected). Returns { path: message }. */
export function collectErrors(fields: SchemaField[], data: Record<string, unknown>, path: (string | number)[], ctx: FieldCtx): Record<string, string> {
  const errors: Record<string, string> = {};
  const here: FieldCtx = { ...ctx, sibling: data };
  for (const f of fields) {
    if (f.type === "tabs") {
      for (const t of f.tabs ?? []) {
        if (!conditionPasses(t.condition, here)) continue;
        Object.assign(errors, collectErrors(t.fields, t.name ? ((data[t.name] as Record<string, unknown>) ?? {}) : data, t.name ? [...path, t.name] : path, ctx));
      }
      continue;
    }
    if (f.type === "row" || f.type === "collapsible") { Object.assign(errors, collectErrors(f.fields ?? [], data, path, ctx)); continue; }
    if (!f.name || f.hidden || f.type === "ui" || f.type === "join" || !conditionPasses(f.condition, here)) continue;
    const v = data[f.name];
    const p = [...path, f.name];
    if (f.required) {
      const empty = v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);
      if (empty && f.type !== "checkbox") errors[pathKey(p)] = `${f.label ?? f.name} is required`;
    }
    if (f.type === "group" && v && typeof v === "object") Object.assign(errors, collectErrors(f.fields ?? [], v as Record<string, unknown>, p, ctx));
    if (f.type === "array" && Array.isArray(v)) v.forEach((r, i) => Object.assign(errors, collectErrors(f.fields ?? [], r as Record<string, unknown>, [...p, i], ctx)));
  }
  return errors;
}

export const isPublishedRow = (row: Row) => (typeof row.isPublished === "boolean" ? row.isPublished : undefined);

/** A blank record for "Create new": defaults only. */
export function blankRow(fields: SchemaField[]): Row {
  const row: Row = { id: "new" };
  const walk = (list: SchemaField[], target: Record<string, unknown>) => {
    for (const f of list) {
      if (f.type === "tabs") {
        for (const tab of f.tabs ?? []) {
          if (tab.name) {
            const sub: Record<string, unknown> = {};
            walk(tab.fields, sub);
            target[tab.name] = sub;
          } else walk(tab.fields, target);
        }
      } else if (f.type === "row" || f.type === "collapsible") walk(f.fields ?? [], target);
      else if (f.name && f.type !== "ui" && f.type !== "join") {
        if (f.type === "group") {
          const sub: Record<string, unknown> = {};
          walk(f.fields ?? [], sub);
          target[f.name] = sub;
        } else if (f.type === "array") target[f.name] = [];
        else if (f.defaultValue !== undefined) target[f.name] = f.defaultValue;
        else if (f.type === "checkbox") target[f.name] = false;
        else target[f.name] = f.hasMany ? [] : null;
      }
    }
  };
  walk(fields, row);
  return row;
}
