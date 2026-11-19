"use client";

import Link from "next/link";
import { UPDATE_CHOICES } from "@/components/marketplace/contact-form";

/** The optional "send me updates" tick boxes, shared by the /contact form, the Request info / Brochure / Land form and the WhatsApp popup
 * (owner, 2026-11-18: every form gets the tick box). Keep it short; the choices live in contact-form.tsx. */
export function UpdatesOptIn({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  const toggle = (v: string) => onChange(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);
  return (
    <fieldset className="contact-form-updates">
      <legend>Send me (optional)</legend>
      {UPDATE_CHOICES.map((choice) => (
        <label key={choice.value} className="contact-form-consent">
          <input type="checkbox" checked={value.includes(choice.value)} onChange={() => toggle(choice.value)} />
          <span>{choice.label}</span>
        </label>
      ))}
      <p className="contact-form-updates-note">
        See our <Link href="/privacy">Privacy Policy</Link>. Unsubscribe any time.
      </p>
    </fieldset>
  );
}
