"use client";

import { ArrowRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { PhoneField, type PhoneValue } from "./phone-field";
import { buildInternationalPhone, DEFAULT_PHONE_COUNTRY } from "@/lib/phone";

const AUDIENCE_OPTIONS = [
  { value: "general", label: "General inquiries" },
  { value: "founder", label: "Founder (Rupan)" },
  { value: "developer", label: "Developer partnerships" },
] as const;

/** The /contact page's own general-inquiry form, posting to /api/contact
 * (a plain email, not a Payload lead — see that route's own comment).
 * Field set — owner, 2026-09-28: "have these for the forms, name, company,
 * email, number, who are you trying to reach, tell us more about your
 * inquiry, all of them needs to be in different row" — one field per row,
 * no side-by-side pairs (an earlier version split first/last name and
 * paired company with a role field; both dropped for this exact list). The
 * phone field reuses PhoneField, the same country-code + number picker as
 * the site's other enquiry forms, rather than a one-off plain input. */
export function ContactForm() {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState<PhoneValue>({ country: DEFAULT_PHONE_COUNTRY, national: "" });
  const [audience, setAudience] = useState("");
  const [message, setMessage] = useState("");
  const [updatesOptIn, setUpdatesOptIn] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          company,
          email,
          phone: buildInternationalPhone(phone.country, phone.national),
          audience,
          message,
          updatesOptIn,
        }),
      });
      if (!response.ok) throw new Error("failed");
      setSubmitted(true);
    } catch {
      setError("Something went wrong sending your message — please email support@lankanewhomes.com directly.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="contact-form-sent" role="status">
        <p>Thanks, {name || "there"} — your message is on its way. We usually reply within one business day.</p>
      </div>
    );
  }

  return (
    <form className="contact-form" onSubmit={onSubmit}>
      <label className="contact-form-field">
        <span className="sr-only">Name</span>
        <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Name" autoComplete="name" />
      </label>

      <label className="contact-form-field">
        <span className="sr-only">Company (optional)</span>
        <input value={company} onChange={(event) => setCompany(event.target.value)} placeholder="Company (optional)" autoComplete="organization" />
      </label>

      <label className="contact-form-field">
        <span className="sr-only">Email</span>
        <input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required placeholder="Email" autoComplete="email" />
      </label>

      <div className="contact-form-field">
        <span className="sr-only" id="contact-form-phone-label">Phone number (optional)</span>
        <PhoneField value={phone} onChange={setPhone} labelId="contact-form-phone-label" />
      </div>

      <label className="contact-form-field">
        <span className="sr-only">Who are you trying to reach?</span>
        <span className="contact-form-select-wrap">
          <select value={audience} onChange={(event) => setAudience(event.target.value)} required defaultValue="">
            <option value="" disabled>Who are you trying to reach?</option>
            {AUDIENCE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <ChevronDown size={16} strokeWidth={2.5} aria-hidden="true" className="contact-form-select-chevron" />
        </span>
      </label>

      <label className="contact-form-field">
        <span className="sr-only">Tell us more about your inquiry</span>
        <textarea value={message} onChange={(event) => setMessage(event.target.value)} required rows={5} placeholder="Tell us more about your inquiry" />
      </label>

      <label className="contact-form-consent">
        <input type="checkbox" checked={updatesOptIn} onChange={(event) => setUpdatesOptIn(event.target.checked)} />
        <span>
          Yes, I&apos;d like occasional updates from LankaNewHomes. Your information is handled per our{" "}
          <Link href="/privacy">Privacy Policy</Link> and <Link href="/terms">Terms of Service</Link>. You may unsubscribe any time.
        </span>
      </label>

      {error ? <p className="contact-form-error">{error}</p> : null}

      <button type="submit" className="contact-form-submit" disabled={submitting}>
        <span className="contact-form-submit-icon" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.5} /></span>
        {submitting ? "Sending…" : "Submit"}
      </button>
    </form>
  );
}
