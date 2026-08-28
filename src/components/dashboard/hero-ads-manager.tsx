"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { HeroAd, HeroAdStatus } from "@/types";
import { Button } from "@/components/ui/button";
import { formatLkr } from "@/lib/format";
import { HeroAdRequestForm } from "@/components/dashboard/hero-ad-request-form";

type DeveloperOption = { slug: string; name: string; projects: { slug: string; name: string }[] };

export function HeroAdsAdminPanel({ developers }: { developers: DeveloperOption[] }) {
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <div className="space-y-6">
      <HeroAdRequestForm developers={developers} onCreated={() => setRefreshKey((key) => key + 1)} />
      <HeroAdsManager key={refreshKey} />
    </div>
  );
}

const STATUS_LABEL: Record<HeroAdStatus, string> = {
  pending: "Pending review",
  approved: "Live in rotation",
  rejected: "Rejected",
  archived: "Archived",
};

const STATUS_STYLE: Record<HeroAdStatus, string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-700",
  archived: "bg-stone-200 text-stone-600",
};

function isLive(ad: HeroAd) {
  const today = new Date().toISOString().slice(0, 10);
  return ad.status === "approved" && ad.startDate <= today && ad.endDate >= today;
}

export function HeroAdsManager() {
  const [ads, setAds] = useState<HeroAd[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [priceDrafts, setPriceDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/hero-ads");
      const data = await response.json().catch(() => null);
      setAds(Array.isArray(data?.ads) ? data.ads : []);
    } catch {
      setError("Unable to load hero banner requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const patchAd = async (id: string, changes: Record<string, unknown>) => {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/hero-ads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(changes),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => null);
        setError(data?.error ?? "Unable to update this request.");
        return;
      }
      await load();
    } catch {
      setError("Unable to update this request.");
    } finally {
      setBusyId(null);
    }
  };

  const removeAd = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const response = await fetch(`/api/hero-ads/${id}`, { method: "DELETE" });
      if (!response.ok) {
        setError("Unable to delete this request.");
        return;
      }
      await load();
    } catch {
      setError("Unable to delete this request.");
    } finally {
      setBusyId(null);
    }
  };

  const moveOrder = async (ad: HeroAd, direction: "up" | "down") => {
    const approved = ads.filter((item) => item.status === "approved").sort((a, b) => a.order - b.order);
    const index = approved.findIndex((item) => item.id === ad.id);
    const swapIndex = direction === "up" ? index - 1 : index + 1;
    if (index === -1 || swapIndex < 0 || swapIndex >= approved.length) return;

    const other = approved[swapIndex];
    setBusyId(ad.id);
    setError("");
    try {
      await Promise.all([
        fetch(`/api/hero-ads/${ad.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: other.order }) }),
        fetch(`/api/hero-ads/${other.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order: ad.order }) }),
      ]);
      await load();
    } catch {
      setError("Unable to reorder requests.");
    } finally {
      setBusyId(null);
    }
  };

  const savePrice = async (ad: HeroAd) => {
    const draft = priceDrafts[ad.id];
    const value = draft === undefined ? ad.priceLkr : draft.trim() === "" ? null : Number(draft);
    await patchAd(ad.id, { priceLkr: value });
  };

  if (loading) {
    return <div className="border border-stone-200 bg-white p-4 text-sm text-stone-500">Loading hero banner requests...</div>;
  }

  const pending = ads.filter((ad) => ad.status === "pending");
  const approved = ads.filter((ad) => ad.status === "approved").sort((a, b) => a.order - b.order);
  const other = ads.filter((ad) => ad.status === "rejected" || ad.status === "archived");

  const renderRow = (ad: HeroAd) => (
    <div key={ad.id} className="grid gap-3 border border-stone-200 bg-white p-3 sm:grid-cols-[120px_minmax(0,1fr)_auto]">
      <div className="relative h-20 w-full overflow-hidden border border-stone-200 bg-stone-100 sm:h-20 sm:w-30">
        {ad.image ? <Image src={ad.image} alt={ad.headline} fill className="object-cover" sizes="120px" /> : null}
      </div>
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-stone-900">{ad.headline}</p>
          <span className={`px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${STATUS_STYLE[ad.status]}`}>{STATUS_LABEL[ad.status]}</span>
          {isLive(ad) ? <span className="bg-stone-900 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-white">Live now</span> : null}
          {ad.priceLkr ? (
            <span className="bg-[#f47b36] px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-900">{formatLkr(ad.priceLkr)}</span>
          ) : (
            <span className="bg-stone-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-stone-600">Free (promotional)</span>
          )}
        </div>
        <p className="text-xs text-stone-600">{ad.developerName}{ad.projectSlug ? ` · ${ad.projectSlug}` : ""}</p>
        <p className="text-xs text-stone-500">{ad.startDate} to {ad.endDate} · links to {ad.linkUrl}</p>
        {ad.reviewNote ? <p className="text-xs text-stone-500">Note: {ad.reviewNote}</p> : null}
        <div className="flex items-center gap-2 pt-1">
          <label className="text-xs text-stone-500" htmlFor={`price-${ad.id}`}>Price (LKR)</label>
          <input
            id={`price-${ad.id}`}
            type="number"
            min="0"
            step="1"
            placeholder="Free"
            defaultValue={ad.priceLkr ?? ""}
            onChange={(event) => setPriceDrafts((current) => ({ ...current, [ad.id]: event.target.value }))}
            className="w-28 border border-stone-300 px-2 py-1 text-xs"
          />
          <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => savePrice(ad)}>Save price</Button>
        </div>
      </div>
      <div className="flex flex-wrap items-start gap-2 sm:justify-end">
        {ad.status === "pending" ? (
          <>
            <Button size="sm" disabled={busyId === ad.id} onClick={() => patchAd(ad.id, { status: "approved" })}>Approve</Button>
            <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => patchAd(ad.id, { status: "rejected" })}>Reject</Button>
          </>
        ) : null}
        {ad.status === "approved" ? (
          <>
            <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => moveOrder(ad, "up")}>Move up</Button>
            <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => moveOrder(ad, "down")}>Move down</Button>
            <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => patchAd(ad.id, { status: "archived" })}>Unpublish</Button>
          </>
        ) : null}
        {ad.status === "rejected" || ad.status === "archived" ? (
          <Button size="sm" variant="outline" disabled={busyId === ad.id} onClick={() => patchAd(ad.id, { status: "approved" })}>Republish</Button>
        ) : null}
        <Button size="sm" variant="destructive" disabled={busyId === ad.id} onClick={() => removeAd(ad.id)}>Delete</Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <p className="border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
        Hero placements are free while the site is building traffic. Approve requests as normal — pricing is optional right now, so you can set a price per placement later without it blocking approval.
      </p>
      {error ? <p className="border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-900">Pending requests ({pending.length})</h3>
        {pending.length === 0 ? <p className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">No builder requests waiting for review.</p> : <div className="grid gap-2">{pending.map(renderRow)}</div>}
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-stone-900">Live homepage rotation ({approved.length})</h3>
        {approved.length === 0 ? <p className="border border-dashed border-stone-300 p-4 text-sm text-stone-500">No approved images. The homepage hero falls back to its default slideshow.</p> : <div className="grid gap-2">{approved.map(renderRow)}</div>}
      </div>

      {other.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-stone-900">Rejected / archived ({other.length})</h3>
          <div className="grid gap-2">{other.map(renderRow)}</div>
        </div>
      ) : null}
    </div>
  );
}
