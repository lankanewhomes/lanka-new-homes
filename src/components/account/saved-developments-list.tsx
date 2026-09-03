"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { Developer } from "@/types";

export function SavedDevelopmentsList({ userId, initialDevelopers }: { userId: string; initialDevelopers: Developer[] }) {
  const [developers, setDevelopers] = useState(initialDevelopers);

  const unfollow = async (slug: string) => {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("saved_developers").delete().eq("user_id", userId).eq("developer_slug", slug);
    setDevelopers((prev) => prev.filter((developer) => developer.slug !== slug));
  };

  if (developers.length === 0) {
    return (
      <p style={{ marginTop: 24 }}>
        You&apos;re not following any developers yet. <Link href="/developers">Browse developers</Link> and follow one to track their new projects here.
      </p>
    );
  }

  return (
    <div className="mt-6 space-y-3">
      {developers.map((developer) => (
        <article key={developer.slug} className="grid gap-3 border border-stone-200 bg-white p-3 sm:grid-cols-[80px_1fr_auto] sm:items-center">
          <div className="relative h-16 w-full overflow-hidden border border-stone-200 bg-stone-100">
            <Image src={developer.logo} alt={developer.name} fill className="object-contain p-2" sizes="80px" />
          </div>
          <div className="min-w-0 space-y-1">
            <p className="font-semibold text-stone-900">{developer.name}</p>
            <p className="text-sm text-stone-600">{developer.activeProjects} active project{developer.activeProjects === 1 ? "" : "s"} · {developer.completedProjects} completed</p>
            <p className="text-xs text-stone-400">New units and price changes will show here once notifications launch.</p>
          </div>
          <div className="flex flex-row flex-wrap items-start gap-2 sm:flex-col sm:justify-start">
            <Link href={`/developers/${developer.slug}`} className="border border-stone-900 bg-stone-900 px-3 py-1.5 text-center text-xs font-medium text-white hover:bg-stone-800">
              View developer
            </Link>
            <button type="button" onClick={() => unfollow(developer.slug)} className="border border-stone-300 px-3 py-1.5 text-xs font-medium text-stone-700 hover:bg-stone-50">
              Unfollow
            </button>
          </div>
        </article>
      ))}
    </div>
  );
}
