"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { DashboardHeader, DashboardSidebar, ACCOUNT_NAV_LINKS } from "@/components/dashboard/components";
import { useCompare } from "@/lib/use-compare";
import { formatLkr } from "@/lib/format";
import type { Project } from "@/types";

type CompareItem = Project & { basePath: "/projects" | "/land" };

const ROWS: { label: string; render: (item: CompareItem) => string }[] = [
  { label: "Price", render: (item) => (item.startingPriceLkr > 0 ? formatLkr(item.startingPriceLkr) : item.priceRange || "—") },
  { label: "Size", render: (item) => item.floorAreaRange || "—" },
  { label: "Bedrooms", render: (item) => item.bedrooms || "—" },
  { label: "Location", render: (item) => item.location || "—" },
  { label: "Completion date", render: (item) => (item.completionYear ? String(item.completionYear) : item.status) },
  { label: "Builder", render: (item) => item.developerName || "—" },
  { label: "Ownership", render: (item) => item.ownership || "—" },
];

export default function ComparePage() {
  const { entries, remove, clear, max } = useCompare();
  const [items, setItems] = useState<CompareItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (entries.length === 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const projectSlugs = entries.filter((entry) => entry.basePath === "/projects").map((entry) => entry.slug);
    const landSlugs = entries.filter((entry) => entry.basePath === "/land").map((entry) => entry.slug);
    const params = new URLSearchParams();
    if (projectSlugs.length) params.set("projectSlugs", projectSlugs.join(","));
    if (landSlugs.length) params.set("landSlugs", landSlugs.join(","));
    fetch(`/api/compare?${params.toString()}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.items)) setItems(data.items);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [entries]);

  return (
    <div className="grid gap-4 px-4 pt-6 pb-16 lg:grid-cols-[220px_1fr] lg:px-6 lg:pt-8">
      <DashboardSidebar links={ACCOUNT_NAV_LINKS} />
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <DashboardHeader title={`Compare (${entries.length}/${max})`} subtitle="Properties you've selected for side-by-side comparison." />
          {entries.length > 0 ? (
            <button type="button" onClick={clear} className="border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              Clear all
            </button>
          ) : null}
        </div>

        {loading ? null : items.length === 0 ? (
          <p className="text-sm text-stone-600">
            Nothing to compare yet — tap the compare icon on any listing card to add up to {max} here.
          </p>
        ) : (
          <div className="overflow-x-auto border border-stone-200 bg-white">
            <table className="w-full min-w-190 text-sm">
              <thead>
                <tr className="bg-stone-50">
                  <th className="w-36 p-3 text-left align-bottom text-xs uppercase tracking-wide text-stone-500">Property</th>
                  {items.map((item) => (
                    <th key={item.slug} className="min-w-56 p-3 text-left align-top">
                      <div className="flex items-start justify-between gap-2">
                        <Link href={`${item.basePath}/${item.slug}`} className="block">
                          <div className="relative h-24 w-full overflow-hidden border border-stone-200 bg-stone-100">
                            <Image src={item.heroImage} alt={item.name} fill className="object-cover" sizes="220px" />
                          </div>
                          <p className="mt-2 font-semibold text-stone-900">{item.name}</p>
                        </Link>
                        <button type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.slug)} className="shrink-0 text-stone-400 hover:text-stone-700">
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.label} className="border-t border-stone-200">
                    <th className="p-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500">{row.label}</th>
                    {items.map((item) => (
                      <td key={item.slug} className="p-3 text-stone-800">{row.render(item)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
