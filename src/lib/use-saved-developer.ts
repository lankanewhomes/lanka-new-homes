"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

// Mirrors use-saved-listing.ts exactly, for developer follows instead of
// project bookmarks — a distinct saved_developers table/concept from the
// dashboard's point of view ("Saved Developments" vs. "Saved Properties").
export function useSavedDeveloper(developerSlug: string) {
  const [saved, setSaved] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const router = useRouter();

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

      const { data } = await supabase
        .from("saved_developers")
        .select("id")
        .eq("user_id", user.id)
        .eq("developer_slug", developerSlug)
        .maybeSingle();
      if (!cancelled) setSaved(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [developerSlug]);

  const toggle = async () => {
    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (saved) {
      await supabase.from("saved_developers").delete().eq("user_id", userId).eq("developer_slug", developerSlug);
      setSaved(false);
    } else {
      await supabase.from("saved_developers").insert({ user_id: userId, developer_slug: developerSlug });
      setSaved(true);
    }
  };

  return { saved, toggle };
}
