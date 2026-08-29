"use client";

import { useState, type FormEvent } from "react";
import type { ConstructionCompany, ConstructionCompanyCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/dashboard/components";

const categoryOptions: { value: ConstructionCompanyCategory; label: string }[] = [
  { value: "general", label: "General construction" },
  { value: "colombo", label: "Colombo" },
  { value: "swimming-pools", label: "Swimming pools" },
  { value: "consulting", label: "Consulting" },
];

export function ConstructionCompanyForm({ initialCompany }: { initialCompany?: ConstructionCompany } = {}) {
  const isEditing = Boolean(initialCompany);
  const [name, setName] = useState(initialCompany?.name ?? "");
  const [logo, setLogo] = useState(initialCompany?.logo ?? "");
  const [description, setDescription] = useState(initialCompany?.description ?? "");
  const [location, setLocation] = useState(initialCompany?.location ?? "");
  const [categories, setCategories] = useState<ConstructionCompanyCategory[]>(initialCompany?.categories ?? []);
  const [yearsInBusiness, setYearsInBusiness] = useState(initialCompany?.yearsInBusiness ? String(initialCompany.yearsInBusiness) : "");
  const [website, setWebsite] = useState(initialCompany?.website ?? "");
  const [email, setEmail] = useState(initialCompany?.email ?? "");
  const [phone, setPhone] = useState(initialCompany?.phone ?? "");
  const [facebookUrl, setFacebookUrl] = useState(initialCompany?.socialLinks?.facebook ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialCompany?.socialLinks?.instagram ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialCompany?.socialLinks?.linkedin ?? "");
  const [twitterUrl, setTwitterUrl] = useState(initialCompany?.socialLinks?.twitter ?? "");
  const [whatsappUrl, setWhatsappUrl] = useState(initialCompany?.socialLinks?.whatsapp ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialCompany?.socialLinks?.youtube ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(initialCompany?.socialLinks?.tiktok ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const toggleCategory = (category: ConstructionCompanyCategory) =>
    setCategories((current) => (current.includes(category) ? current.filter((item) => item !== category) : [...current, category]));

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const payload = {
      name,
      logo,
      description,
      location,
      categories,
      yearsInBusiness: yearsInBusiness ? Number(yearsInBusiness) : undefined,
      website: website || undefined,
      email: email || undefined,
      phone: phone || undefined,
      socialLinks: {
        facebook: facebookUrl.trim() || undefined,
        instagram: instagramUrl.trim() || undefined,
        linkedin: linkedinUrl.trim() || undefined,
        twitter: twitterUrl.trim() || undefined,
        whatsapp: whatsappUrl.trim() || undefined,
        youtube: youtubeUrl.trim() || undefined,
        tiktok: tiktokUrl.trim() || undefined,
      },
    };

    try {
      const response = isEditing
        ? await fetch(`/api/construction-companies/${initialCompany!.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/construction-companies", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await response.json().catch(() => null);
      const savedSlug = isEditing ? initialCompany!.slug : data?.slug;

      if (!response.ok || !savedSlug) {
        setErrorMessage(data?.error ?? `Unable to ${isEditing ? "save" : "create"} construction company.`);
        setSaving(false);
        return;
      }

      window.location.href = "/admin/construction-companies";
    } catch {
      setErrorMessage(`Unable to ${isEditing ? "save" : "create"} construction company.`);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Company name"><input value={name} onChange={(event) => setName(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="e.g. Lanka Poolworks" required /></Field>
        <Field label="Location"><input value={location} onChange={(event) => setLocation(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="e.g. Colombo 05" required /></Field>

        <Field label="Logo image URL" className="md:col-span-2"><input value={logo} onChange={(event) => setLogo(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" placeholder="https://..." required /></Field>
        <Field label="Description" className="md:col-span-2"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" rows={4} required /></Field>

        <Field label="Website URL"><input value={website} onChange={(event) => setWebsite(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="https://..." /></Field>
        <Field label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="border border-stone-300 px-3 py-2 text-sm" /></Field>

        <Field label="Phone"><input value={phone} onChange={(event) => setPhone(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" /></Field>
        <Field label="Years in business (optional)"><input value={yearsInBusiness} onChange={(event) => setYearsInBusiness(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" /></Field>
      </div>

      <div className="border border-stone-200 bg-stone-50 p-3">
        <p className="text-sm font-medium text-stone-900">Categories</p>
        <p className="mt-1 text-xs text-stone-600">Controls which /construction-companies/* directory pages this company appears on.</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-4">
          {categoryOptions.map((option) => (
            <label key={option.value} className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm">
              <input type="checkbox" checked={categories.includes(option.value)} onChange={() => toggleCategory(option.value)} />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      <div className="border border-sky-200 bg-sky-50 p-3">
        <p className="text-sm font-medium text-stone-900">Social networks</p>
        <p className="mt-1 text-xs text-stone-600">Shown on the public company page and anywhere this company is listed as a seller. Leave blank to hide.</p>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <Field label="Facebook URL"><input value={facebookUrl} onChange={(event) => setFacebookUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="Instagram URL"><input value={instagramUrl} onChange={(event) => setInstagramUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="LinkedIn URL"><input value={linkedinUrl} onChange={(event) => setLinkedinUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="Twitter / X URL"><input value={twitterUrl} onChange={(event) => setTwitterUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="WhatsApp link (wa.me/...)"><input value={whatsappUrl} onChange={(event) => setWhatsappUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="YouTube URL"><input value={youtubeUrl} onChange={(event) => setYoutubeUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
          <Field label="TikTok URL"><input value={tiktokUrl} onChange={(event) => setTiktokUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
        </div>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Template is applied automatically. You can refine visuals later.</p>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : "Create Company"}</Button>
      </div>
    </form>
  );
}
