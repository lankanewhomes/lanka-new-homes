"use client";

import { useState } from "react";
import type { Project } from "@/types";
import { Button } from "@/components/ui/button";

export function ProjectEditor({ project }: { project: Project }) {
  const [form, setForm] = useState<Project>(project);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof Project>(field: K, value: Project[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const updateText = (field: keyof Project, value: string) => update(field, value as never);

  const updateJson = (field: "gallery" | "videos" | "virtualTours" | "floorPlans" | "amenities" | "nearby" | "pricingHistory", value: string) => {
    try {
      update(field, JSON.parse(value));
    } catch {
      setMessage(`Enter valid JSON for ${field}.`);
    }
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    const response = await fetch(`/api/projects/${project.slug}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setMessage(response.ok ? "Project changes saved." : "Unable to save project changes.");
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="space-y-5 border border-stone-200 bg-white p-4">
      <section className="grid gap-3 border border-slate-200 bg-slate-50 p-3 md:grid-cols-2">
        <h2 className="text-lg font-semibold md:col-span-2">Project Information</h2>
        <label className="grid gap-1 text-sm"><span>Project name</span><input value={form.name} onChange={(event) => updateText("name", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Property type</span><input value={form.type} onChange={(event) => updateText("type", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Status</span><select value={form.status} onChange={(event) => update("status", event.target.value as Project["status"])} className="border border-stone-300 bg-white px-3 py-2"><option>Now Selling</option><option>Coming Soon</option><option>Under Construction</option><option>Launching Soon</option><option>Nearly Sold Out</option><option>Nearly Complete</option></select></label>
        <label className="grid gap-1 text-sm"><span>Starting price (LKR)</span><input type="number" min="0" value={form.startingPriceLkr} onChange={(event) => update("startingPriceLkr", Number(event.target.value))} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Launch date</span><input type="date" value={form.launchDate} onChange={(event) => updateText("launchDate", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Construction started</span><input value={form.constructionStarted ?? ""} onChange={(event) => updateText("constructionStarted", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Estimated completion</span><input type="number" value={form.completionYear} onChange={(event) => update("completionYear", Number(event.target.value))} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm md:col-span-2"><span>Description</span><textarea rows={5} value={form.description} onChange={(event) => updateText("description", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm md:col-span-2"><span>Summary</span><textarea rows={3} value={form.summary} onChange={(event) => updateText("summary", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
      </section>

      <section className="grid gap-3 border border-emerald-200 bg-emerald-50 p-3 md:grid-cols-2">
        <h2 className="text-lg font-semibold md:col-span-2">Location</h2>
        {(["location", "province", "district", "city", "neighborhood", "road", "area", "electricity", "tapWater"] as const).map((field) => <label key={field} className="grid gap-1 text-sm"><span>{field}</span><input value={form[field] ?? ""} onChange={(event) => updateText(field, event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>)}
      </section>

      <section className="grid gap-3 border border-amber-200 bg-amber-50 p-3 md:grid-cols-2">
        <h2 className="text-lg font-semibold md:col-span-2">Pricing and Fees</h2>
        {(["priceRange", "bedrooms", "bathrooms", "floorAreaRange", "parking", "security", "ownership", "ceilingInfo", "paymentPlan", "availablePlanPrices", "pricingComingSoon", "averagePricePerSqft", "monthlyMaintenancePerSqft", "propertyTax", "parkingCost", "storageCost", "coopFeeRealtors", "depositPaymentStructure"] as const).map((field) => <label key={field} className="grid gap-1 text-sm"><span>{field}</span><input value={form[field] ?? ""} onChange={(event) => updateText(field, event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>)}
        <label className="grid gap-1 text-sm"><span>Pricing history (JSON)</span><textarea rows={4} defaultValue={JSON.stringify(form.pricingHistory ?? [], null, 2)} onChange={(event) => updateJson("pricingHistory", event.target.value)} className="border border-stone-300 bg-white px-3 py-2 font-mono text-xs" /></label>
      </section>

      <section className="grid gap-3 border border-yellow-200 bg-yellow-50 p-3">
        <h2 className="text-lg font-semibold">Floor Plans and Media</h2>
        {(["floorPlans", "gallery", "videos", "virtualTours", "amenities", "nearby"] as const).map((field) => <label key={field} className="grid gap-1 text-sm"><span>{field} (JSON)</span><textarea rows={field === "floorPlans" ? 12 : 5} defaultValue={JSON.stringify(form[field] ?? [], null, 2)} onChange={(event) => updateJson(field, event.target.value)} className="border border-stone-300 bg-white px-3 py-2 font-mono text-xs" /></label>)}
        <label className="grid gap-1 text-sm"><span>Brochure URL</span><input value={form.brochureUrl ?? ""} onChange={(event) => updateText("brochureUrl", event.target.value)} className="border border-stone-300 bg-white px-3 py-2" /></label>
      </section>

      <section className="grid gap-3 border border-teal-200 bg-teal-50 p-3 md:grid-cols-2">
        <h2 className="text-lg font-semibold md:col-span-2">Contact and Visibility</h2>
        <label className="grid gap-1 text-sm"><span>Contact name</span><input value={form.contact.name} onChange={(event) => update("contact", { ...form.contact, name: event.target.value })} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Contact email</span><input value={form.contact.email} onChange={(event) => update("contact", { ...form.contact, email: event.target.value })} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Contact phone</span><input value={form.contact.phone} onChange={(event) => update("contact", { ...form.contact, phone: event.target.value })} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Desktop visible stats (comma separated)</span><input value={form.desktopVisibleStats?.join(", ") ?? ""} onChange={(event) => update("desktopVisibleStats", event.target.value.split(",").map((value) => value.trim()).filter(Boolean) as Project["desktopVisibleStats"])} className="border border-stone-300 bg-white px-3 py-2" /></label>
        <label className="grid gap-1 text-sm"><span>Mobile visible stats (comma separated)</span><input value={form.mobileVisibleStats?.join(", ") ?? ""} onChange={(event) => update("mobileVisibleStats", event.target.value.split(",").map((value) => value.trim()).filter(Boolean) as Project["mobileVisibleStats"])} className="border border-stone-300 bg-white px-3 py-2" /></label>
      </section>
      <div className="flex items-center gap-3"><Button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</Button>{message ? <p className="text-sm text-emerald-700">{message}</p> : null}</div>
    </form>
  );
}
