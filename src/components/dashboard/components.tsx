"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Amenity, CoDeveloperEntry, Developer, FactIconKey, FactItem, FloorPlan, Neighborhood, Project, Unit } from "@/types";
import { Button } from "@/components/ui/button";
import { ICON_LABELS, ICON_OPTIONS } from "@/lib/fact-icons";
import {
  sriLankaCitiesByDistrict,
  sriLankaDistrictsByProvince,
  sriLankaNeighborhoodsByCity,
  sriLankaProvinces,
} from "@/data/sri-lanka-market-geo";

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="field-tooltip" tabIndex={0}>
      <span className="field-tooltip-icon">?</span>
      <span className="field-tooltip-bubble">{text}</span>
    </span>
  );
}

function Field({ label, className, children }: { label: string; className?: string; children: ReactNode }) {
  return (
    <label className={`grid gap-1 text-xs text-stone-700 ${className ?? ""}`.trim()}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function toWizardSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function useDeveloperDirectory() {
  const [developers, setDevelopers] = useState<Developer[]>([]);

  useEffect(() => {
    fetch("/api/developers")
      .then((response) => response.json())
      .then((data) => setDevelopers(Array.isArray(data?.developers) ? data.developers : []))
      .catch(() => setDevelopers([]));
  }, []);

  return developers;
}

const weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const;

function buildInitialOfficeHours(existing: { day: string; open: boolean; from?: string; to?: string }[] | undefined) {
  return weekDays.map((day) => {
    const match = existing?.find((entry) => entry.day === day);
    return {
      day,
      open: match?.open ?? false,
      from: match?.from ?? "09:00",
      to: match?.to ?? "17:00",
    };
  });
}

function CoDeveloperEditor({
  coDevelopers,
  setCoDevelopers,
  developerOptions,
  excludeSlug,
}: {
  coDevelopers: CoDeveloperEntry[];
  setCoDevelopers: (updater: (current: CoDeveloperEntry[]) => CoDeveloperEntry[]) => void;
  developerOptions: Developer[];
  excludeSlug?: string;
}) {
  const [newName, setNewName] = useState("");

  const destinationOptions = developerOptions.filter((developer) => developer.slug !== excludeSlug);

  return (
    <div className="mt-4 border-t border-stone-200 pt-4">
      <p className="text-sm font-medium text-stone-900">Additional builders</p>
      <p className="mt-1 text-xs text-stone-600">For projects with more than one developer. The primary developer is set by which developer dashboard this project belongs to.</p>

      <div className="mt-3 grid gap-2">
        {coDevelopers.map((entry, index) => (
          <div key={`${entry.name}-${index}`} className="grid grid-cols-[1fr_auto] items-center gap-2 border border-stone-200 bg-white p-2">
            <div className="grid gap-1 sm:grid-cols-2 sm:gap-2">
              <span className="text-sm text-stone-800">{entry.name}</span>
              <select
                value={entry.href ?? ""}
                onChange={(event) => {
                  const href = event.target.value;
                  setCoDevelopers((current) => current.map((item, i) => (i === index ? { ...item, href: href || undefined } : item)));
                }}
                className="border border-stone-300 bg-white px-2 py-1 text-xs"
                aria-label={`Destination page for ${entry.name}`}
              >
                <option value="">No page selected</option>
                {destinationOptions.map((developer) => (
                  <option key={developer.slug} value={`/developers/${developer.slug}`}>{developer.name}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setCoDevelopers((current) => current.filter((_, i) => i !== index))}
              className="text-stone-500 hover:text-stone-900"
              aria-label={`Remove ${entry.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex gap-2">
        <input
          value={newName}
          onChange={(event) => setNewName(event.target.value)}
          className="border border-stone-300 bg-white px-3 py-2 text-sm"
          placeholder="Builder name"
        />
        <button
          type="button"
          onClick={() => {
            const trimmed = newName.trim();
            if (!trimmed) return;
            setCoDevelopers((current) => [...current, { name: trimmed }]);
            setNewName("");
          }}
          className="border border-stone-300 bg-white px-3 py-2 text-sm"
        >
          Add builder
        </button>
      </div>
    </div>
  );
}

type OfficeHoursEntryState = { day: typeof weekDays[number]; open: boolean; from: string; to: string };

function OfficeHoursEditor({
  officeHours,
  setOfficeHours,
}: {
  officeHours: OfficeHoursEntryState[];
  setOfficeHours: (updater: (current: OfficeHoursEntryState[]) => OfficeHoursEntryState[]) => void;
}) {
  const updateOfficeHours = (day: string, changes: Partial<{ open: boolean; from: string; to: string }>) => {
    setOfficeHours((current) => current.map((entry) => (entry.day === day ? { ...entry, ...changes } : entry)));
  };

  const applyHoursToAllDays = () => {
    const monday = officeHours[0];
    setOfficeHours((current) => current.map((entry) => ({ ...entry, open: monday.open, from: monday.from, to: monday.to })));
  };

  return (
    <div className="mt-4 border border-stone-200 bg-white p-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-stone-800">Hours of operation</p>
          <p className="mt-1 text-xs text-stone-600">Turn a day on and set its hours. Shown on the Sales Center card, grouped by matching days.</p>
        </div>
        <Button type="button" variant="outline" className="h-8 shrink-0 px-3 text-xs" onClick={applyHoursToAllDays}>Copy Monday to all days</Button>
      </div>
      <div className="mt-3 grid gap-2">
        {officeHours.map((entry) => (
          <div key={entry.day} className="grid grid-cols-[110px_auto_1fr_auto_1fr] items-center gap-2 border border-stone-100 px-2 py-1.5">
            <span className="text-xs font-medium text-stone-800">{entry.day}</span>
            <label className="flex items-center gap-1.5 text-xs text-stone-700">
              <input type="checkbox" checked={entry.open} onChange={(event) => updateOfficeHours(entry.day, { open: event.target.checked })} />
              Open
            </label>
            <input type="time" disabled={!entry.open} value={entry.from} onChange={(event) => updateOfficeHours(entry.day, { from: event.target.value })} className="border border-stone-300 px-2 py-1.5 text-xs disabled:bg-stone-100 disabled:text-stone-400" />
            <span className="text-center text-xs text-stone-500">to</span>
            <input type="time" disabled={!entry.open} value={entry.to} onChange={(event) => updateOfficeHours(entry.day, { to: event.target.value })} className="border border-stone-300 px-2 py-1.5 text-xs disabled:bg-stone-100 disabled:text-stone-400" />
          </div>
        ))}
      </div>
    </div>
  );
}

type FloorPlanDraft = {
  name: string;
  planType: string;
  availability: string;
  status: string;
  beds: string;
  baths: string;
  sqft: string;
  interiorSize: string;
  balconySize: string;
  basement: string;
  garage: string;
  parkingSpaces: string;
  startingPrice: string;
  averagePricePerSqft: string;
  image: string;
  quickMoveIn: boolean;
};

const emptyFloorPlanDraft: FloorPlanDraft = {
  name: "",
  planType: "",
  availability: "",
  status: "",
  beds: "",
  baths: "",
  sqft: "",
  interiorSize: "",
  balconySize: "",
  basement: "",
  garage: "",
  parkingSpaces: "",
  startingPrice: "",
  averagePricePerSqft: "",
  image: "",
  quickMoveIn: false,
};

type VirtualTourDraft = {
  label: string;
  url: string;
};

type MapImageDraft = {
  label: string;
  image: string;
};

type AmenityDetails = {
  description: string;
  image: string;
};

export function DashboardSidebar({ links }: { links: { label: string; href: string }[] }) {
  return (
    <aside className="sticky top-6 box-border min-w-0 w-full self-start border-r border-stone-200 bg-white p-4">
      <nav className="grid gap-2 text-sm">
        {links.map((l) => <Link key={`${l.href}-${l.label}`} href={l.href} className="min-w-0 wrap-break-word border border-stone-200 px-3 py-2">{l.label}</Link>)}
      </nav>
    </aside>
  );
}

export function DashboardHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="space-y-1"><h1 className="text-2xl font-semibold">{title}</h1><p className="text-sm text-stone-600">{subtitle}</p></div>;
}

export function StatCard({ label, value }: { label: string; value: string }) {
  return <article className="border border-stone-200 bg-white p-4"><p className="text-xs uppercase tracking-wide text-stone-500">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></article>;
}

export function DataTable({ columns, rows }: { columns: string[]; rows: string[][] }) {
  return (
    <div className="overflow-x-auto border border-stone-200 bg-white">
      <table className="w-full min-w-190 text-sm">
        <thead className="bg-stone-50"><tr>{columns.map((c) => <th key={c} className="p-3 text-left">{c}</th>)}</tr></thead>
        <tbody>{rows.map((row, i) => <tr key={i} className="border-t border-stone-100">{row.map((cell, j) => <td key={j} className="p-3">{cell}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Modal({ title, open, children }: { title: string; open: boolean; children: React.ReactNode }) {
  if (!open) return null;
  return <div className="fixed inset-0 z-50 grid place-items-center bg-black/30"><div className="w-full max-w-lg border border-stone-200 bg-white p-4"><h3 className="mb-3 text-lg font-semibold">{title}</h3>{children}</div></div>;
}

export function Drawer({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="border border-stone-200 bg-white p-4"><h3 className="mb-3 text-lg font-semibold">{title}</h3>{children}</div>;
}

export function ConfirmationDialog({ label }: { label: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <Button variant="outline" onClick={() => setOpen(true)}>{label}</Button>
      <Modal title="Please confirm" open={open}><p className="text-sm text-stone-700">This is a mock confirmation dialog.</p><div className="mt-3 flex gap-2"><Button onClick={() => setOpen(false)}>Confirm</Button><Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button></div></Modal>
    </div>
  );
}

export function ImageUploader() {
  const [images, setImages] = useState<string[]>(["Primary Image", "Lobby", "Rooftop"]);
  return (
    <div className="space-y-3 border border-stone-200 bg-white p-4">
      <p className="text-sm font-medium">Gallery Management</p>
      <button className="border border-stone-300 px-3 py-2 text-sm">Upload image</button>
      <ul className="grid gap-2">
        {images.map((img, index) => (
          <li key={img} className="flex items-center justify-between border border-stone-200 px-3 py-2 text-sm">
            <span>{img}</span>
            <div className="flex gap-2">
              <button onClick={() => setImages((list) => list.filter((_, i) => i !== index))}>Delete</button>
              <button onClick={() => setImages((list) => list.map((v, i) => (i === index ? `${v} (Primary)` : v)))}>Set primary</button>
            </div>
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-500">Drag and drop reorder behavior is mocked via list order controls.</p>
    </div>
  );
}

export function BuilderProfileForm({ initialDeveloper, redirectTo = "/admin/developers" }: { initialDeveloper?: Developer; redirectTo?: string } = {}) {
  const isEditing = Boolean(initialDeveloper);
  const [name, setName] = useState(initialDeveloper?.name ?? "");
  const [logo, setLogo] = useState(initialDeveloper?.logo ?? "");
  const [description, setDescription] = useState(initialDeveloper?.description ?? "");
  const [location, setLocation] = useState(initialDeveloper?.location ?? "");
  const [establishedYear, setEstablishedYear] = useState(initialDeveloper ? String(initialDeveloper.establishedYear) : "");
  const [yearsInBusiness, setYearsInBusiness] = useState(initialDeveloper ? String(initialDeveloper.yearsInBusiness) : "");
  const [activeProjects, setActiveProjects] = useState(initialDeveloper ? String(initialDeveloper.activeProjects) : "");
  const [completedProjects, setCompletedProjects] = useState(initialDeveloper ? String(initialDeveloper.completedProjects) : "");
  const [website, setWebsite] = useState(initialDeveloper?.website ?? "");
  const [email, setEmail] = useState(initialDeveloper?.email ?? "");
  const [phone, setPhone] = useState(initialDeveloper?.phone ?? "");
  const [coDevelopers, setCoDevelopers] = useState<CoDeveloperEntry[]>(initialDeveloper?.coDevelopers ?? []);
  const [officeHours, setOfficeHours] = useState(buildInitialOfficeHours(initialDeveloper?.officeHours));
  const developerDirectory = useDeveloperDirectory();
  const [facebookUrl, setFacebookUrl] = useState(initialDeveloper?.socialLinks?.facebook ?? "");
  const [instagramUrl, setInstagramUrl] = useState(initialDeveloper?.socialLinks?.instagram ?? "");
  const [linkedinUrl, setLinkedinUrl] = useState(initialDeveloper?.socialLinks?.linkedin ?? "");
  const [twitterUrl, setTwitterUrl] = useState(initialDeveloper?.socialLinks?.twitter ?? "");
  const [whatsappUrl, setWhatsappUrl] = useState(initialDeveloper?.socialLinks?.whatsapp ?? "");
  const [youtubeUrl, setYoutubeUrl] = useState(initialDeveloper?.socialLinks?.youtube ?? "");
  const [tiktokUrl, setTiktokUrl] = useState(initialDeveloper?.socialLinks?.tiktok ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const payload = {
      name,
      logo,
      description,
      location,
      establishedYear: Number(establishedYear),
      yearsInBusiness: Number(yearsInBusiness),
      activeProjects: Number(activeProjects),
      completedProjects: Number(completedProjects),
      website,
      email,
      phone,
      coDevelopers: coDevelopers.filter((entry) => entry.name.trim()),
      officeHours: officeHours.map((entry) => ({ day: entry.day, open: entry.open, from: entry.open ? entry.from : undefined, to: entry.open ? entry.to : undefined })),
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
        ? await fetch(`/api/developers/${initialDeveloper!.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/developers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await response.json().catch(() => null);
      const savedSlug = isEditing ? initialDeveloper!.slug : data?.slug;

      if (!response.ok || !savedSlug) {
        setErrorMessage(data?.error ?? `Unable to ${isEditing ? "save" : "create"} builder profile page.`);
        setSaving(false);
        return;
      }

      window.location.href = isEditing ? redirectTo : redirectTo.replace("{slug}", savedSlug);
    } catch {
      setErrorMessage(`Unable to ${isEditing ? "save" : "create"} builder profile page.`);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Builder name"><input value={name} onChange={(event) => setName(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="e.g. Prime Lands" required /></Field>
        <Field label="Primary location"><input value={location} onChange={(event) => setLocation(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="e.g. Colombo 03" required /></Field>

        <Field label="Logo image URL" className="md:col-span-2"><input value={logo} onChange={(event) => setLogo(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" placeholder="https://..." required /></Field>
        <Field label="Builder description" className="md:col-span-2"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" rows={4} required /></Field>

        <Field label="Website URL"><input value={website} onChange={(event) => setWebsite(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="https://..." required /></Field>
        <Field label="Email"><input value={email} onChange={(event) => setEmail(event.target.value)} type="email" className="border border-stone-300 px-3 py-2 text-sm" required /></Field>

        <Field label="Phone"><input value={phone} onChange={(event) => setPhone(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" required /></Field>
        <Field label="Established year"><input value={establishedYear} onChange={(event) => setEstablishedYear(event.target.value)} type="number" min="1900" step="1" className="border border-stone-300 px-3 py-2 text-sm" required /></Field>

        <Field label="Years in business"><input value={yearsInBusiness} onChange={(event) => setYearsInBusiness(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" required /></Field>
        <Field label="Active projects"><input value={activeProjects} onChange={(event) => setActiveProjects(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" required /></Field>

        <Field label="Completed projects"><input value={completedProjects} onChange={(event) => setCompletedProjects(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm" required /></Field>
      </div>

      <div className="border border-rose-200 bg-rose-50 p-3">
        <p className="text-sm font-medium text-stone-900">Connected Pages</p>
        <p className="mt-1 text-xs text-stone-600">Choose destination pages used on the public listing when users click these names.</p>
        <CoDeveloperEditor
          coDevelopers={coDevelopers}
          setCoDevelopers={setCoDevelopers}
          developerOptions={developerDirectory}
          excludeSlug={initialDeveloper?.slug}
        />
      </div>

      <OfficeHoursEditor officeHours={officeHours} setOfficeHours={setOfficeHours} />

      <div className="border border-sky-200 bg-sky-50 p-3">
        <p className="text-sm font-medium text-stone-900">Social networks</p>
        <p className="mt-1 text-xs text-stone-600">Shown on the public builder page and anywhere this developer is listed. Leave blank to hide.</p>
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
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : "Create Builder Page"}</Button>
      </div>
    </form>
  );
}

export function NeighborhoodForm({ initialNeighborhood }: { initialNeighborhood?: Neighborhood } = {}) {
  const isEditing = Boolean(initialNeighborhood);
  const [name, setName] = useState(initialNeighborhood?.name ?? "");
  const [city, setCity] = useState(initialNeighborhood?.city ?? "");
  const [province, setProvince] = useState(initialNeighborhood?.province ?? "");
  const [description, setDescription] = useState(initialNeighborhood?.description ?? "");
  const [heroImage, setHeroImage] = useState(initialNeighborhood?.heroImage ?? "");
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage("");

    const payload = { name, city, province, description, heroImage };

    try {
      const response = isEditing
        ? await fetch(`/api/neighborhoods/${initialNeighborhood!.slug}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/neighborhoods", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          });

      const data = await response.json().catch(() => null);
      const savedSlug = isEditing ? initialNeighborhood!.slug : data?.slug;

      if (!response.ok || !savedSlug) {
        setErrorMessage(data?.error ?? `Unable to ${isEditing ? "save" : "create"} this neighborhood.`);
        setSaving(false);
        return;
      }

      window.location.href = "/admin/neighborhoods";
    } catch {
      setErrorMessage(`Unable to ${isEditing ? "save" : "create"} this neighborhood.`);
      setSaving(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Neighborhood name"><input value={name} onChange={(event) => setName(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" placeholder="e.g. Thalawathugoda" required /></Field>
        <Field label="City"><input value={city} onChange={(event) => setCity(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" required /></Field>

        <Field label="Province" className="md:col-span-2"><input value={province} onChange={(event) => setProvince(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" required /></Field>
        <Field label="Hero image URL" className="md:col-span-2"><input value={heroImage} onChange={(event) => setHeroImage(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" placeholder="https://..." required /></Field>
        <Field label="Description shown on the public neighborhood page" className="md:col-span-2"><textarea value={description} onChange={(event) => setDescription(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" rows={5} required /></Field>
      </div>

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Project pages link here automatically once a matching neighborhood slug is set.</p>
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : isEditing ? "Save Changes" : "Create Neighborhood"}</Button>
      </div>
    </form>
  );
}

export function ProjectWizard({ initialProject, developerSlug, developerName }: { initialProject?: Project; developerSlug?: string; developerName?: string } = {}) {
  const projectTypeOptions = [
    "Condominium",
    "Apartments",
    "Villas",
    "Mixed Use",
    "Housing",
    "Township Developments",
    "Private Residence",
    "Townhouse",
  ];
  const projectStatusOptions = [
    "Now Selling",
    "Coming Soon",
    "Under Construction",
    "Launching Soon",
    "Nearly Sold Out",
    "Nearly Complete",
  ];
  const ownershipOptions = [
    "Freehold",
    "Leasehold",
    "Condominium",
    "State Grant",
    "State Lease",
    "Permit Land",
    "Co-Ownership",
    "Joint Ownership",
    "Company/Corporate Ownership",
    "Other",
  ];
  const moveInYearOptions = [2026, 2027, 2028, 2029, 2030, 2031, 2032, 2033, 2034, 2035];
  const bedroomOptions = [1, 2, 3, 4, 5];
  const bathroomOptions = [1, 2, 3, 4, 5];
  const architectPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "kirkor-architect-and-planners", label: "Kirkor Architect and Planners" },
    { slug: "cityform-architects", label: "Cityform Architects" },
    { slug: "studio-grid-architecture", label: "Studio Grid Architecture" },
  ];
  const marketingCompanyPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "ora-creative-agency", label: "ORA Creative Agency" },
    { slug: "prime-sales-lanka", label: "Prime Sales Lanka" },
    { slug: "urban-home-marketing", label: "Urban Home Marketing" },
  ];
  const salesCompanyPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "prime-realty-sales", label: "Prime Realty Sales" },
    { slug: "colombo-property-brokers", label: "Colombo Property Brokers" },
    { slug: "island-homes-sales", label: "Island Homes Sales" },
  ];
  const interiorDesignerPageOptions = [
    { slug: "", label: "No page selected" },
    { slug: "pulsinelli", label: "Pulsinelli" },
    { slug: "atelier-habitat", label: "Atelier Habitat" },
    { slug: "spacecraft-interiors", label: "Spacecraft Interiors" },
  ];
  const steps = [
    "Project Information",
    "Location",
    "Pricing",
    "Apartment Details",
    "Amenities",
    "Gallery",
    "Floor Plans",
    "Units",
    "Contact",
    "SEO",
    "Preview",
    "Publish",
  ];
  const statOptions = [
    "Listing status",
    "Move in",
    "Building status",
    "Price range",
    "Address",
    "Total Units",
    "Units sold",
    "Units available",
    "Floor plans",
    "Floors",
    "Property type",
    "Beds",
    "Baths",
    "SqFt",
    "Road",
    "Area",
    "Electricity",
    "Tap water",
    "Per SqFt (Avg)",
    "Incentives",
    "Parking",
    "Carpark levels",
    "Avg unit price",
    "Avg floor area",
    "Ownership",
    "Ceilings",
    "Neighborhood",
    "Security",
    "District",
    "Sales started",
  ];
  const floorPlanStatOptions = ["Status", "Price", "Address", "Project type", "Plan type", "Beds", "Baths", "SqFt", "Ownership", "Interior size", "Basement", "Balcony", "Garage", "Parking", "Ceilings", "Security", "Neighborhood", "Building status", "Per SqFt (Avg)"];
  const maxVisibleStats = 10;
  const [step, setStep] = useState(0);
  const [publishMessage, setPublishMessage] = useState("");
  const [previewVisible, setPreviewVisible] = useState(false);
  const sectionRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const [projectType, setProjectType] = useState(initialProject?.type ?? "");
  const [projectStatus, setProjectStatus] = useState(initialProject?.status ?? "");
  const [ownership, setOwnership] = useState(initialProject?.ownership ?? "");
  const parkingFeatureOptions = ["Driveway", "Garage", "Carport", "On-street", "Laneway/rear access", "Underground", "Surface/open", "Valet/stacked"];
  const [parkingSpaces, setParkingSpaces] = useState("");
  const [parkingFeatures, setParkingFeatures] = useState<string[]>([]);
  const toggleParkingFeature = (feature: string) => {
    setParkingFeatures((current) => (current.includes(feature) ? current.filter((item) => item !== feature) : [...current, feature]));
  };
  const [moveInYear, setMoveInYear] = useState(initialProject ? String(initialProject.completionYear) : "");
  const [constructionStarted, setConstructionStarted] = useState(initialProject?.constructionStarted ?? "");
  const [estimatedCompletion, setEstimatedCompletion] = useState(initialProject ? String(initialProject.completionYear) : "");
  const [province, setProvince] = useState(initialProject?.province ?? "");
  const [district, setDistrict] = useState(initialProject?.district ?? "");
  const [city, setCity] = useState(initialProject?.city ?? "");
  const [neighborhood, setNeighborhood] = useState(initialProject?.neighborhood ?? "");

  const [startingPriceMin, setStartingPriceMin] = useState(initialProject ? String(initialProject.startingPriceLkr) : "");
  const [startingPriceMax, setStartingPriceMax] = useState(initialProject ? String(initialProject.startingPriceLkr) : "");
  const [priceRangeMin, setPriceRangeMin] = useState("");
  const [priceRangeMax, setPriceRangeMax] = useState("");
  const [availableUnitPriceMin, setAvailableUnitPriceMin] = useState("");
  const [availableUnitPriceMax, setAvailableUnitPriceMax] = useState("");
  const [pricePerSqft, setPricePerSqft] = useState(initialProject?.averagePricePerSqft ?? "");
  const [availablePlanPricesMin, setAvailablePlanPricesMin] = useState(initialProject ? String(initialProject.startingPriceLkr) : "");
  const [availablePlanPricesMax, setAvailablePlanPricesMax] = useState("");
  const [pricingComingSoon, setPricingComingSoon] = useState(initialProject?.pricingComingSoon ?? "");
  const [averagePricePerSqft, setAveragePricePerSqft] = useState(initialProject?.averagePricePerSqft ?? "");
  const [averageUnitPriceLkr, setAverageUnitPriceLkr] = useState(initialProject?.averageUnitPriceLkr ? String(initialProject.averageUnitPriceLkr) : "");
  const [carparkLevels, setCarparkLevels] = useState(initialProject?.carparkLevels ? String(initialProject.carparkLevels) : "");
  const [averageFloorAreaSqFt, setAverageFloorAreaSqFt] = useState(initialProject?.averageFloorAreaSqFt ? String(initialProject.averageFloorAreaSqFt) : "");
  const [monthlyMaintenancePerSqft, setMonthlyMaintenancePerSqft] = useState(initialProject?.monthlyMaintenancePerSqft ?? "");
  const [propertyTax, setPropertyTax] = useState(initialProject?.propertyTax ?? "");
  const [parkingCost, setParkingCost] = useState(initialProject?.parkingCost ?? "");
  const [storageCost, setStorageCost] = useState(initialProject?.storageCost ?? "");
  const [coopFeeRealtors, setCoopFeeRealtors] = useState(initialProject?.coopFeeRealtors ?? "");
  const [pricingHistoryDate, setPricingHistoryDate] = useState(initialProject?.pricingHistory?.[0]?.date ?? "");
  const [pricingHistoryNote, setPricingHistoryNote] = useState(initialProject?.pricingHistory?.[0]?.note ?? "");
  const [paymentPlanItems, setPaymentPlanItems] = useState<string[]>(initialProject?.paymentPlanItems ?? initialProject?.depositPaymentStructure?.split(";").map((item) => item.trim()) ?? ["", "", "", ""]);
  const [incentives, setIncentives] = useState<string[]>(initialProject?.incentives ?? []);
  const [isFeatured, setIsFeatured] = useState(initialProject?.isFeatured ?? false);
  const [isMoveInNow, setIsMoveInNow] = useState(initialProject?.isMoveInNow ?? false);
  const [coDevelopers, setCoDevelopers] = useState<CoDeveloperEntry[]>(initialProject?.coDevelopers ?? []);
  const developerDirectory = useDeveloperDirectory();
  const [architectSlug, setArchitectSlug] = useState(initialProject?.architectSlug ?? "");
  const [marketingCompanySlug, setMarketingCompanySlug] = useState(initialProject?.marketingCompanySlug ?? "");
  const [salesCompanySlug, setSalesCompanySlug] = useState(initialProject?.salesCompanySlug ?? "");
  const [interiorDesignerSlug, setInteriorDesignerSlug] = useState(initialProject?.interiorDesignerSlug ?? "");
  const [hotDealEnabled, setHotDealEnabled] = useState(initialProject?.hotDeal?.enabled ?? false);
  const [hotDealBadge, setHotDealBadge] = useState(initialProject?.hotDeal?.badge ?? "Hot Deal");
  const [hotDealTitle, setHotDealTitle] = useState(initialProject?.hotDeal?.title ?? "");
  const [hotDealDescription, setHotDealDescription] = useState(initialProject?.hotDeal?.description ?? "");

  const bedroomRange = initialProject?.bedrooms.split("-").map((value) => value.trim()) ?? [];
  const bathroomRange = initialProject?.bathrooms.split("-").map((value) => value.trim()) ?? [];
  const sqftRange = initialProject?.floorAreaRange.replace(/\s*sq\.ft/i, "").split("-").map((value) => value.replace(/,/g, "").trim()) ?? [];
  const [bedMin, setBedMin] = useState(bedroomRange[0] ?? "");
  const [bedMax, setBedMax] = useState(bedroomRange[1] ?? bedroomRange[0] ?? "");
  const [bathMin, setBathMin] = useState(bathroomRange[0] ?? "");
  const [bathMax, setBathMax] = useState(bathroomRange[1] ?? bathroomRange[0] ?? "");
  const [sqftMin, setSqftMin] = useState(sqftRange[0] ?? "");
  const [sqftMax, setSqftMax] = useState(sqftRange[1] ?? sqftRange[0] ?? "");
  const [floorPlans, setFloorPlans] = useState<FloorPlanDraft[]>([
    ...(initialProject?.floorPlans.map((plan) => ({
      name: plan.planName,
      planType: plan.planType ?? "",
      availability: plan.availability,
      status: plan.availability === "Sold Out" ? "Sold" : "For sale",
      beds: String(plan.bedrooms),
      baths: String(plan.bathrooms),
      sqft: String(plan.floorAreaSqFt),
      interiorSize: plan.interiorSizeSqFt ? String(plan.interiorSizeSqFt) : "",
      balconySize: plan.balconySizeSqFt ? String(plan.balconySizeSqFt) : "",
      basement: plan.basement ?? "",
      garage: plan.garage ?? "",
      parkingSpaces: plan.parkingSpaces ? String(plan.parkingSpaces) : "",
      startingPrice: String(plan.startingPriceLkr),
      averagePricePerSqft: "",
      image: plan.image,
      quickMoveIn: Boolean(plan.quickMoveIn),
    })) ?? [
      { ...emptyFloorPlanDraft },
      { ...emptyFloorPlanDraft },
    ]),
  ]);
  const [videoUrl, setVideoUrl] = useState(initialProject?.videos?.[0]?.embedUrl ?? "");
  const [videoFile, setVideoFile] = useState("");
  const [blockPlanImages, setBlockPlanImages] = useState<MapImageDraft[]>([{ label: "", image: "" }]);
  const [roadMapImages, setRoadMapImages] = useState<MapImageDraft[]>([{ label: "", image: "" }]);
  const [interactiveMapUrl, setInteractiveMapUrl] = useState(initialProject?.interactiveMapUrl ?? "");
  const [virtualTours, setVirtualTours] = useState<VirtualTourDraft[]>(initialProject?.virtualTours ?? []);
  const [brochureUrl, setBrochureUrl] = useState("");
  const amenityOptions = ["Pool", "Infinity Pool", "Gym", "Parking", "Security", "Padel Court", "Resident Lounge", "Private Elevator", "Utility Area", "Outdoor Kitchen", "Garden", "Children's Area", "Clubhouse", "EV Charging", "Concierge", "Games Room", "Sky Lounge", "Retail Mall", "Hotel"];
  const [amenities, setAmenities] = useState<string[]>(initialProject?.amenities.map((amenity) => amenity.name) ?? []);
  const [amenityDetails, setAmenityDetails] = useState<Record<string, AmenityDetails>>(() => Object.fromEntries((initialProject?.amenities ?? []).map((amenity) => [amenity.name, { description: "", image: "" }])));
  const [customAmenity, setCustomAmenity] = useState("");
  const [indoorFeaturesText, setIndoorFeaturesText] = useState((initialProject?.unitFeatures?.indoor ?? []).join("\n"));
  const [outdoorFeaturesText, setOutdoorFeaturesText] = useState((initialProject?.unitFeatures?.outdoor ?? []).join("\n"));
  const [otherFeaturesText, setOtherFeaturesText] = useState((initialProject?.unitFeatures?.other ?? []).join("\n"));

  const [visibleStats, setVisibleStats] = useState<string[]>(initialProject?.desktopVisibleStats ?? [
    "Price range",
    "Property type",
    "Beds",
    "Baths",
    "SqFt",
    "Listing status",
  ]);
  const [floorPlanVisibleStats, setFloorPlanVisibleStats] = useState<string[]>(initialProject?.floorPlanVisibleStats ?? floorPlanStatOptions);

  const [factsGrid, setFactsGrid] = useState<FactItem[]>(initialProject?.factsGrid ?? []);
  const addFactRow = () => setFactsGrid((rows) => [...rows, { key: `fact-${Date.now()}-${rows.length}`, label: "", value: "", icon: "building-2" }]);
  const removeFactRow = (index: number) => setFactsGrid((rows) => rows.filter((_, i) => i !== index));
  const updateFactRow = (index: number, patch: Partial<FactItem>) =>
    setFactsGrid((rows) => rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const addressRef = useRef<HTMLInputElement>(null);
  const unitsRef = useRef<HTMLInputElement>(null);
  const floorsRef = useRef<HTMLInputElement>(null);
  const contactNameRef = useRef<HTMLInputElement>(null);
  const contactEmailRef = useRef<HTMLInputElement>(null);
  const contactPhoneRef = useRef<HTMLInputElement>(null);

  const [nearbyPlaces, setNearbyPlaces] = useState<{ category: string; name: string; distanceKm: string }[]>(
    initialProject?.nearby.map((place) => ({ category: place.category, name: place.name, distanceKm: String(place.distanceKm) })) ?? []
  );
  const nearbyCategoryOptions = ["School", "Hospital", "Shopping", "Restaurant", "Transport", "Landmark"];

  const addNearbyPlace = () => {
    setNearbyPlaces((current) => [...current, { category: "Landmark", name: "", distanceKm: "" }]);
  };

  const updateNearbyPlace = (index: number, field: "category" | "name" | "distanceKm", value: string) => {
    setNearbyPlaces((current) => current.map((place, placeIndex) => (placeIndex === index ? { ...place, [field]: value } : place)));
  };

  const removeNearbyPlace = (index: number) => {
    setNearbyPlaces((current) => current.filter((_, placeIndex) => placeIndex !== index));
  };

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const emptyUnitDraft: Unit = { id: "", projectSlug: "", unitNumber: "", floor: 0, apartmentType: "", bedrooms: 0, areaSqFt: 0, priceLkr: 0, status: "Available" };
  const [units, setUnits] = useState<Unit[]>([]);
  const [unitsLoading, setUnitsLoading] = useState(false);
  const [unitsSaving, setUnitsSaving] = useState(false);
  const [unitsMessage, setUnitsMessage] = useState("");

  useEffect(() => {
    if (!initialProject) return;
    setUnitsLoading(true);
    fetch(`/api/projects/${initialProject.slug}/units`)
      .then((response) => response.json())
      .then((data) => setUnits(data.units ?? []))
      .finally(() => setUnitsLoading(false));
  }, [initialProject]);

  const addUnitRow = () => setUnits((current) => [...current, { ...emptyUnitDraft }]);
  const removeUnitRow = (index: number) => setUnits((current) => current.filter((_, i) => i !== index));
  const updateUnitRow = (index: number, patch: Partial<Unit>) =>
    setUnits((current) => current.map((unit, i) => (i === index ? { ...unit, ...patch } : unit)));

  const saveUnits = async () => {
    if (!initialProject) return;
    setUnitsSaving(true);
    setUnitsMessage("");
    try {
      const response = await fetch(`/api/projects/${initialProject.slug}/units`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ units }),
      });
      const data = await response.json().catch(() => null);
      if (!response.ok) {
        setUnitsMessage(data?.error ?? "Unable to save units.");
        return;
      }
      setUnits(data.units ?? []);
      setUnitsMessage("Units saved.");
    } catch {
      setUnitsMessage("Unable to save units.");
    } finally {
      setUnitsSaving(false);
    }
  };

  const uniqueOptions = (options: string[]) => [...new Set(options)];
  const districtOptions = province ? uniqueOptions(sriLankaDistrictsByProvince[province] ?? []) : [];
  const cityOptions = district ? uniqueOptions(sriLankaCitiesByDistrict[district] ?? []) : [];
  const neighborhoodOptions = city ? uniqueOptions(sriLankaNeighborhoodsByCity[city] ?? [city]) : [];

  const toggleStat = (stat: string) => {
    setVisibleStats((current) => {
      if (current.includes(stat)) {
        return current.filter((value) => value !== stat);
      }

      if (current.length >= maxVisibleStats) {
        return current;
      }

      return [...current, stat];
    });
  };

  const toggleFloorPlanStat = (stat: string) => {
    setFloorPlanVisibleStats((current) => current.includes(stat) ? current.filter((value) => value !== stat) : [...current, stat]);
  };

  const getRangeError = (min: string, max: string, label: string) => {
    if (!min || !max) {
      return null;
    }

    if (Number(max) < Number(min)) {
      return `${label}: max must be greater than or equal to min.`;
    }

    return null;
  };

  const startingPriceError = getRangeError(startingPriceMin, startingPriceMax, "Starting price");
  const priceRangeError = getRangeError(priceRangeMin, priceRangeMax, "Price range");
  const availableUnitPriceError = getRangeError(availableUnitPriceMin, availableUnitPriceMax, "Available unit price");
  const sqftRangeError = getRangeError(sqftMin, sqftMax, "SqFt range");

  const formHasErrors = Boolean(startingPriceError || priceRangeError || availableUnitPriceError || sqftRangeError);

  const bedMaxOptions = bedroomOptions.filter((value) => !bedMin || value >= Number(bedMin));
  const bathMaxOptions = bathroomOptions.filter((value) => !bathMin || value >= Number(bathMin));

  const normalizedBedRange = bedMin && bedMax ? `${bedMin}-${bedMax}` : "Not set";
  const normalizedBathRange = bathMin && bathMax ? `${bathMin}-${bathMax}` : "Not set";
  const normalizedSqftRange = sqftMin && sqftMax ? `${sqftMin}-${sqftMax}` : "Not set";
  const normalizedPriceRange = priceRangeMin && priceRangeMax ? `${priceRangeMin}-${priceRangeMax}` : "Not set";
  const normalizedAvailableRange = availableUnitPriceMin && availableUnitPriceMax ? `${availableUnitPriceMin}-${availableUnitPriceMax}` : "Not set";
  const normalizedAvailablePlanPrices = availablePlanPricesMin && availablePlanPricesMax
    ? `${availablePlanPricesMin}-${availablePlanPricesMax}`
    : "Not set";

  const addIncentive = () => {
    setIncentives((current) => [...current, ""]);
  };

  const updateIncentive = (index: number, value: string) => {
    setIncentives((current) => current.map((entry, idx) => (idx === index ? value : entry)));
  };

  const removeIncentive = (index: number) => {
    setIncentives((current) => {
      if (current.length === 0) {
        return current;
      }
      return current.filter((_, idx) => idx !== index);
    });
  };

  const updatePaymentPlanItem = (index: number, value: string) => {
    setPaymentPlanItems((current) => current.map((item, itemIndex) => itemIndex === index ? value : item));
  };

  const addPaymentPlanItem = () => {
    setPaymentPlanItems((current) => [...current, ""]);
  };

  const removePaymentPlanItem = (index: number) => {
    setPaymentPlanItems((current) => current.length <= 1 ? current : current.filter((_, itemIndex) => itemIndex !== index));
  };

  const updateFloorPlan = (index: number, field: keyof FloorPlanDraft, value: string | boolean) => {
    setFloorPlans((current) => current.map((plan, planIndex) => (
      planIndex === index ? { ...plan, [field]: value } : plan
    )));
  };

  const addFloorPlan = () => {
    setFloorPlans((current) => [...current, { ...emptyFloorPlanDraft }]);
  };

  const addVirtualTour = () => {
    setVirtualTours((current) => [...current, { label: "", url: "" }]);
  };

  const updateVirtualTour = (index: number, field: keyof VirtualTourDraft, value: string) => {
    setVirtualTours((current) => current.map((tour, tourIndex) => (
      tourIndex === index ? { ...tour, [field]: value } : tour
    )));
  };

  const removeVirtualTour = (index: number) => {
    setVirtualTours((current) => current.filter((_, tourIndex) => tourIndex !== index));
  };

  const updateUploadedImage = (file: File | undefined, setter: (value: string) => void) => {
    if (file) {
      setter(URL.createObjectURL(file));
    }
  };

  const updateMapImage = (type: "block" | "road", index: number, field: keyof MapImageDraft, value: string) => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => current.map((entry, entryIndex) => (
      entryIndex === index ? { ...entry, [field]: value } : entry
    )));
  };

  const addMapImage = (type: "block" | "road") => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => [...current, { label: "", image: "" }]);
  };

  const removeMapImage = (type: "block" | "road", index: number) => {
    const setter = type === "block" ? setBlockPlanImages : setRoadMapImages;
    setter((current) => current.length === 1 ? current : current.filter((_, entryIndex) => entryIndex !== index));
  };

  const toggleAmenity = (amenity: string) => {
    setAmenities((current) => current.includes(amenity) ? current.filter((item) => item !== amenity) : [...current, amenity]);
    setAmenityDetails((current) => current[amenity] ? current : { ...current, [amenity]: { description: "", image: "" } });
  };

  const addCustomAmenity = () => {
    const value = customAmenity.trim();
    if (value && !amenities.includes(value)) {
      setAmenities((current) => [...current, value]);
      setAmenityDetails((current) => ({ ...current, [value]: { description: "", image: "" } }));
      setCustomAmenity("");
    }
  };

  const updateAmenityDetail = (amenity: string, field: keyof AmenityDetails, value: string) => {
    setAmenityDetails((current) => ({ ...current, [amenity]: { ...(current[amenity] ?? { description: "", image: "" }), [field]: value } }));
  };

  const selectStep = (index: number) => {
    setStep(index);
    window.requestAnimationFrame(() => {
      sectionRefs.current[index]?.scrollIntoView({ block: "start" });
    });
  };

  const buildPayload = (): Partial<Project> & { name: string; developerSlug: string; developerName: string } => {
    const resolvedDeveloperSlug = developerSlug ?? initialProject?.developerSlug ?? "";
    const resolvedDeveloperName = developerName ?? initialProject?.developerName ?? "";

    const payload: Partial<Project> & { name: string; developerSlug: string; developerName: string } = {
      name: nameRef.current?.value || initialProject?.name || "Untitled project",
      developerSlug: resolvedDeveloperSlug,
      developerName: resolvedDeveloperName,
      description: descriptionRef.current?.value || initialProject?.description || "",
      location: addressRef.current?.value || initialProject?.location || "",
      type: projectType || initialProject?.type || "",
      status: (projectStatus || initialProject?.status || "Now Selling") as Project["status"],
      ownership: ownership || initialProject?.ownership || "",
      isFeatured,
      isMoveInNow,
      coDevelopers: coDevelopers.filter((entry) => entry.name.trim()),
      architectSlug: architectSlug || undefined,
      architectName: architectSlug ? architectPageOptions.find((option) => option.slug === architectSlug)?.label : undefined,
      marketingCompanySlug: marketingCompanySlug || undefined,
      marketingCompanyName: marketingCompanySlug ? marketingCompanyPageOptions.find((option) => option.slug === marketingCompanySlug)?.label : undefined,
      salesCompanySlug: salesCompanySlug || undefined,
      salesCompanyName: salesCompanySlug ? salesCompanyPageOptions.find((option) => option.slug === salesCompanySlug)?.label : undefined,
      interiorDesignerSlug: interiorDesignerSlug || undefined,
      interiorDesignerName: interiorDesignerSlug ? interiorDesignerPageOptions.find((option) => option.slug === interiorDesignerSlug)?.label : undefined,
      constructionStatus: initialProject?.constructionStatus ?? "",
      constructionStarted: constructionStarted || undefined,
      completionYear: Number(moveInYear || estimatedCompletion || initialProject?.completionYear || 0),
      province,
      district,
      city,
      neighborhood,
      startingPriceLkr: Number(startingPriceMin || initialProject?.startingPriceLkr || 0),
      priceRange: normalizedPriceRange !== "Not set" ? normalizedPriceRange : (initialProject?.priceRange ?? ""),
      bedrooms: normalizedBedRange !== "Not set" ? normalizedBedRange : (initialProject?.bedrooms ?? ""),
      bathrooms: normalizedBathRange !== "Not set" ? normalizedBathRange : (initialProject?.bathrooms ?? ""),
      floorAreaRange: normalizedSqftRange !== "Not set" ? normalizedSqftRange : (initialProject?.floorAreaRange ?? ""),
      units: Number(unitsRef.current?.value || initialProject?.units || 0),
      floors: Number(floorsRef.current?.value || initialProject?.floors || 0),
      parking: (parkingSpaces || parkingFeatures.length > 0)
        ? `${parkingSpaces || "0"} space${parkingSpaces === "1" ? "" : "s"}${parkingFeatures.length > 0 ? ` (${parkingFeatures.join(", ")})` : ""}`
        : initialProject?.parking || "",
      averagePricePerSqft: averagePricePerSqft || undefined,
      averageUnitPriceLkr: averageUnitPriceLkr ? Number(averageUnitPriceLkr) : undefined,
      carparkLevels: carparkLevels ? Number(carparkLevels) : undefined,
      averageFloorAreaSqFt: averageFloorAreaSqFt ? Number(averageFloorAreaSqFt) : undefined,
      monthlyMaintenancePerSqft: monthlyMaintenancePerSqft || undefined,
      propertyTax: propertyTax || undefined,
      parkingCost: parkingCost || undefined,
      storageCost: storageCost || undefined,
      coopFeeRealtors: coopFeeRealtors || undefined,
      availablePlanPrices: normalizedAvailablePlanPrices !== "Not set" ? normalizedAvailablePlanPrices : undefined,
      pricingComingSoon: pricingComingSoon || undefined,
      depositPaymentStructure: paymentPlanItems.filter((item) => item.trim()).join("; ") || undefined,
      paymentPlanItems: paymentPlanItems.filter((item) => item.trim()),
      pricingHistory: pricingHistoryDate && pricingHistoryNote ? [{ date: pricingHistoryDate, note: pricingHistoryNote }] : undefined,
      incentives: incentives.filter((item) => item.trim()),
      hotDeal: hotDealTitle.trim()
        ? { enabled: hotDealEnabled, badge: hotDealBadge.trim() || "Hot Deal", title: hotDealTitle.trim(), description: hotDealDescription.trim() }
        : undefined,
      amenities: amenities.map((name) => ({ name: name as Amenity["name"], icon: name.toLowerCase().replace(/[^a-z0-9]+/g, "-") })),
      unitFeatures: {
        indoor: indoorFeaturesText.split("\n").map((line) => line.trim()).filter(Boolean),
        outdoor: outdoorFeaturesText.split("\n").map((line) => line.trim()).filter(Boolean),
        other: otherFeaturesText.split("\n").map((line) => line.trim()).filter(Boolean),
      },
      floorPlans: floorPlans
        .filter((plan) => plan.name.trim())
        .map((plan, index) => ({
          id: initialProject?.floorPlans[index]?.id ?? `${toWizardSlug(plan.name)}-${index}`,
          planName: plan.name,
          planType: plan.planType || undefined,
          bedrooms: Number(plan.beds || 0),
          bathrooms: Number(plan.baths || 0),
          floorAreaSqFt: Number(plan.sqft || 0),
          interiorSizeSqFt: plan.interiorSize ? Number(plan.interiorSize) : undefined,
          balconySizeSqFt: plan.balconySize ? Number(plan.balconySize) : undefined,
          basement: plan.basement || undefined,
          garage: plan.garage || undefined,
          parkingSpaces: plan.parkingSpaces ? Number(plan.parkingSpaces) : undefined,
          startingPriceLkr: Number(plan.startingPrice || 0),
          image: plan.image || initialProject?.floorPlans[index]?.image || "",
          availability: (plan.availability || "Available") as FloorPlan["availability"],
          quickMoveIn: plan.quickMoveIn,
        })),
      nearby: nearbyPlaces
        .filter((place) => place.name.trim())
        .map((place) => ({ category: place.category as Project["nearby"][number]["category"], name: place.name, distanceKm: Number(place.distanceKm || 0) })),
      interactiveMapUrl: interactiveMapUrl || undefined,
      virtualTours: virtualTours.filter((tour) => tour.label.trim() && tour.url.trim()),
      videos: videoUrl ? [{ label: "Video", embedUrl: videoUrl }] : undefined,
      contact: {
        name: contactNameRef.current?.value || initialProject?.contact.name || "",
        email: contactEmailRef.current?.value || initialProject?.contact.email || "",
        phone: contactPhoneRef.current?.value || initialProject?.contact.phone || "",
      },
      desktopVisibleStats: visibleStats as Project["desktopVisibleStats"],
      floorPlanVisibleStats,
      factsGrid: factsGrid.filter((fact) => fact.label.trim() && fact.value.trim()),
    };

    return payload;
  };

  const handleSaveOrPublish = async (mode: "save" | "publish" = "save") => {
    setSaving(true);
    setSaveError("");
    setPublishMessage("");

    try {
      const payload = buildPayload();

      if (initialProject) {
        const response = await fetch(`/api/projects/${initialProject.slug}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok) {
          setSaveError(data?.error ?? "Unable to save changes.");
          return;
        }
        setPublishMessage(mode === "publish" ? "Project published." : "Project changes saved.");
      } else {
        if (!payload.developerSlug) {
          setSaveError("Missing developer context — open this wizard from a developer's Projects page.");
          return;
        }
        const response = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await response.json().catch(() => null);
        if (!response.ok || !data?.slug) {
          setSaveError(data?.error ?? "Unable to publish this project.");
          return;
        }
        window.location.href = `/projects/${data.slug}`;
        return;
      }
    } catch {
      setSaveError("Unable to save changes.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="grid min-w-0 w-full gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
      <aside className="border border-stone-200 bg-white p-3 lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto">
        <ol className="grid gap-2 text-sm">
          {steps.map((s, idx) => (
            <li key={s}>
              <button type="button" onClick={() => selectStep(idx)} className={`w-full border px-2 py-2 text-left ${step === idx ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200"}`}>
                {idx + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="box-border min-w-0 w-full space-y-4 border border-stone-200 bg-white p-4">
          <h2 className="text-xl font-semibold">{steps[step]}</h2>
          <div className="grid gap-3 md:grid-cols-2">
            <div ref={(element) => { sectionRefs.current[0] = element; }} className="md:col-span-2 border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-stone-900">Project Information</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Project Name"><input ref={nameRef} defaultValue={initialProject?.name} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" required /></Field>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Project Type</span>
                  <select value={projectType} onChange={(event) => setProjectType(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select project type</option>
                    {projectTypeOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Ownership</span>
                  <select value={ownership} onChange={(event) => setOwnership(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select ownership type</option>
                    {ownershipOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <Field label="Description" className="md:col-span-2"><textarea ref={descriptionRef} defaultValue={initialProject?.description} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" rows={4} required /></Field>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Listing Status</span>
                  <select value={projectStatus} onChange={(event) => setProjectStatus(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select listing status</option>
                    {projectStatusOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Move-in Year</span>
                  <select value={moveInYear} onChange={(event) => setMoveInYear(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select move-in year</option>
                    {moveInYearOptions.map((option) => (
                      <option key={option} value={String(option)}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Construction Started</span>
                  <input type="month" value={constructionStarted} onChange={(event) => setConstructionStarted(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Estimated Completion</span>
                  <select value={estimatedCompletion} onChange={(event) => setEstimatedCompletion(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    <option value="">Select estimated completion</option>
                    {moveInYearOptions.map((option) => <option key={`completion-${option}`} value={String(option)}>{option}</option>)}
                  </select>
                </label>
              </div>
            </div>

            <div className="md:col-span-2 border border-slate-200 bg-slate-50 p-3">
              <p className="text-sm font-medium text-stone-900">Badges</p>
              <p className="mt-1 text-xs text-stone-600">Shown as pills on the listing page and floor plan page.</p>
              <div className="mt-3 flex flex-wrap gap-4 text-sm text-stone-800">
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isMoveInNow} onChange={(event) => setIsMoveInNow(event.target.checked)} />
                  Move-In Now
                </label>
                <label className="flex items-center gap-2">
                  <input type="checkbox" checked={isFeatured} onChange={(event) => setIsFeatured(event.target.checked)} />
                  Featured
                </label>
                <p className="text-xs text-stone-500">
                  Quick Move-In is set per floor plan below, in the Plans &amp; Homes section.
                </p>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[1] = element; }} className="md:col-span-2 border border-emerald-200 bg-emerald-50 p-3">
              <p className="text-sm font-medium text-stone-900">Location</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <Field label="Address"><input ref={addressRef} defaultValue={initialProject?.location} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" required /></Field>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Province</span>
                  <select
                    value={province}
                    onChange={(event) => {
                      setProvince(event.target.value);
                      setDistrict("");
                      setCity("");
                      setNeighborhood("");
                    }}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="">Select province</option>
                    {sriLankaProvinces.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>District</span>
                  <select
                    value={district}
                    onChange={(event) => {
                      setDistrict(event.target.value);
                      setCity("");
                      setNeighborhood("");
                    }}
                    disabled={!province}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select district</option>
                    {districtOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>City</span>
                  <select
                    value={city}
                    onChange={(event) => {
                      setCity(event.target.value);
                      setNeighborhood("");
                    }}
                    disabled={!district}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select city</option>
                    {cityOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Neighborhood</span>
                  <select
                    value={neighborhood}
                    onChange={(event) => setNeighborhood(event.target.value)}
                    disabled={!city}
                    className="border border-stone-300 bg-white px-3 py-2 text-sm disabled:bg-stone-100 disabled:text-stone-500"
                  >
                    <option value="">Select neighborhood</option>
                    {neighborhoodOptions.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="mt-4 border border-stone-200 bg-white p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-stone-800">Nearby places</p>
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addNearbyPlace}>Add place</Button>
                </div>
                <p className="mt-1 text-xs text-stone-600">Shown in the public Neighborhood section on this project's page.</p>
                <div className="mt-3 grid gap-2">
                  {nearbyPlaces.map((place, index) => (
                    <div key={`nearby-${index}`} className="grid gap-2 md:grid-cols-[140px_1fr_110px_auto]">
                      <select value={place.category} onChange={(event) => updateNearbyPlace(index, "category", event.target.value)} className="border border-stone-300 bg-white px-2 py-2 text-sm">
                        {nearbyCategoryOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                      <input value={place.name} onChange={(event) => updateNearbyPlace(index, "name", event.target.value)} className="border border-stone-300 px-2 py-2 text-sm" placeholder="Place name" />
                      <input value={place.distanceKm} onChange={(event) => updateNearbyPlace(index, "distanceKm", event.target.value)} type="number" min="0" step="0.1" className="border border-stone-300 px-2 py-2 text-sm" placeholder="Distance (km)" />
                      <Button type="button" variant="outline" className="h-9 px-3 text-xs" onClick={() => removeNearbyPlace(index)}>Remove</Button>
                    </div>
                  ))}
                  {nearbyPlaces.length === 0 ? <p className="text-xs text-stone-500">No nearby places added yet.</p> : null}
                </div>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[2] = element; }} className="md:col-span-2 border border-amber-200 bg-amber-50 p-3">
              <p className="text-sm font-medium text-stone-900">Pricing</p>
              <p className="mt-1 text-xs text-stone-600">Use min and max values only. This keeps all listings consistently formatted.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Starting Price (LKR)</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={startingPriceMin} onChange={(event) => setStartingPriceMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={startingPriceMax} onChange={(event) => setStartingPriceMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {startingPriceError ? <span className="text-xs text-red-600">{startingPriceError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Price Range (LKR)</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={priceRangeMin} onChange={(event) => setPriceRangeMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={priceRangeMax} onChange={(event) => setPriceRangeMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {priceRangeError ? <span className="text-xs text-red-600">{priceRangeError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span className="inline-flex items-center gap-1">
                    Available Unit Price (LKR)
                    <InfoTooltip text="Live pricing for unsold units only — excludes sold-out units from the range." />
                  </span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={availableUnitPriceMin} onChange={(event) => setAvailableUnitPriceMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={availableUnitPriceMax} onChange={(event) => setAvailableUnitPriceMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {availableUnitPriceError ? <span className="text-xs text-red-600">{availableUnitPriceError}</span> : null}
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Price per SqFt (LKR)</span>
                  <input type="number" min="0" step="1" value={pricePerSqft} onChange={(event) => setPricePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Single value" />
                </label>
              </div>
            </div>

            <div className="md:col-span-2 border border-sky-200 bg-sky-50 p-3">
              <p className="text-sm font-medium text-stone-900">Pricing and Fees</p>
              <p className="mt-1 text-xs text-stone-600">Manage available plan pricing, fees, payment structure, and incentives shown in the public pricing section.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Available plan prices</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <label className="grid min-w-0 gap-1 text-xs text-stone-600">
                      <span>From</span>
                      <input type="number" min="0" step="1" value={availablePlanPricesMin} onChange={(event) => setAvailablePlanPricesMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <span className="text-stone-500">to</span>
                    <label className="grid min-w-0 gap-1 text-xs text-stone-600">
                      <span>To</span>
                      <input type="number" min="0" step="1" value={availablePlanPricesMax} onChange={(event) => setAvailablePlanPricesMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Pricing</span>
                  <input value={pricingComingSoon} onChange={(event) => setPricingComingSoon(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Average price per sqft</span>
                  <input value={averagePricePerSqft} onChange={(event) => setAveragePricePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Average unit price (LKR, optional — distinct from the starting/lowest price above)</span>
                  <input type="number" min="0" step="1" value={averageUnitPriceLkr} onChange={(event) => setAverageUnitPriceLkr(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Monthly C.C./maint per sqft</span>
                  <input value={monthlyMaintenancePerSqft} onChange={(event) => setMonthlyMaintenancePerSqft(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Property tax</span>
                  <input value={propertyTax} onChange={(event) => setPropertyTax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Parking cost</span>
                  <input value={parkingCost} onChange={(event) => setParkingCost(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Storage cost</span>
                  <input value={storageCost} onChange={(event) => setStorageCost(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Co-op fee realtors</span>
                  <input value={coopFeeRealtors} onChange={(event) => setCoopFeeRealtors(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                </label>

                <div className="grid gap-3 border border-stone-200 bg-white p-3 md:col-span-2">
                  <p className="text-sm font-medium text-stone-900">Payment Structure</p>
                  <div className="grid gap-2">
                    <p className="text-xs text-stone-700">Payment structure</p>
                    {paymentPlanItems.map((item, index) => (
                      <div key={`payment-plan-item-${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <input value={item} onChange={(event) => updatePaymentPlanItem(index, event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder={`Payment line ${index + 1}`} />
                        {paymentPlanItems.length > 1 ? <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => removePaymentPlanItem(index)}>Remove</Button> : null}
                      </div>
                    ))}
                    <Button type="button" variant="outline" className="h-8 w-fit px-3 text-xs" onClick={addPaymentPlanItem}>Add payment line</Button>
                  </div>
                  <div className="grid gap-3">
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Pricing history date</span>
                      <input type="date" value={pricingHistoryDate} onChange={(event) => setPricingHistoryDate(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" />
                    </label>
                    <label className="grid gap-1 text-xs text-stone-700">
                      <span>Pricing History Information</span>
                      <textarea value={pricingHistoryNote} onChange={(event) => setPricingHistoryNote(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" rows={3} />
                    </label>
                  </div>
                </div>

                <div className="md:col-span-2 border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-stone-800">Current incentives</p>
                    <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addIncentive}>Add incentive</Button>
                  </div>
                  <p className="mt-1 text-xs text-stone-600">Add incentives as needed.</p>
                  <div className="mt-3 grid gap-2">
                    {incentives.map((incentive, index) => (
                      <div key={`incentive-${index}`} className="grid gap-2 md:grid-cols-[1fr_auto]">
                        <input
                          value={incentive}
                          onChange={(event) => updateIncentive(index, event.target.value)}
                          className="border border-stone-300 px-3 py-2 text-sm"
                          placeholder={`Incentive ${index + 1}`}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="h-10 px-3 text-xs"
                          onClick={() => removeIncentive(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="md:col-span-2 border border-stone-200 bg-white p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold text-stone-800">Hot deal banner</p>
                      <p className="mt-1 text-xs text-stone-600">Shown below the nav on this project's page, plus a &quot;Hot Deal&quot; pill next to the status tags.</p>
                    </div>
                    <label className="flex shrink-0 items-center gap-2 border border-stone-300 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-800">
                      <input type="checkbox" checked={hotDealEnabled} onChange={(event) => setHotDealEnabled(event.target.checked)} />
                      {hotDealEnabled ? "On" : "Off"}
                    </label>
                  </div>
                  <div className="mt-3 grid gap-2 md:grid-cols-2">
                    <Field label="Badge label"><input disabled={!hotDealEnabled} value={hotDealBadge} onChange={(event) => setHotDealBadge(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full disabled:bg-stone-100 disabled:text-stone-400" placeholder="e.g. Hot Deal" /></Field>
                    <Field label="Title"><input disabled={!hotDealEnabled} value={hotDealTitle} onChange={(event) => setHotDealTitle(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full disabled:bg-stone-100 disabled:text-stone-400" placeholder="e.g. Summer Madness" /></Field>
                    <Field label="Deal description" className="md:col-span-2"><textarea disabled={!hotDealEnabled} value={hotDealDescription} onChange={(event) => setHotDealDescription(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full disabled:bg-stone-100 disabled:text-stone-400" rows={3} /></Field>
                  </div>
                </div>
              </div>
            </div>

            <div ref={(element) => { sectionRefs.current[3] = element; }} className="md:col-span-2 border border-cyan-200 bg-cyan-50 p-3">
              <p className="text-sm font-medium text-stone-900">Apartment Details</p>
              <p className="mt-1 text-xs text-stone-600">Select ranges from dropdowns so values remain clean and consistent on listing cards.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Bed Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <select
                      value={bedMin}
                      onChange={(event) => {
                        const nextMin = event.target.value;
                        setBedMin(nextMin);
                        if (bedMax && nextMin && Number(bedMax) < Number(nextMin)) {
                          setBedMax("");
                        }
                      }}
                      className="border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">From</option>
                      {bedroomOptions.map((option) => (
                        <option key={`bed-min-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                    <span className="text-stone-500">to</span>
                    <select value={bedMax} onChange={(event) => setBedMax(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                      <option value="">To</option>
                      {bedMaxOptions.map((option) => (
                        <option key={`bed-max-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Bath Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <select
                      value={bathMin}
                      onChange={(event) => {
                        const nextMin = event.target.value;
                        setBathMin(nextMin);
                        if (bathMax && nextMin && Number(bathMax) < Number(nextMin)) {
                          setBathMax("");
                        }
                      }}
                      className="border border-stone-300 bg-white px-3 py-2 text-sm"
                    >
                      <option value="">From</option>
                      {bathroomOptions.map((option) => (
                        <option key={`bath-min-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                    <span className="text-stone-500">to</span>
                    <select value={bathMax} onChange={(event) => setBathMax(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                      <option value="">To</option>
                      {bathMaxOptions.map((option) => (
                        <option key={`bath-max-${option}`} value={String(option)}>{option}</option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span className="font-medium text-stone-900">SqFt Range</span>
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2">
                    <input type="number" min="0" step="1" value={sqftMin} onChange={(event) => setSqftMin(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Min" />
                    <span className="text-stone-500">to</span>
                    <input type="number" min="0" step="1" value={sqftMax} onChange={(event) => setSqftMax(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Max" />
                  </div>
                  {sqftRangeError ? <span className="text-xs text-red-600">{sqftRangeError}</span> : null}
                </label>

                <Field label="Number of Units" className="md:col-span-2"><input ref={unitsRef} defaultValue={initialProject ? String(initialProject.units) : undefined} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
              </div>
            </div>

            <div className="md:col-span-2 border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm font-medium text-stone-900">Floor Plan Info</p>
              <p className="mt-1 text-xs text-stone-600">Add at least two floor plans with core details for listing cards.</p>
              <div className="mt-3 grid gap-3">
                {floorPlans.map((plan, index) => (
                  <div key={`floor-plan-${index}`} className="border border-stone-200 bg-white p-3">
                    <p className="text-xs font-semibold text-stone-800">Floor Plan {index + 1}</p>
                    <div className="mt-2 grid gap-3 md:grid-cols-2">
                      <Field label="Plan name"><input value={plan.name} onChange={(event) => updateFloorPlan(index, "name", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Plan type">
                        <select value={plan.planType} onChange={(event) => updateFloorPlan(index, "planType", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          <option value="Open Floor Plan">Open Floor Plan</option>
                          <option value="Closed Floor Plan">Closed Floor Plan</option>
                          <option value="Split-Level Floor Plan">Split-Level Floor Plan</option>
                          <option value="Ranch Floor Plan">Ranch Floor Plan</option>
                          <option value="Multi-Story Floor Plan">Multi-Story Floor Plan</option>
                          <option value="Courtyard Floor Plan">Courtyard Floor Plan</option>
                          <option value="Studio Floor Plan">Studio Floor Plan</option>
                        </select>
                      </Field>
                      <Field label="Availability">
                        <select value={plan.availability} onChange={(event) => updateFloorPlan(index, "availability", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          <option value="Available">Available</option>
                          <option value="Limited">Limited</option>
                          <option value="Sold Out">Sold Out</option>
                        </select>
                      </Field>
                      <Field label="Status">
                        <select value={plan.status} onChange={(event) => updateFloorPlan(index, "status", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          <option value="For sale">For sale</option>
                          <option value="Under construction">Under construction</option>
                          <option value="Sold">Sold</option>
                          <option value="Coming soon">Coming soon</option>
                        </select>
                      </Field>
                      <label className="flex items-center gap-2 border border-stone-200 bg-stone-50 px-3 py-2 text-sm md:col-span-2">
                        <input type="checkbox" checked={plan.quickMoveIn} onChange={(event) => updateFloorPlan(index, "quickMoveIn", event.target.checked)} />
                        <span>Show as Quick Move-In</span>
                      </label>
                      <Field label="Beds"><input type="number" min="0" step="1" value={plan.beds} onChange={(event) => updateFloorPlan(index, "beds", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Baths"><input type="number" min="0" step="1" value={plan.baths} onChange={(event) => updateFloorPlan(index, "baths", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="SqFt"><input type="number" min="0" step="1" value={plan.sqft} onChange={(event) => updateFloorPlan(index, "sqft", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Interior size (sq ft)"><input type="number" min="0" step="1" value={plan.interiorSize} onChange={(event) => updateFloorPlan(index, "interiorSize", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Balcony size (sq ft)"><input type="number" min="0" step="1" value={plan.balconySize} onChange={(event) => updateFloorPlan(index, "balconySize", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Basement">
                        <select value={plan.basement} onChange={(event) => updateFloorPlan(index, "basement", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          <option value="None">None</option>
                          <option value="Unfinished">Unfinished</option>
                          <option value="Finished">Finished</option>
                        </select>
                      </Field>
                      <Field label="Garage">
                        <select value={plan.garage} onChange={(event) => updateFloorPlan(index, "garage", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          <option value="None">None</option>
                          <option value="Attached">Attached</option>
                          <option value="Detached">Detached</option>
                          <option value="Carport">Carport</option>
                        </select>
                      </Field>
                      <Field label="Parking spaces">
                        <select value={plan.parkingSpaces} onChange={(event) => updateFloorPlan(index, "parkingSpaces", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full">
                          <option value="">Select</option>
                          {[0, 1, 2, 3, 4, 5, 6].map((count) => (
                            <option key={count} value={count}>{count}</option>
                          ))}
                        </select>
                      </Field>
                      <Field label="Starting price (LKR)"><input type="number" min="0" step="1" value={plan.startingPrice} onChange={(event) => updateFloorPlan(index, "startingPrice", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <Field label="Average price per SqFt (LKR)"><input type="number" min="0" step="1" value={plan.averagePricePerSqft} onChange={(event) => updateFloorPlan(index, "averagePricePerSqft", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      <label className="grid gap-1 text-xs text-stone-700 md:col-span-2">
                        <span>Upload floor plan image</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) {
                              updateFloorPlan(index, "image", URL.createObjectURL(file));
                            }
                          }}
                          className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm"
                        />
                      </label>
                      <Field label="Floor plan image URL" className="md:col-span-2"><input value={plan.image} onChange={(event) => updateFloorPlan(index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                      {plan.image ? <Image src={plan.image} alt={`Floor Plan ${index + 1} preview`} width={640} height={320} unoptimized className="h-32 w-full object-contain border border-stone-200 bg-stone-50 md:col-span-2" /> : null}
                    </div>
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" className="mt-3" onClick={addFloorPlan}>Add floor plan</Button>
              <div className="mt-4 border border-purple-300 bg-purple-100 p-3">
                <p className="text-sm font-medium text-stone-900">Floor plan icon info visibility</p>
                <p className="mt-1 text-xs text-stone-600">Choose which filled floor-plan details appear as icons on the floor plan page.</p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                  {floorPlanStatOptions.map((stat) => (
                    <label key={`floor-plan-stat-${stat}`} className="flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs text-stone-700">
                      <input type="checkbox" checked={floorPlanVisibleStats.includes(stat)} onChange={() => toggleFloorPlanStat(stat)} />
                      <span>{stat}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <Field label="Number of Floors"><input ref={floorsRef} defaultValue={initialProject ? String(initialProject.floors) : undefined} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
            <Field label="Carpark levels (optional)"><input value={carparkLevels} onChange={(event) => setCarparkLevels(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
            <Field label="Average floor area, sq ft (optional)"><input value={averageFloorAreaSqFt} onChange={(event) => setAverageFloorAreaSqFt(event.target.value)} type="number" min="0" step="1" className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>

            <div className="md:col-span-2 mt-2 grid gap-3 border border-stone-200 bg-white p-3">
              <p className="text-sm font-medium text-stone-900">Parking</p>
              <select value={parkingSpaces} onChange={(event) => setParkingSpaces(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                <option value="">How many parking spaces?</option>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
              <p className="text-xs text-stone-600">Parking type (select all that apply). EV charging is set under Amenities.</p>
              <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                {parkingFeatureOptions.map((feature) => (
                  <label key={feature} className="flex items-center gap-2 border border-stone-200 px-3 py-2 text-xs text-stone-700">
                    <input type="checkbox" checked={parkingFeatures.includes(feature)} onChange={() => toggleParkingFeature(feature)} />
                    <span>{feature}</span>
                  </label>
                ))}
              </div>
              {initialProject?.parking && !parkingSpaces && parkingFeatures.length === 0 ? (
                <p className="text-xs text-stone-500">Currently: {initialProject.parking}. Set the fields above to replace it.</p>
              ) : null}
            </div>

            <div className="md:col-span-2 mt-2 border border-rose-200 bg-rose-50 p-3">
              <p className="text-sm font-medium text-stone-900">Connected Pages</p>
              <p className="mt-1 text-xs text-stone-600">Choose destination pages used on the public listing when users click these names.</p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Architect page</span>
                  <select value={architectSlug} onChange={(event) => setArchitectSlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {architectPageOptions.map((option) => (
                      <option key={option.slug || "architect-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Marketing company page</span>
                  <select value={marketingCompanySlug} onChange={(event) => setMarketingCompanySlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {marketingCompanyPageOptions.map((option) => (
                      <option key={option.slug || "marketing-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Sales company page</span>
                  <select value={salesCompanySlug} onChange={(event) => setSalesCompanySlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {salesCompanyPageOptions.map((option) => (
                      <option key={option.slug || "sales-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Interior designer page</span>
                  <select value={interiorDesignerSlug} onChange={(event) => setInteriorDesignerSlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm">
                    {interiorDesignerPageOptions.map((option) => (
                      <option key={option.slug || "interior-none"} value={option.slug}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <p className="mt-2 text-xs text-stone-500">The neighborhood page links automatically when this project&apos;s neighborhood name matches one created under Admin → Neighborhoods. The primary builder page is set by which developer dashboard this project belongs to — use Additional builders below for co-developers.</p>

              <CoDeveloperEditor
                coDevelopers={coDevelopers}
                setCoDevelopers={setCoDevelopers}
                developerOptions={developerDirectory}
                excludeSlug={developerSlug ?? initialProject?.developerSlug ?? ""}
              />
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[5] = element; }} className="border border-lime-200 bg-lime-50 p-3">
            <p className="text-sm font-medium text-stone-900">Gallery</p>
            <p className="mt-1 text-xs text-stone-600">Manage the images shown on the public project page.</p>
            <div className="mt-3"><ImageUploader /></div>
            <div className="mt-4 grid gap-3 border border-lime-200 bg-white p-3">
              <p className="text-sm font-medium text-stone-900">Project Media</p>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Video URL</span>
                <Field label="Video URL"><input value={videoUrl} onChange={(event) => setVideoUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" placeholder="YouTube or Vimeo embed URL" /></Field>
              </label>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Upload video</span>
                <input type="file" accept="video/*" onChange={(event) => setVideoFile(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "")} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
              </label>
              {videoFile ? <video src={videoFile} controls className="max-h-52 w-full bg-stone-900" /> : null}

              <div className="grid gap-3 md:grid-cols-2">
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-stone-800">Block Plan images</p>
                  {blockPlanImages.map((entry, index) => (
                    <div key={`block-plan-image-${index}`} className="grid gap-2 border border-stone-200 p-2">
                      <input value={entry.label} onChange={(event) => updateMapImage("block", index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder={`Block plan ${index + 1} name`} />
                      <input type="file" accept="image/*" onChange={(event) => updateUploadedImage(event.target.files?.[0], (value) => updateMapImage("block", index, "image", value))} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
                      <input value={entry.image} onChange={(event) => updateMapImage("block", index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Or paste image URL" />
                      {entry.image ? <Image src={entry.image} alt={`${entry.label || `Block plan ${index + 1}`} preview`} width={640} height={360} unoptimized className="h-28 w-full object-contain bg-stone-50" /> : null}
                      {blockPlanImages.length > 1 ? <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => removeMapImage("block", index)}>Remove</Button> : null}
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => addMapImage("block")}>Add another Block Plan</Button>
                </div>
                <div className="grid gap-2">
                  <p className="text-xs font-medium text-stone-800">Road Map images</p>
                  {roadMapImages.map((entry, index) => (
                    <div key={`road-map-image-${index}`} className="grid gap-2 border border-stone-200 p-2">
                      <input value={entry.label} onChange={(event) => updateMapImage("road", index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder={`Road map ${index + 1} name`} />
                      <input type="file" accept="image/*" onChange={(event) => updateUploadedImage(event.target.files?.[0], (value) => updateMapImage("road", index, "image", value))} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
                      <input value={entry.image} onChange={(event) => updateMapImage("road", index, "image", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" placeholder="Or paste image URL" />
                      {entry.image ? <Image src={entry.image} alt={`${entry.label || `Road map ${index + 1}`} preview`} width={640} height={360} unoptimized className="h-28 w-full object-contain bg-stone-50" /> : null}
                      {roadMapImages.length > 1 ? <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => removeMapImage("road", index)}>Remove</Button> : null}
                    </div>
                  ))}
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={() => addMapImage("road")}>Add another Road Map</Button>
                </div>
              </div>

              <label className="grid gap-1 text-xs text-stone-700">
                <span>Interactive Map URL</span>
                <Field label="Interactive map embed URL"><input value={interactiveMapUrl} onChange={(event) => setInteractiveMapUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
              </label>

              <label className="grid gap-1 text-xs text-stone-700">
                <span>Brochure URL</span>
                <Field label="PDF brochure URL"><input value={brochureUrl} onChange={(event) => setBrochureUrl(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
              </label>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Upload brochure PDF</span>
                <input type="file" accept="application/pdf" onChange={(event) => setBrochureUrl(event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "")} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
              </label>

              <div className="grid gap-2">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-medium text-stone-800">Virtual Tours</p>
                  <Button type="button" variant="outline" className="h-8 px-3 text-xs" onClick={addVirtualTour}>Add virtual tour</Button>
                </div>
                {virtualTours.map((tour, index) => (
                  <div key={`virtual-tour-${index}`} className="grid gap-2 md:grid-cols-[1fr_2fr_auto]">
                    <Field label="Tour name"><input value={tour.label} onChange={(event) => updateVirtualTour(index, "label", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                    <Field label="Virtual tour URL"><input value={tour.url} onChange={(event) => updateVirtualTour(index, "url", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm w-full" /></Field>
                    <Button type="button" variant="outline" className="h-10 px-3 text-xs" onClick={() => removeVirtualTour(index)}>Remove</Button>
                  </div>
                ))}
              </div>
            </div>
          <div ref={(element) => { sectionRefs.current[4] = element; }} className="border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm font-medium text-stone-900">Amenities</p>
            <p className="mt-1 text-xs text-stone-600">Select the amenities that should appear on the public listing.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2 md:grid-cols-3">
              {amenityOptions.map((amenity) => <label key={amenity} className="flex items-center gap-2 border border-stone-200 bg-white px-3 py-2 text-sm"><input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} />{amenity}</label>)}
            </div>
            <div className="mt-3 flex gap-2">
              <input value={customAmenity} onChange={(event) => setCustomAmenity(event.target.value)} className="min-w-0 flex-1 border border-stone-300 bg-white px-3 py-2 text-sm" placeholder="Custom amenity" />
              <Button type="button" variant="outline" onClick={addCustomAmenity}>Add amenity</Button>
            </div>
            {amenities.length ? <p className="mt-3 text-xs text-stone-700">Selected: {amenities.join(" | ")}</p> : null}
            {amenities.map((amenity) => (
              <div key={`amenity-details-${amenity}`} className="grid gap-2 border border-stone-200 bg-white p-3 md:grid-cols-2">
                <p className="text-sm font-medium text-stone-900 md:col-span-2">{amenity}</p>
                <textarea value={amenityDetails[amenity]?.description ?? ""} onChange={(event) => updateAmenityDetail(amenity, "description", event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" rows={3} placeholder={`${amenity} description`} />
                <label className="grid gap-1 text-xs text-stone-700">
                  <span>Upload amenity image</span>
                  <input type="file" accept="image/*" onChange={(event) => updateAmenityDetail(amenity, "image", event.target.files?.[0] ? URL.createObjectURL(event.target.files[0]) : "")} className="border border-stone-300 bg-white px-3 py-2 text-sm file:mr-3 file:border-0 file:bg-stone-100 file:px-3 file:py-1 file:text-sm" />
                  {amenityDetails[amenity]?.image ? <Image src={amenityDetails[amenity].image} alt={`${amenity} preview`} width={320} height={180} unoptimized className="h-24 w-full object-cover bg-stone-50" /> : null}
                </label>
              </div>
            ))}
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <p className="text-xs font-medium text-stone-800 md:col-span-3">Key features (one per line, grouped for the "Key Features" accordion — distinct from building amenities above)</p>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Indoor features</span>
                <textarea value={indoorFeaturesText} onChange={(event) => setIndoorFeaturesText(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" rows={4} />
              </label>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Outdoor features</span>
                <textarea value={outdoorFeaturesText} onChange={(event) => setOutdoorFeaturesText(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" rows={4} />
              </label>
              <label className="grid gap-1 text-xs text-stone-700">
                <span>Other</span>
                <textarea value={otherFeaturesText} onChange={(event) => setOtherFeaturesText(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" rows={4} />
              </label>
            </div>
          </div>
          </div>
          <div ref={(element) => { sectionRefs.current[7] = element; }} className="border border-indigo-200 bg-indigo-50 p-3">
            <p className="text-sm font-medium text-stone-900">Units</p>
            <p className="mt-1 text-xs text-stone-600">Per-unit floor availability and pricing, shown as a floor-by-floor table on the public project page. Saved separately from the rest of the wizard.</p>
            {!initialProject ? (
              <p className="mt-3 border border-dashed border-stone-300 bg-white p-3 text-xs text-stone-600">Save this project first (Publish below) — units need a project to attach to.</p>
            ) : (
              <>
                <div className="mt-3 overflow-x-auto border border-stone-200 bg-white">
                  <table className="w-full min-w-225 text-sm">
                    <thead className="bg-stone-50 text-left">
                      <tr>
                        <th className="p-2">Unit #</th>
                        <th className="p-2">Floor</th>
                        <th className="p-2">Type</th>
                        <th className="p-2">Beds</th>
                        <th className="p-2">Sq Ft</th>
                        <th className="p-2">Price (LKR)</th>
                        <th className="p-2">Price (USD)</th>
                        <th className="p-2">Status</th>
                        <th className="p-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {units.map((unit, index) => (
                        <tr key={`unit-row-${index}`} className="border-t border-stone-100">
                          <td className="p-2"><input value={unit.unitNumber} onChange={(event) => updateUnitRow(index, { unitNumber: event.target.value })} className="w-24 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" value={unit.floor} onChange={(event) => updateUnitRow(index, { floor: Number(event.target.value) })} className="w-16 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input value={unit.apartmentType} onChange={(event) => updateUnitRow(index, { apartmentType: event.target.value })} className="w-20 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" value={unit.bedrooms} onChange={(event) => updateUnitRow(index, { bedrooms: Number(event.target.value) })} className="w-14 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" value={unit.areaSqFt} onChange={(event) => updateUnitRow(index, { areaSqFt: Number(event.target.value) })} className="w-20 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" value={unit.priceLkr} onChange={(event) => updateUnitRow(index, { priceLkr: Number(event.target.value) })} className="w-28 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2"><input type="number" value={unit.priceUsd ?? ""} onChange={(event) => updateUnitRow(index, { priceUsd: event.target.value ? Number(event.target.value) : undefined })} className="w-24 border border-stone-300 px-2 py-1" /></td>
                          <td className="p-2">
                            <select value={unit.status} onChange={(event) => updateUnitRow(index, { status: event.target.value as Unit["status"] })} className="border border-stone-300 px-2 py-1">
                              <option value="Available">Available</option>
                              <option value="Reserved">Reserved</option>
                              <option value="Booked">Booked</option>
                              <option value="Sold">Sold</option>
                            </select>
                          </td>
                          <td className="p-2"><Button type="button" variant="outline" className="h-8 px-2 text-xs" onClick={() => removeUnitRow(index)}>Remove</Button></td>
                        </tr>
                      ))}
                      {units.length === 0 ? <tr><td colSpan={9} className="p-3 text-center text-xs text-stone-500">{unitsLoading ? "Loading units..." : "No units yet."}</td></tr> : null}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <Button type="button" variant="outline" onClick={addUnitRow}>Add unit</Button>
                  <Button type="button" disabled={unitsSaving} onClick={saveUnits}>{unitsSaving ? "Saving..." : "Save units"}</Button>
                  {unitsMessage ? <p className="text-xs text-stone-700">{unitsMessage}</p> : null}
                </div>
              </>
            )}
          </div>
          <div ref={(element) => { sectionRefs.current[8] = element; }} className="border border-teal-200 bg-teal-50 p-3">
            <p className="text-sm font-medium text-stone-900">Contact</p>
            <p className="mt-1 text-xs text-stone-600">Add the sales contact details shown to prospective buyers.</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <Field label="Contact name"><input ref={contactNameRef} defaultValue={initialProject?.contact.name} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
              <Field label="Email address"><input ref={contactEmailRef} defaultValue={initialProject?.contact.email} type="email" className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
              <Field label="Phone number" className="md:col-span-2"><input ref={contactPhoneRef} defaultValue={initialProject?.contact.phone} className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
            </div>
            <p className="mt-3 text-xs text-stone-500">Social links and hours of operation are set once on the developer&apos;s profile and shown on every one of their projects — edit them on the <Link href={`/admin/developers/${developerSlug ?? initialProject?.developerSlug ?? ""}/edit`} className="underline">developer page</Link>.</p>
          </div>
          <div ref={(element) => { sectionRefs.current[9] = element; }} className="border border-fuchsia-200 bg-fuchsia-50 p-3">
            <p className="text-sm font-medium text-stone-900">SEO</p>
            <p className="mt-1 text-xs text-stone-600">Set the search title and description for the public project page.</p>
            <div className="mt-3 grid gap-3">
              <Field label="SEO title"><input className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" /></Field>
              <Field label="SEO description"><textarea className="border border-stone-300 bg-white px-3 py-2 text-sm w-full" rows={3} /></Field>
            </div>
          </div>
          <div ref={(element) => { sectionRefs.current[10] = element; }} className="border border-violet-200 bg-violet-50 p-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-stone-900">Preview</p>
                <p className="mt-1 text-xs text-stone-600">Review the project details before publishing.</p>
              </div>
              <Button type="button" variant="outline" onClick={() => setPreviewVisible((visible) => !visible)}>
                {previewVisible ? "Hide preview" : "Open preview"}
              </Button>
            </div>
            {previewVisible ? (
              <div className="mt-3 border border-violet-200 bg-white p-3 text-sm">
                <p className="font-semibold">{projectType || "Project type not set"}</p>
                <p className="mt-1 text-stone-600">{[neighborhood, city, district, province].filter(Boolean).join(", ") || "Location not set"}</p>
                <p className="mt-1 text-stone-600">Price range: {normalizedPriceRange}</p>
              </div>
            ) : null}
          </div>
          <div ref={(element) => { sectionRefs.current[11] = element; }} className="border border-orange-200 bg-orange-50 p-3">
            <p className="text-sm font-medium text-stone-900">Publish</p>
            <p className="mt-1 text-xs text-stone-600">Review the steps above, then use Save or Publish at the bottom of this page &mdash; both are available from any step.</p>
          </div>
          <div className="border border-stone-200 bg-stone-50 p-3 text-xs text-stone-700">
            <p className="font-medium text-stone-900">Live normalized preview</p>
            <div className="mt-2 grid gap-1 md:grid-cols-2">
              <p><strong>Project Type:</strong> {projectType || "Not set"}</p>
              <p><strong>Listing Status:</strong> {projectStatus || "Not set"}</p>
              <p><strong>Move-in Year:</strong> {moveInYear || "Not set"}</p>
              <p><strong>Construction Started:</strong> {constructionStarted || "Not set"}</p>
              <p><strong>Estimated Completion:</strong> {estimatedCompletion || "Not set"}</p>
              <p><strong>Province:</strong> {province || "Not set"}</p>
              <p><strong>District:</strong> {district || "Not set"}</p>
              <p><strong>City:</strong> {city || "Not set"}</p>
              <p><strong>Neighborhood:</strong> {neighborhood || "Not set"}</p>
              <p><strong>Beds:</strong> {normalizedBedRange}</p>
              <p><strong>Baths:</strong> {normalizedBathRange}</p>
              <p><strong>SqFt:</strong> {normalizedSqftRange}</p>
              <p><strong>Price Range:</strong> {normalizedPriceRange}</p>
              <p><strong>Available Unit Price:</strong> {normalizedAvailableRange}</p>
              <p><strong>Price/SqFt:</strong> {pricePerSqft || "Not set"}</p>
              <p><strong>Available Plan Prices:</strong> {normalizedAvailablePlanPrices}</p>
              <p><strong>Pricing:</strong> {pricingComingSoon || "Not set"}</p>
              <p><strong>Average Price/SqFt:</strong> {averagePricePerSqft || "Not set"}</p>
              <p><strong>Monthly Maint/SqFt:</strong> {monthlyMaintenancePerSqft || "Not set"}</p>
              <p><strong>Property Tax:</strong> {propertyTax || "Not set"}</p>
              <p><strong>Parking Cost:</strong> {parkingCost || "Not set"}</p>
              <p><strong>Storage Cost:</strong> {storageCost || "Not set"}</p>
              <p><strong>Co-op Fee Realtors:</strong> {coopFeeRealtors || "Not set"}</p>
              <p><strong>Pricing History:</strong> {(pricingHistoryDate && pricingHistoryNote) ? `${pricingHistoryDate} - ${pricingHistoryNote}` : "Not set"}</p>
              <p><strong>Payment Structure:</strong> {paymentPlanItems.filter((item) => item.trim()).length ? paymentPlanItems.filter((item) => item.trim()).join(" | ") : "Not set"}</p>
              <p><strong>Incentives Count:</strong> {incentives.filter((item) => item.trim()).length}</p>
            </div>
          </div>
          <div className="sticky bottom-0 -mx-4 border-t border-stone-200 bg-white/95 px-4 py-3 backdrop-blur">
            <div className="flex flex-wrap items-center justify-end gap-2">
              {initialProject ? (
                <Button type="button" disabled={formHasErrors || saving} title={formHasErrors ? "Fix range errors before saving" : undefined} onClick={() => handleSaveOrPublish("save")}>{saving ? "Saving..." : "Save"}</Button>
              ) : null}
              <Button
                type="button"
                disabled={formHasErrors || saving}
                title={formHasErrors ? "Fix range errors before publishing" : undefined}
                onClick={() => handleSaveOrPublish("publish")}
                className="bg-emerald-600 text-white hover:bg-emerald-700"
              >
                {saving ? "Publishing..." : "Publish"}
              </Button>
            </div>
            {publishMessage ? <p className="text-right text-sm text-emerald-700">{publishMessage}</p> : null}
            {saveError ? <p className="text-right text-sm text-red-600">{saveError}</p> : null}
          </div>
        </div>

        <div className="space-y-4 lg:sticky lg:top-4 lg:h-fit">
        <aside className="space-y-3 border border-amber-300 bg-amber-100 p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-stone-900">Listing page icon info visibility</h3>
            <p className="text-xs text-stone-600">Choose which details appear in the listing icon stats. Maximum 10 items.</p>
          </div>
          <p className={`text-xs font-medium ${visibleStats.length === maxVisibleStats ? "text-amber-700" : "text-stone-600"}`}>
            {visibleStats.length}/{maxVisibleStats} selected
          </p>
          <div className="grid grid-cols-3 gap-2">
            {statOptions.map((stat) => {
              const isChecked = visibleStats.includes(stat);
              const canSelect = isChecked || visibleStats.length < maxVisibleStats;

              return (
                <label
                  key={stat}
                  className={`flex items-center gap-1.5 border border-stone-200 bg-white px-2 py-2 text-xs text-stone-700 ${!canSelect ? "cursor-not-allowed opacity-50" : ""}`}
                >
                  <input type="checkbox" checked={isChecked} disabled={!canSelect} onChange={() => toggleStat(stat)} />
                  <span>{stat}</span>
                </label>
              );
            })}
          </div>
          {visibleStats.length === maxVisibleStats ? <p className="text-xs text-amber-700">Maximum reached. Turn one item off to enable another.</p> : null}
        </aside>

        <aside className="space-y-3 border border-stone-200 bg-white p-4">
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-stone-900">Property Facts grid</h3>
            <p className="text-xs text-stone-600">
              The row of icon facts shown right below the hero. Leave empty to use the automatic defaults built from
              this project&apos;s other fields (Building, Built in, Residences, Stories, Bedrooms, Bathrooms, Size,
              Parking, Ownership, Status).
            </p>
          </div>

          <div className="space-y-2">
            {factsGrid.map((fact, index) => (
              <div key={fact.key} className="grid grid-cols-[1fr_1fr_auto_auto] items-center gap-1.5 border border-stone-200 p-2">
                <input
                  type="text"
                  placeholder="Label"
                  value={fact.label}
                  onChange={(event) => updateFactRow(index, { label: event.target.value })}
                  className="min-w-0 border border-stone-200 px-2 py-1.5 text-xs"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={fact.value}
                  onChange={(event) => updateFactRow(index, { value: event.target.value })}
                  className="min-w-0 border border-stone-200 px-2 py-1.5 text-xs"
                />
                <select
                  value={fact.icon}
                  onChange={(event) => updateFactRow(index, { icon: event.target.value as FactIconKey })}
                  aria-label="Icon"
                  className="border border-stone-200 px-1 py-1.5 text-xs"
                >
                  {ICON_OPTIONS.map((iconKey) => (
                    <option key={iconKey} value={iconKey}>
                      {ICON_LABELS[iconKey]}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => removeFactRow(index)}
                  aria-label="Remove fact"
                  className="border border-stone-200 px-2 py-1.5 text-xs text-stone-600 hover:bg-stone-50"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>

          <button type="button" onClick={addFactRow} className="w-full border border-stone-300 py-2 text-xs font-medium text-stone-700 hover:bg-stone-50">
            + Add fact
          </button>
        </aside>
        </div>
        </div>
    </section>
  );
}
