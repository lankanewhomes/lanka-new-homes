"use client";

import Link from "next/link";

/** What one tick means: all four kinds of update (the contact API and Contacts & subscribers store these values). */
export const ALL_UPDATES = ["newsletter", "news", "listings", "launches"];

/** The one optional "send me updates" tick box, shared by the /contact form, the Request info / Brochure / Land form and the WhatsApp popup
 * (owner, 2026-11-18: a single tick box with a sentence, on every form). Ticked = every update; value is the list saved with the contact. */
export function UpdatesOptIn({ value, onChange }: { value: string[]; onChange: (next: string[]) => void }) {
  return (
    <div className="contact-form-updates">
      <label className="contact-form-consent">
        <input type="checkbox" checked={value.length > 0} onChange={(event) => onChange(event.target.checked ? ALL_UPDATES : [])} />
        <span>Yes, send me news, new listings, price drops and launch offers by email. Unsubscribe any time.</span>
      </label>
      <p className="contact-form-updates-note">
        See our <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </div>
  );
}
