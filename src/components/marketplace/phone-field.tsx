"use client";

import { ChevronDown } from "lucide-react";
import { cleanNationalNumber, getPhoneCountries, getPhoneCountry, parseInternationalInput } from "@/lib/phone";

export type PhoneValue = { country: string; national: string };

/**
 * Country picker + number box for the enquiry forms — any country in the
 * world, Sri Lanka first. The closed picker shows just "🇱🇰 +94" (an invisible
 * native <select> sits on top, so it's the OS picker on phones); the list shows
 * country names. Pasting a full "+44 7911 123456" (or "0044 …") into the number
 * box switches the country by itself. The parent stores the {country, national}
 * pair and builds the stored string with `buildInternationalPhone` on submit.
 */
export function PhoneField({
  value,
  onChange,
  labelId,
  required,
}: {
  value: PhoneValue;
  onChange: (next: PhoneValue) => void;
  /** id of the visible label text, for the accessible name of the number box. */
  labelId: string;
  required?: boolean;
}) {
  const selected = getPhoneCountry(value.country);
  const { common, others } = getPhoneCountries();

  return (
    <div className="request-info-phone-row">
      <span className="request-info-phone-flag request-info-phone-country">
        <span aria-hidden="true">{selected.flag} +{selected.dial}</span>
        <ChevronDown className="request-info-phone-chevron" size={14} aria-hidden="true" />
        <select
          aria-label="Country code"
          value={selected.iso}
          onChange={(event) => onChange({ country: event.target.value, national: value.national })}
        >
          <optgroup label="Common">
            {common.map((country) => (
              <option key={country.iso} value={country.iso}>{country.flag} {country.name} (+{country.dial})</option>
            ))}
          </optgroup>
          <optgroup label="All countries">
            {others.map((country) => (
              <option key={country.iso} value={country.iso}>{country.flag} {country.name} (+{country.dial})</option>
            ))}
          </optgroup>
        </select>
      </span>
      <input
        type="tel"
        inputMode="tel"
        autoComplete="tel-national"
        aria-labelledby={labelId}
        value={value.national}
        onChange={(event) => {
          const raw = event.target.value;
          const parsed = parseInternationalInput(raw);
          if (parsed) onChange({ country: parsed.iso, national: parsed.national });
          else onChange({ country: value.country, national: cleanNationalNumber(raw) });
        }}
        required={required}
        placeholder={selected.iso === "LK" ? "7X XXX XXXX" : "Phone number"}
      />
    </div>
  );
}
