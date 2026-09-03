"use client";

import { FormEvent, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";

// Mirrors FEATURED_PAGE_OPTIONS in src/collections/shared-fields.ts — kept
// as a small hardcoded copy here rather than importing that module
// directly, since it pulls in Payload-adjacent code not meant to reach the
// client bundle.
const FEATURED_PAGE_OPTIONS = [
  { label: "Sitewide (homepage)", value: "sitewide" },
  { label: "Colombo", value: "colombo" },
  { label: "Colombo — Luxury", value: "colombo-luxury" },
  { label: "Pre-Construction", value: "pre-construction" },
  { label: "Branded Residences", value: "branded-residences" },
  { label: "Villas", value: "villas" },
  { label: "Beachfront", value: "beachfront" },
  { label: "Serviced Apartments", value: "serviced-apartments" },
  { label: "Port City Colombo", value: "port-city-colombo" },
  { label: "Search Results", value: "search" },
  { label: "Land Listings", value: "land" },
];

const PAYMENT_TYPES = [
  { label: "Featured Listing", value: "featured_listing" },
  { label: "Featured in Search Results", value: "featured_search" },
];

export type PricingRow = { paymentType: string; featuredPage: string | null; price: number; currency: string; durationDays: number | null };
export type PlacementRequest = {
  id: string;
  paymentType: string;
  featuredPage: string | null;
  amount: number;
  currency: string;
  status: string;
  createdAt: string;
  project: { name?: string; slug?: string } | null;
};

function formatMoney(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-800",
  failed: "bg-red-100 text-red-700",
  refunded: "bg-stone-200 text-stone-600",
};

export function FeaturedPlacementForm({
  projects,
  pricing,
  initialRequests,
}: {
  projects: { slug: string; name: string }[];
  pricing: PricingRow[];
  initialRequests: PlacementRequest[];
}) {
  const [projectSlug, setProjectSlug] = useState(projects[0]?.slug ?? "");
  const [paymentType, setPaymentType] = useState(PAYMENT_TYPES[0].value);
  const [featuredPage, setFeaturedPage] = useState(FEATURED_PAGE_OPTIONS[0].value);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [requests, setRequests] = useState(initialRequests);

  const matchingPrice = useMemo(
    () => pricing.find((row) => row.paymentType === paymentType && row.featuredPage === featuredPage),
    [pricing, paymentType, featuredPage],
  );

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const response = await fetch("/api/developer/placements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectSlug, paymentType, featuredPage }),
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        setErrorMessage(data?.error ?? "Unable to submit this request.");
        return;
      }

      setSuccessMessage(`Request submitted — ${formatMoney(data.amount, data.currency)}, pending review.`);
      const project = projects.find((p) => p.slug === projectSlug);
      setRequests((prev) => [
        { id: data.id, paymentType, featuredPage, amount: data.amount, currency: data.currency, status: "pending", createdAt: new Date().toISOString(), project: project ? { name: project.name, slug: project.slug } : null },
        ...prev,
      ]);
    } catch {
      setErrorMessage("Unable to submit this request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={onSubmit} className="space-y-4 border border-stone-200 bg-white p-4">
        <p className="border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          Featured placements are paid. Pick a project and where you want it featured — the price shows automatically. Submitting creates a pending request; we&apos;ll follow up to collect payment and activate it.
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <label className="grid gap-1 text-xs text-stone-700">
            <span>Project</span>
            <select value={projectSlug} onChange={(event) => setProjectSlug(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" required>
              {projects.map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Placement type</span>
            <select value={paymentType} onChange={(event) => setPaymentType(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" required>
              {PAYMENT_TYPES.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </label>

          <label className="grid gap-1 text-xs text-stone-700">
            <span>Page</span>
            <select value={featuredPage} onChange={(event) => setFeaturedPage(event.target.value)} className="border border-stone-300 bg-white px-3 py-2 text-sm" required>
              {FEATURED_PAGE_OPTIONS.map((page) => <option key={page.value} value={page.value}>{page.label}</option>)}
            </select>
          </label>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-stone-100 pt-4">
          <p className="text-sm text-stone-700">
            {matchingPrice
              ? <>Price: <span className="font-semibold">{formatMoney(matchingPrice.price, matchingPrice.currency)}</span>{matchingPrice.durationDays ? ` for ${matchingPrice.durationDays} days` : ""}</>
              : projects.length === 0 ? "You don't have any projects to feature yet." : "No active price for this combination — try a different page."}
          </p>
          <Button type="submit" disabled={submitting || !matchingPrice || projects.length === 0}>{submitting ? "Submitting…" : "Request placement"}</Button>
        </div>

        {errorMessage ? <p className="text-sm text-red-600">{errorMessage}</p> : null}
        {successMessage ? <p className="text-sm text-emerald-700">{successMessage}</p> : null}
      </form>

      <div className="space-y-2">
        <h2 className="text-sm font-semibold text-stone-900">Your placement requests</h2>
        {requests.length === 0 ? (
          <p className="text-sm text-stone-500">No placement requests yet.</p>
        ) : (
          <div className="space-y-2">
            {requests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-2 border border-stone-200 bg-white p-3">
                <div>
                  <p className="text-sm font-medium text-stone-900">{request.project?.name ?? "—"}</p>
                  <p className="text-xs text-stone-500">
                    {PAYMENT_TYPES.find((t) => t.value === request.paymentType)?.label ?? request.paymentType}
                    {request.featuredPage ? ` · ${FEATURED_PAGE_OPTIONS.find((p) => p.value === request.featuredPage)?.label ?? request.featuredPage}` : ""}
                    {" · "}{formatMoney(request.amount, request.currency)}
                  </p>
                </div>
                <span className={`shrink-0 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[request.status] ?? "bg-stone-100 text-stone-600"}`}>
                  {request.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
