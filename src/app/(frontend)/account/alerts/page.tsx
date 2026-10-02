"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
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
    <AccountShell active="/account/alerts">
      <AccountPageHero
        title="Saved searches and alerts."
        intro="Get notified when a new match comes on the market. When a search has email notifications on, you get a weekly email whenever a new listing matches it."
        stat={{ label: "Saved searches", value: searches.length }}
      />

      {loading ? null : !userId ? (
        <section className="fdv-box fdv-box--gray" id="login" aria-label="Log in">
          <div className="fdv-box-card account-empty">
            <p>Log in to create saved-search alerts.</p>
            <button type="button" onClick={() => openAuthModal({ mode: "login" })} className="account-btn account-btn--dark">Log in</button>
          </div>
        </section>
      ) : (
        <>
          <section className="fdv-box fdv-box--gray" id="new-alert" aria-label="Create an alert">
            <div className="wdx-section-head" data-reveal>
              <h2>Create an alert.</h2>
              <p>Choose what you are looking for, and we will tell you when it appears.</p>
            </div>
            <form onSubmit={submit} className="account-panel">
              <div className="account-grid account-grid--4">
                <label className="account-field">
                  Property type
                  <select value={propertyType} onChange={(event) => setPropertyType(event.target.value)} className="account-input">
                    {PROPERTY_TYPES.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <label className="account-field">
                  Bedrooms
                  <select value={bedrooms} onChange={(event) => setBedrooms(event.target.value)} className="account-input">
                    {BEDROOM_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                  </select>
                </label>
                <label className="account-field">
                  City
                  <input type="text" placeholder="e.g. Colombo" value={city} onChange={(event) => setCity(event.target.value)} className="account-input" />
                </label>
                <label className="account-field">
                  Max price (Rs. millions)
                  <input type="number" min="0" placeholder="e.g. 50" value={maxPrice} onChange={(event) => setMaxPrice(event.target.value)} className="account-input" />
                </label>
              </div>
              <div className="account-chip-row">
                <button type="submit" className="account-btn account-btn--dark">Create alert</button>
              </div>
            </form>
          </section>

          <section className="fdv-box fdv-box--cream" id="searches" aria-label="Your saved searches">
            <div className="wdx-section-head" data-reveal>
              <h2>Your saved searches.</h2>
            </div>
            {searches.length === 0 ? (
              <div className="fdv-box-card account-empty">
                <p>No saved searches yet.</p>
              </div>
            ) : (
              <div className="account-stack">
                {searches.map((search) => (
                  <div key={search.id} className="account-panel account-search-row">
                    <div>
                      <h2>{search.name}</h2>
                      <Link href={`/search?q=${encodeURIComponent((search.filters as { city?: string }).city ?? "")}`} className="account-link">
                        View matching listings
                      </Link>
                    </div>
                    <div className="account-chip-row">
                      <label className="account-toggle account-toggle--inline">
                        Email notifications
                        <input type="checkbox" checked={search.isActive} onChange={(event) => toggleActive(search.id, event.target.checked)} />
                      </label>
                      <button type="button" aria-label={`Delete ${search.name}`} onClick={() => remove(search.id)} className="account-btn">
                        <X className="h-4 w-4" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </AccountShell>
  );
}
