"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Profile } from "@/lib/auth";
import { ImageUrlField } from "@/components/ui/image-url-field";

const PROPERTY_TYPES = ["Apartments", "Condominium", "Villas", "House", "Townhouse", "Serviced Apartment", "Mixed-Use"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];

export function ProfileForm({ profile }: { profile: Profile }) {
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [phone, setPhone] = useState(profile.phone ?? "");
  const [avatarUrl, setAvatarUrl] = useState(profile.avatarUrl ?? "");
  const [preferredLocations, setPreferredLocations] = useState(profile.preferredLocations.join(", "));
  const [preferredTypes, setPreferredTypes] = useState<string[]>(profile.preferredPropertyTypes);
  const [budgetMin, setBudgetMin] = useState(profile.budgetMin ? String(profile.budgetMin) : "");
  const [budgetMax, setBudgetMax] = useState(profile.budgetMax ? String(profile.budgetMax) : "");
  const [preferredBedrooms, setPreferredBedrooms] = useState(profile.preferredBedrooms ?? "Any");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const toggleType = (type: string) => {
    setPreferredTypes((prev) => (prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    setStatus("saving");
    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim() || null,
        phone: phone.trim() || null,
        avatar_url: avatarUrl.trim() || null,
        preferred_locations: preferredLocations.split(",").map((item) => item.trim()).filter(Boolean),
        preferred_property_types: preferredTypes,
        budget_min: budgetMin ? Number(budgetMin) : null,
        budget_max: budgetMax ? Number(budgetMax) : null,
        preferred_bedrooms: preferredBedrooms !== "Any" ? preferredBedrooms : null,
      })
      .eq("id", profile.id);
    setStatus(error ? "error" : "saved");
  };

  return (
    <form onSubmit={save} className="account-panel">
      <div className="account-grid account-grid--2">
        <label className="account-field">
          Name
          <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className="account-input" />
        </label>
        <label className="account-field">
          Email
          <input type="email" value={profile.email ?? ""} disabled className="account-input" />
        </label>
        <label className="account-field">
          Phone
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="account-input" />
        </label>
        <label className="account-field">
          Profile photo
          <div className="account-avatar-field">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL from any host
              <img src={avatarUrl} alt="Your profile photo" className="account-avatar" />
            ) : null}
            <ImageUrlField value={avatarUrl} onChange={setAvatarUrl} folder="avatars" />
          </div>
        </label>
      </div>

      <label className="account-field">
        Preferred locations (comma-separated)
        <input type="text" value={preferredLocations} onChange={(event) => setPreferredLocations(event.target.value)} placeholder="Colombo, Kandy, Galle" className="account-input" />
      </label>

      <div className="account-field">
        Preferred property types
        <div className="account-chip-row">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`account-btn${preferredTypes.includes(type) ? " account-btn--dark" : ""}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="account-grid account-grid--3">
        <label className="account-field">
          Budget min (LKR)
          <input type="number" min="0" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} className="account-input" />
        </label>
        <label className="account-field">
          Budget max (LKR)
          <input type="number" min="0" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} className="account-input" />
        </label>
        <label className="account-field">
          Bedrooms
          <select value={preferredBedrooms} onChange={(event) => setPreferredBedrooms(event.target.value)} className="account-input">
            {BEDROOM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="account-chip-row">
        <button type="submit" disabled={status === "saving"} className="account-btn account-btn--dark">
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" ? <span className="account-muted">Saved.</span> : null}
        {status === "error" ? <span className="account-error">Something went wrong. Try again.</span> : null}
      </div>
    </form>
  );
}
