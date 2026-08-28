"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

type DeveloperOption = {
  slug: string;
  name: string;
  projects: { slug: string; name: string }[];
};

export function HeroAdRequestForm({ developers, onCreated }: { developers: DeveloperOption[]; onCreated?: () => void }) {
  const [developerSlug, setDeveloperSlug] = useState(developers[0]?.slug ?? "");
  const [image, setImage] = useState("");
  const [headline, setHeadline] = useState("");
  const [projectSlug, setProjectSlug] = useState(developers[0]?.projects[0]?.slug ?? "");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const selectedDeveloper = useMemo(() => developers.find((developer) => developer.slug === developerSlug), [developers, developerSlug]);
  const linkUrl = projectSlug ? `/projects/${projectSlug}` : "";

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/hero-ads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          developerSlug,
          developerName: selectedDeveloper?.name ?? "",
          projectSlug: projectSlug || undefined,
          image,
          headline,
          linkUrl,
          startDate,
          endDate,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to submit this request.");
        return;
      }

      setSuccessMessage("Request submitted below as pending — approve it when you're ready to put it live.");
      setImage("");
      setHeadline("");
      setStartDate("");
      setEndDate("");
      onCreated?.();
    } catch {
      setErrorMessage("Unable to submit this request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
      <p className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
        Hero placements are free while the site is building traffic — no price is required to submit or approve one. You can set a price per placement later from the list below.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-xs text-stone-700">
          <span>Developer</span>
          <select
            value={developerSlug}
            onChange={(event) => {
              setDeveloperSlug(event.target.value);
              const next = developers.find((developer) => developer.slug === event.target.value);
              setProjectSlug(next?.projects[0]?.slug ?? "");
            }}
            className="border border-stone-300 bg-white px-3 py-2 text-sm"
            required
          >
            <option value="">Select a developer</option>
            {developers.map((developer) => <option key={developer.slug} value={developer.slug}>{developer.name}</option>)}
          </select>
        </label>

        <label className="grid gap-1 text-xs text-stone-700">
          <span>Project</span>
          <select value={projectSlug} onChange={(event) => setProjectSlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" required disabled={!selectedDeveloper}>
            <option value="">Select a project</option>
            {selectedDeveloper?.projects.map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}
          </select>
        </label>

        <input value={headline} onChange={(event) => setHeadline(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Headline shown to buyers (e.g. Now Selling: Colombo Heights)" required />

        <input value={image} onChange={(event) => setImage(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm md:col-span-2" placeholder="Hero image URL (wide, at least 2000px)" required />

        <label className="grid gap-1 text-xs text-stone-700">
          <span>Start date</span>
          <input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" required />
        </label>

        <label className="grid gap-1 text-xs text-stone-700">
          <span>End date</span>
          <input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} className="border border-stone-300 px-3 py-2 text-sm" required />
        </label>
      </div>

      {image ? (
        <div className="border border-stone-200 bg-stone-50 p-2">
          <p className="mb-2 text-xs font-medium text-stone-600">Preview</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="Hero banner preview" className="h-40 w-full object-cover" />
        </div>
      ) : null}

      {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-stone-500">Clicking the hero image takes buyers to the project page.</p>
        <Button type="submit" disabled={submitting || !selectedDeveloper}>{submitting ? "Submitting..." : "Add as pending request"}</Button>
      </div>
    </form>
  );
}
