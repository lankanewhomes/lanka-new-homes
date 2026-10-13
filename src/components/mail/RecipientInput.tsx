"use client";

import { X } from "lucide-react";
import { useRef, useState } from "react";
import type { MailAddress } from "./types";
import { isEmail, parseAddresses } from "./utils";

// To / Cc / Bcc field with chips. Enter, comma, semicolon, space, Tab or leaving the field turns the text into a chip; invalid
// addresses show in red and block sending.
export function RecipientInput({ value, onChange, autoFocus }: { value: MailAddress[]; onChange: (next: MailAddress[]) => void; autoFocus?: boolean }) {
  const [text, setText] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const commit = (raw: string) => {
    const parsed = parseAddresses(raw);
    if (!parsed.length) return;
    const known = new Set(value.map((a) => a.email.toLowerCase()));
    const fresh = parsed.filter((a) => !known.has(a.email.toLowerCase()));
    if (fresh.length) onChange([...value, ...fresh]);
    setText("");
  };

  return (
    <div className="lnh-chips" onClick={() => input.current?.focus()}>
      {value.map((a, i) => (
        <span key={`${a.email}-${i}`} className={`lnh-chip${isEmail(a.email) ? "" : " bad"}`} title={a.email}>
          {a.name?.trim() || a.email}
          <button type="button" aria-label={`Remove ${a.email}`} onClick={() => onChange(value.filter((_, n) => n !== i))}><X size={12} /></button>
        </span>
      ))}
      <input
        ref={input}
        autoFocus={autoFocus}
        value={text}
        onChange={(e) => {
          const v = e.target.value;
          if (/[,;\s]$/.test(v) && v.trim().length > 1) commit(v);
          else setText(v);
        }}
        onKeyDown={(e) => {
          if ((e.key === "Enter" || e.key === "Tab") && text.trim()) { e.preventDefault(); commit(text); }
          else if (e.key === "Backspace" && !text && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => commit(text)}
        onPaste={(e) => {
          const pasted = e.clipboardData.getData("text");
          if (/[,;\n]/.test(pasted)) { e.preventDefault(); commit(pasted); }
        }}
        aria-label="Recipients"
      />
    </div>
  );
}
