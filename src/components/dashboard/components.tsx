"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export function DashboardSidebar({ links }: { links: { label: string; href: string }[] }) {
  return (
    <aside className="border-r border-stone-200 bg-white p-4">
      <nav className="grid gap-2 text-sm">
        {links.map((l) => <Link key={l.href} href={l.href} className="border border-stone-200 px-3 py-2">{l.label}</Link>)}
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

export function ProjectWizard() {
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
  const [step, setStep] = useState(0);
  return (
    <section className="grid gap-4 lg:grid-cols-[260px_1fr]">
      <aside className="border border-stone-200 bg-white p-3">
        <ol className="grid gap-2 text-sm">
          {steps.map((s, idx) => (
            <li key={s}>
              <button onClick={() => setStep(idx)} className={`w-full border px-2 py-2 text-left ${step === idx ? "border-stone-900 bg-stone-900 text-white" : "border-stone-200"}`}>
                {idx + 1}. {s}
              </button>
            </li>
          ))}
        </ol>
      </aside>
      <div className="space-y-4 border border-stone-200 bg-white p-4">
        <h2 className="text-xl font-semibold">{steps[step]}</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Project Name" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Project Type" />
          <textarea className="md:col-span-2 border border-stone-300 px-3 py-2 text-sm" rows={4} placeholder="Description" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Project Status" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Address" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="City" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="District" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Province" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Starting Price" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Price Range" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Number of Units" />
          <input className="border border-stone-300 px-3 py-2 text-sm" placeholder="Number of Floors" />
        </div>
        <ImageUploader />
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))}>Back</Button>
          <Button onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>Next</Button>
        </div>
      </div>
    </section>
  );
}
