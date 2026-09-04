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
    <form onSubmit={save} className="max-w-2xl space-y-5 border border-stone-200 bg-white p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Name
          <input type="text" value={fullName} onChange={(event) => setFullName(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Email
          <input type="email" value={profile.email ?? ""} disabled className="w-full border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-500" />
        </label>
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Phone
          <input type="tel" value={phone} onChange={(event) => setPhone(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Profile photo
          <ImageUrlField value={avatarUrl} onChange={setAvatarUrl} folder="avatars" />
        </label>
      </div>

      <label className="block space-y-1 text-xs font-medium text-stone-600">
        Preferred locations (comma-separated)
        <input type="text" value={preferredLocations} onChange={(event) => setPreferredLocations(event.target.value)} placeholder="Colombo, Kandy, Galle" className="w-full border border-stone-300 px-3 py-2 text-sm" />
      </label>

      <div className="space-y-2">
        <p className="text-xs font-medium text-stone-600">Preferred property types</p>
        <div className="flex flex-wrap gap-2">
          {PROPERTY_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => toggleType(type)}
              className={`border px-3 py-1.5 text-xs font-medium ${preferredTypes.includes(type) ? "border-stone-900 bg-stone-900 text-white" : "border-stone-300 text-stone-700 hover:bg-stone-50"}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Budget min (LKR)
          <input type="number" min="0" value={budgetMin} onChange={(event) => setBudgetMin(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Budget max (LKR)
          <input type="number" min="0" value={budgetMax} onChange={(event) => setBudgetMax(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm" />
        </label>
        <label className="space-y-1 text-xs font-medium text-stone-600">
          Bedrooms
          <select value={preferredBedrooms} onChange={(event) => setPreferredBedrooms(event.target.value)} className="w-full border border-stone-300 px-3 py-2 text-sm">
            {BEDROOM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <button type="submit" disabled={status === "saving"} className="border border-stone-900 bg-stone-900 px-5 py-2 text-sm font-medium text-white hover:bg-stone-800 disabled:opacity-60">
          {status === "saving" ? "Saving…" : "Save changes"}
        </button>
        {status === "saved" ? <span className="text-xs text-emerald-700">Saved.</span> : null}
        {status === "error" ? <span className="text-xs text-red-700">Something went wrong — try again.</span> : null}
      </div>
    </form>
  );
}
