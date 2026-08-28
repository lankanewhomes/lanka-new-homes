"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

export function useSavedListing(projectSlug: string) {
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
        .from("saved_listings")
        .select("id")
        .eq("user_id", user.id)
        .eq("project_slug", projectSlug)
        .maybeSingle();
      if (!cancelled) setSaved(Boolean(data));
    })();

    return () => {
      cancelled = true;
    };
  }, [projectSlug]);

  const toggle = async () => {
    if (!userId) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    if (saved) {
      await supabase.from("saved_listings").delete().eq("user_id", userId).eq("project_slug", projectSlug);
      setSaved(false);
    } else {
      await supabase.from("saved_listings").insert({ user_id: userId, project_slug: projectSlug });
      setSaved(true);
    }
  };

  return { saved, toggle };
}
