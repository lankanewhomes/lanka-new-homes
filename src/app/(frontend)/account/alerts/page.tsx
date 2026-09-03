"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { DashboardHeader, DashboardSidebar, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { useSavedSearches } from "@/lib/use-saved-searches";
import { useAuthModal } from "@/components/auth/auth-modal-provider";

const PROPERTY_TYPES = ["Any type", "Apartments", "Condominium", "Villas", "House", "Townhouse", "Serviced Apartment", "Mixed-Use"];
const BEDROOM_OPTIONS = ["Any", "1", "2", "3", "4+"];

function summarize(filters: { propertyType?: string; bedrooms?: string; city?: string; maxPriceLkr?: number }) {
  const parts: string[] = [];
  if (filters.bedrooms && filters.bedrooms !== "Any") parts.push(`${filters.bedrooms}-bedroom`);
  parts.push(filters.propertyType && filters.propertyType !== "Any type" ? filters.propertyType : "properties");
  if (filters.city) parts.push(`in ${filters.city}`);
  if (filters.maxPriceLkr) parts.push(`under Rs. ${(filters.maxPriceLkr / 1_000_000).toLocaleString()}M`);
  return parts.join(" ");
}

export default function AlertsPage() {
  const { userId, loading, searches, create, toggleActive, remove } = useSavedSearches();
  const { openAuthModal } = useAuthModal();
  const [propertyType, setPropertyType] = useState("Any type");
  const [bedrooms, setBedrooms] = useState("Any");
  const [city, setCity] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const filters = {
      propertyType: propertyType !== "Any type" ? propertyType : undefined,
      bedrooms: bedrooms !== "Any" ? bedrooms : undefined,
      city: city.trim() || undefined,
      maxPriceLkr: maxPrice ? Number(maxPrice) * 1_000_000 : undefined,
    };
    const name = summarize(filters);
    create(name, filters);
    setPropertyType("Any type");
    setBedrooms("Any");
    setCity("");
    setMaxPrice("");
  };

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section className="space-y-4">
        <DashboardHeader title="Saved searches & alerts" subtitle="Get notified when a new match comes on the market." />

        {loading ? null : !userId ? (
          <div className="border border-stone-200 bg-white p-4">
            <p className="text-sm text-stone-600">Log in to create saved-search alerts.</p>
            <button type="button" onClick={() => openAuthModal({ mode: "login" })} className="mt-3 border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
              Log in
            </button>
          </div>
        ) : (
          <>
            <form onSubmit={submit} className="grid gap-3 border border-stone-200 bg-white p-4 sm:grid-cols-4">
              <label className="space-y-1 text-xs font-medium text-stone-600">
                Property type
                <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="w-full border border-stone-300 px-2 py-2 text-sm">
                  {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-stone-600">
                Bedrooms
                <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="w-full border border-stone-300 px-2 py-2 text-sm">
                  {BEDROOM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs font-medium text-stone-600">
                City
                <input type="text" placeholder="e.g. Colombo" value={city} onChange={(event) => setCity(event.target.value)} className="w-full border border-stone-300 px-2 py-2 text-sm" />
              </label>
              <label className="space-y-1 text-xs font-medium text-stone-600">
                Max price (Rs. millions)
                <input type="number" min="0" placeholder="e.g. 50" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="w-full border border-stone-300 px-2 py-2 text-sm" />
              </label>
              <button type="submit" className="sm:col-span-4 border border-stone-900 bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-800">
                Create alert
              </button>
            </form>

            <p className="text-xs text-stone-500">Email alerts are saved for when this launches — for now, this keeps each search on/off and matches it against new listings visually here.</p>

            {searches.length === 0 ? (
              <p className="text-sm text-stone-600">No saved searches yet.</p>
            ) : (
              <div className="space-y-2">
                {searches.map((search) => (
                  <div key={search.id} className="flex flex-wrap items-center justify-between gap-2 border border-stone-200 bg-white p-3">
                    <div>
                      <p className="text-sm font-medium text-stone-900">{search.name}</p>
                      <Link href={`/search?q=${encodeURIComponent((search.filters as { city?: string }).city ?? "")}`} className="text-xs text-stone-500 hover:text-stone-800">
                        View matching listings →
                      </Link>
                    </div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 text-xs text-stone-600">
                        <input type="checkbox" checked={search.isActive} onChange={(event) => toggleActive(search.id, event.target.checked)} />
                        Email notifications
                      </label>
                      <button type="button" aria-label={`Delete ${search.name}`} onClick={() => remove(search.id)} className="text-stone-400 hover:text-stone-700">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
