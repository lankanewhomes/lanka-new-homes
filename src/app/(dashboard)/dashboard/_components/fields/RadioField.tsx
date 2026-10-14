"use client";

import { FieldShell, isReadOnly, type FieldProps } from "./shared";

export function RadioField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | number | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {(field.options ?? []).map((o) => (
          <button key={String(o.value)} type="button" role="radio" aria-checked={value === o.value} disabled={ro} onClick={() => onChange(o.value)} className={`rounded-md border px-3 py-1.5 text-sm transition disabled:opacity-60 ${value === o.value ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-panel hover:border-accent/50"}`}>
            {o.label}
          </button>
        ))}
      </div>
    </FieldShell>
  );
}
