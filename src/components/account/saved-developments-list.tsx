"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Building2 } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { SavedProfileItem } from "@/lib/saved-profiles";

// Followed developers AND followed partner-directory profiles (marketing/
// sales companies, architects, interior designers, construction companies)
// in one list — the two live in different tables (saved_developers /
// saved_companies), which only matters for the Unfollow button.
export function SavedDevelopmentsList({ userId, initialItems }: { userId: string; initialItems: SavedProfileItem[] }) {
  const [items, setItems] = useState(initialItems);

  const unfollow = async (item: SavedProfileItem) => {
    const supabase = createSupabaseBrowserClient();
    if (item.kind === "developer") {
      await supabase.from("saved_developers").delete().eq("user_id", userId).eq("developer_slug", item.slug);
    } else {
      await supabase.from("saved_companies").delete().eq("user_id", userId).match({ entity_type: item.kind, entity_slug: item.slug });
    }
    setItems((prev) => prev.filter((entry) => !(entry.kind === item.kind && entry.slug === item.slug)));
  };

  if (items.length === 0) {
    return (
      <p style={{ marginTop: 24 }}>
        You&apos;re not following anyone yet. <Link href="/developers">Browse developers</Link> or <Link href="/construction-companies">construction companies</Link> and follow one to track them here.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {items.map((item) => (
        <article key={`${item.kind}:${item.slug}`} className="grid gap-3 border border-stone-200 bg-white p-3 sm:grid-cols-[80px_1fr_auto] sm:items-center">
          <div className="relative flex h-16 w-full items-center justify-center overflow-hidden border border-stone-200 bg-stone-100">
            {item.logo ? (
              <Image src={item.logo} alt={item.name} fill className="object-contain p-2" sizes="80px" />
            ) : (
              <Building2 className="h-6 w-6 text-stone-400" aria-hidden="true" />
            )}
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-stone-900">{item.name}</p>
            <p className="text-sm text-stone-600">{item.label}{item.meta && item.meta !== item.label ? ` · ${item.meta}` : ""}</p>
            {item.kind === "developer" ? <p className="text-xs text-stone-400">New units and price changes will show here once notifications launch.</p> : null}
          </div>
          <div className="flex flex-row flex-wrap items-start gap-2 sm:flex-col sm:justify-start">
            <Link href={item.href} className="border border-stone-900 bg-stone-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-stone-800">
              View {item.kind === "developer" ? "developer" : "profile"}
            </Link>
            <button type="button" onClick={() => unfollow(item)} className="border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              Unfollow
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
