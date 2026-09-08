"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { ProfileEntityType } from "@/types";

// Follow any profile page. Developers keep the existing `saved_developers`
// table (the account dashboard's "Saved Developments" reads it, and it has a
// foreign key to `developers`); every other profile type — marketing/sales
// companies, architects, interior designers, construction companies — goes
// to `saved_companies`, keyed by (entity_type, entity_slug). Same flow as
// use-saved-developer.ts / use-saved-listing.ts: guests are sent to /login
// and returned here afterwards.
export function useSavedProfile(entityType: ProfileEntityType, slug: string) {
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

  const table = entityType === "developer" ? "saved_developers" : "saved_companies";
  const match = entityType === "developer" ? { developer_slug: slug } : { entity_type: entityType, entity_slug: slug };

  useEffect(() => {
    let cancelled = false;
    const supabase = createSupabaseBrowserClient();

    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (cancelled) return;
      setUserId(user?.id ?? null);
      if (!user) return;

      const { data } = await supabase.from(table).select("id").eq("user_id", user.id).match(match).maybeSingle();
      if (!cancelled) setSaved(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
    // `match` is rebuilt every render; its identity is fully determined by these two.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, slug]);

  const toggle = async () => {
    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (saved) {
      await supabase.from(table).delete().eq("user_id", userId).match(match);
      setSaved(false);
    } else {
      await supabase.from(table).insert({ user_id: userId, ...match });
      setSaved(true);
    }
  };

  return { saved, toggle };
}
