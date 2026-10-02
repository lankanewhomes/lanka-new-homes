"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { AccountShell, AccountPageHero } from "@/components/account/account-shell";
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
    <AccountShell active="/account/compare">
      <AccountPageHero
        title="Compare."
        intro={`Properties you have selected for side-by-side comparison. You can compare up to ${max}.`}
        stat={{ label: `Selected of ${max}`, value: entries.length }}
        cta={{ label: "Browse new homes", href: "/projects" }}
      />
      <section className="fdv-box fdv-box--lilac" id="compare" aria-label="Compare">
        {loading ? null : items.length === 0 ? (
          <div className="fdv-box-card account-empty">
            <p>Nothing to compare yet. Tap the compare icon on any listing card to add up to {max} here.</p>
            <Link href="/projects" className="account-link">Browse new homes</Link>
          </div>
        ) : (
          <>
            <div className="account-toolbar">
              <button type="button" onClick={clear} className="account-btn">Clear all</button>
            </div>
            <div className="account-table-wrap">
              <table className="account-table">
                <thead>
                  <tr>
                    <th scope="col">Property</th>
                    {items.map((item) => (
                      <th key={item.slug} scope="col">
                        <Link href={`${item.basePath}/${item.slug}`} className="account-table-property">
                          <span className="account-table-photo">
                            <Image src={item.heroImage} alt={item.name} fill sizes="240px" className="account-home-card-img" />
                          </span>
                          <span>{item.name}</span>
                        </Link>
                        <button type="button" aria-label={`Remove ${item.name}`} onClick={() => remove(item.slug)} className="account-table-remove">
                          <X className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {ROWS.map((row) => (
                    <tr key={row.label}>
                      <th scope="row">{row.label}</th>
                      {items.map((item) => (
                        <td key={item.slug}>{row.render(item)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>
    </AccountShell>
  );
}
