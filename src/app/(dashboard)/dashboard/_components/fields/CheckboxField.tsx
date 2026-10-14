"use client";

import { FieldShell, isReadOnly, type FieldProps } from "./shared";

/** Payload checkbox, shown as a toggle switch. */
export function CheckboxField({ field, value, onChange, path, ctx, readOnly }: FieldProps<boolean | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const on = Boolean(value);
  return (
    <FieldShell field={{ ...field, label: undefined }} ctx={ctx} path={path} inline>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        disabled={ro}
        onClick={() => onChange(!on)}
        className="flex w-full items-center gap-3 rounded-md border border-line bg-panel px-3 py-2 text-left text-sm transition hover:border-accent/60 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <span className={`relative h-5 w-9 shrink-0 rounded-full transition ${on ? "bg-accent" : "bg-line"}`}>
          <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${on ? "left-[18px]" : "left-0.5"}`} />
        </span>
        <span className="font-medium">{field.label ?? field.name}{field.required ? <span className="text-bad"> *</span> : null}</span>
      </button>
    </FieldShell>
  );
}
