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
      <div className="fdv-box-card account-empty">
        <p>You are not following anyone yet. Follow a developer or company to track their new units and price changes here.</p>
        <Link href="/developers" className="account-link">Browse developers</Link>
      </div>
    );
  }

  return (
    <div className="account-stack">
      {items.map((item) => (
        <article key={`${item.kind}:${item.slug}`} className="account-panel account-follow-row">
          <span className="account-follow-logo account-follow-logo--lg">
            {item.logo ? (
              <Image src={item.logo} alt={item.name} fill sizes="72px" className="account-follow-logo-img" />
            ) : (
              <Building2 className="account-follow-fallback" aria-hidden="true" />
            )}
          </span>
          <div className="account-follow-body">
            <h2>{item.name}</h2>
            <p className="account-muted">{item.label}{item.meta && item.meta !== item.label ? ` · ${item.meta}` : ""}</p>
            {item.kind === "developer" ? (
              <p className="account-muted account-small">
                You will get an email when this developer adds units, changes prices or posts a construction update, as long as email notifications are on in your settings.
              </p>
            ) : null}
          </div>
          <div className="account-card-actions account-card-actions--row">
            <Link href={item.href} className="account-btn account-btn--dark">View {item.kind === "developer" ? "developer" : "profile"}</Link>
            <button type="button" onClick={() => unfollow(item)} className="account-btn">Unfollow</button>
          </div>
        </article>
      ))}
    </div>
  );
}
