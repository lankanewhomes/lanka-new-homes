"use client";

import { Combobox } from "../Combobox";
import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

/** Payload select (and radio-as-segmented in RadioField). Short lists use a native dropdown, long ones a searchable picker. */
export function SelectField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | number | (string | number)[] | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const options = field.options ?? [];
  const many = Boolean(field.hasMany);
  const useCombo = many || options.length > 10;
  const arr = Array.isArray(value) ? value : value === null || value === undefined || value === "" ? [] : [value];
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      {useCombo ? (
        <Combobox options={options} value={arr} multiple={many} disabled={ro} onChange={(next) => onChange(many ? next : (next[0] ?? null))} />
      ) : (
        <select value={arr[0] === undefined ? "" : String(arr[0])} disabled={ro} onChange={(e) => onChange(e.target.value === "" ? null : (options.find((o) => String(o.value) === e.target.value)?.value ?? null))} className={inputCls}>
          <option value="">{field.required ? "Select…" : "None"}</option>
          {options.map((o) => <option key={String(o.value)} value={String(o.value)}>{o.label}</option>)}
        </select>
      )}
    </FieldShell>
  );
}
