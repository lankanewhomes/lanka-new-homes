"use client";

import { useEffect, useRef } from "react";
import { Bold, Heading2, Italic, Link2, List, ListOrdered, Quote, Underline } from "lucide-react";
import { FieldShell, isReadOnly, type FieldProps } from "./shared";

const TOOLS = [
  { icon: Heading2, label: "Heading", c: "formatBlock", arg: "h2" },
  { icon: Bold, label: "Bold", c: "bold" },
  { icon: Italic, label: "Italic", c: "italic" },
  { icon: Underline, label: "Underline", c: "underline" },
  { icon: List, label: "Bullets", c: "insertUnorderedList" },
  { icon: ListOrdered, label: "Numbers", c: "insertOrderedList" },
  { icon: Quote, label: "Quote", c: "formatBlock", arg: "blockquote" },
  { icon: Link2, label: "Link", c: "createLink", ask: true },
];

/** Payload richText (Lexical). The mock edits plain HTML with a small toolbar; the real thing keeps Lexical JSON. */
export function RichTextField({ field, value, onChange, path, ctx, readOnly }: FieldProps<string | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current && ref.current.innerHTML !== (value ?? "")) ref.current.innerHTML = value ?? "";
    // Only on mount / external reset; typing updates `value` from the DOM itself.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const cmd = (c: string, arg?: string) => {
    document.execCommand(c, false, arg);
    onChange(ref.current?.innerHTML ?? "");
    ref.current?.focus();
  };
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="overflow-hidden rounded-md border border-line bg-panel focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/20">
        <div className="flex flex-wrap gap-0.5 border-b border-line bg-subtle px-1.5 py-1">
          {TOOLS.map((t) => (
            <button key={t.label} type="button" disabled={ro} aria-label={t.label} title={t.label} onMouseDown={(e) => e.preventDefault()} onClick={() => { if (t.ask) { const u = window.prompt("Link address"); if (u) cmd(t.c, u); } else cmd(t.c, t.arg); }} className="rounded p-1.5 text-muted hover:bg-panel hover:text-fg disabled:opacity-40"><t.icon size={15} /></button>
          ))}
        </div>
        <div ref={ref} contentEditable={!ro} suppressContentEditableWarning data-placeholder="Write here…" onInput={() => onChange(ref.current?.innerHTML ?? "")} className="d-rich d-prose min-h-40 px-3 py-2.5 text-sm outline-none [&_blockquote]:border-l-2 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_h2]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_ol]:ml-5 [&_ol]:list-decimal [&_ul]:ml-5 [&_ul]:list-disc" />
      </div>
    </FieldShell>
  );
}
