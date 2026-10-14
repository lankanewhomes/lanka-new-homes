"use client";

import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

export function NumberField({ field, value, onChange, path, ctx, readOnly }: FieldProps<number | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const money = /price|lkr|amount|cost/i.test(field.name ?? "");
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="relative">
        {money ? <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-xs text-muted">Rs.</span> : null}
        <input
          type="number"
          inputMode="decimal"
          value={value ?? ""}
          min={field.min}
          max={field.max}
          disabled={ro}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
          className={`${inputCls} ${money ? "pl-10" : ""}`}
        />
      </div>
      {money && typeof value === "number" ? <p className="mt-1 text-xs text-muted">Rs. {value.toLocaleString("en-LK")}</p> : null}
    </FieldShell>
  );
}
