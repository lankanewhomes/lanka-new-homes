"use client";

import { FormEvent, useState } from "react";
import { ChevronDown } from "lucide-react";
import { buildInternationalPhone, cleanNationalNumber, DEFAULT_PHONE_COUNTRY, getPhoneCountries, getPhoneCountry, isPlausiblePhone, parseInternationalInput } from "@/lib/phone";
import { SAMPLE_RESIDENCES } from "./sample-data";

// A demo form: it validates and shows a confirmation but sends NOTHING (no
// request leaves the page), so a visitor poking at the sample can never create
// a real lead. The phone box takes a number from any country — the same
// worldwide picker as the LankaNewHomes enquiry forms.
export function SampleEnquiryForm() {
  const [country, setCountry] = useState(DEFAULT_PHONE_COUNTRY);
  const [national, setNational] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const selected = getPhoneCountry(country);
  const { common, others } = getPhoneCountries();

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isPlausiblePhone(country, national) || !buildInternationalPhone(country, national)) {
      setError("Please enter a valid phone number, including the right country code.");
      return;
    }
    setError("");
    setSent(true);
  };

  if (sent) {
    return (
      <div className="smp-form-sent" role="status">
        <h3>Thank you — this is a sample.</h3>
        <p>
          Nothing was sent. On a real site this enquiry would reach your sales team straight away, by email and WhatsApp,
          with the buyer&apos;s number saved with its country code.
        </p>
        <button type="button" className="smp-btn smp-btn-ghost-dark" onClick={() => setSent(false)}>Try again</button>
      </div>
    );
  }

  return (
    <form className="smp-form" onSubmit={onSubmit}>
      <label className="smp-field">
        <span>Full name</span>
        <input name="name" required placeholder="Your name" autoComplete="name" />
      </label>
      <label className="smp-field">
        <span>Email</span>
        <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" />
      </label>
      <div className="smp-field">
        <span id="smp-phone-label">Phone (any country)</span>
        <div className="smp-phone-row">
          <span className="smp-phone-country">
            <span aria-hidden="true">{selected.flag} +{selected.dial}</span>
            <ChevronDown size={14} aria-hidden="true" />
            <select aria-label="Country code" value={selected.iso} onChange={(event) => setCountry(event.target.value)}>
              <optgroup label="Common">
                {common.map((entry) => (
                  <option key={entry.iso} value={entry.iso}>{entry.flag} {entry.name} (+{entry.dial})</option>
                ))}
              </optgroup>
              <optgroup label="All countries">
                {others.map((entry) => (
                  <option key={entry.iso} value={entry.iso}>{entry.flag} {entry.name} (+{entry.dial})</option>
                ))}
              </optgroup>
            </select>
          </span>
          <input
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            aria-labelledby="smp-phone-label"
            required
            value={national}
            placeholder={selected.iso === "LK" ? "7X XXX XXXX" : "Phone number"}
            onChange={(event) => {
              const parsed = parseInternationalInput(event.target.value);
              if (parsed) {
                setCountry(parsed.iso);
                setNational(parsed.national);
              } else {
                setNational(cleanNationalNumber(event.target.value));
              }
            }}
          />
        </div>
      </div>
      <label className="smp-field">
        <span>I&apos;m interested in</span>
        <select name="interest" defaultValue="">
          <option value="" disabled>Choose a villa type</option>
          {SAMPLE_RESIDENCES.map((residence) => (
            <option key={residence.key} value={residence.key}>{residence.name}</option>
          ))}
          <option value="unsure">Not sure yet</option>
        </select>
      </label>
      <label className="smp-field">
        <span>Message (optional)</span>
        <textarea name="message" rows={3} placeholder="Anything you'd like us to know" />
      </label>
      {error ? <p className="smp-form-error">{error}</p> : null}
      <button type="submit" className="smp-btn smp-btn-brass smp-form-submit">Send enquiry</button>
      <p className="smp-form-note">Sample form — nothing is sent.</p>
    </form>
  );
}
