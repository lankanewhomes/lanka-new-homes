"use client";

import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

/** Payload text, email and textarea fields. */
export function TextField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const common = { value: value ?? "", disabled: ro, onChange: (e: { target: { value: string } }) => onChange(e.target.value), maxLength: field.maxLength, placeholder: field.type === "email" ? "name@company.lk" : undefined };
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      {field.type === "textarea" ? <textarea {...common} rows={4} className={`${inputCls} resize-y leading-relaxed`} /> : <input {...common} type={field.type === "email" ? "email" : "text"} className={inputCls} />}
    </FieldShell>
  );
}
