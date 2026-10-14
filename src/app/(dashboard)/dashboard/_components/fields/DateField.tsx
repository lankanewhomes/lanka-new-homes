"use client";

import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

export function DateField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const dateOnly = Boolean(field.dateOnly);
  const local = value ? (() => { const d = new Date(value); return Number.isNaN(d.getTime()) ? "" : dateOnly ? d.toISOString().slice(0, 10) : new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16); })() : "";
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <input
        type={dateOnly ? "date" : "datetime-local"}
        value={local}
        disabled={ro}
        onChange={(e) => onChange(e.target.value ? new Date(e.target.value).toISOString() : null)}
        className={inputCls}
      />
    </FieldShell>
  );
}
