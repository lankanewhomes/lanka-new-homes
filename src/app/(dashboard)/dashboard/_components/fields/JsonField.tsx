"use client";

import { useState } from "react";
import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

/** Payload json / code, and a safe fallback for any type the preview does not know. */
export function JsonField({ field, value, onChange, path, ctx, readOnly }: FieldProps<unknown>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const [text, setText] = useState(() => JSON.stringify(value ?? null, null, 2));
  const [bad, setBad] = useState(false);
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <textarea value={text} disabled={ro} rows={5} spellCheck={false} onChange={(e) => { setText(e.target.value); try { onChange(JSON.parse(e.target.value)); setBad(false); } catch { setBad(true); } }} className={`${inputCls} font-mono text-xs ${bad ? "border-bad" : ""}`} />
      {bad ? <p className="mt-1 text-xs text-bad">Not valid JSON yet.</p> : null}
    </FieldShell>
  );
}
