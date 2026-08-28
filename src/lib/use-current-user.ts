"use client";

import { useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

type CurrentUser = {
  id: string;
  email: string | null;
  role: "buyer" | "developer";
  developerSlug: string | null;
} | null;

export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    const load = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();

      if (!authUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase.from("profiles").select("role, developer_slug").eq("id", authUser.id).single();

      setUser({
        id: authUser.id,
        email: authUser.email ?? null,
        role: profile?.role === "developer" ? "developer" : "buyer",
        developerSlug: profile?.developer_slug ?? null,
      });
      setLoading(false);
    };

    load();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      load();
    });

    return () => subscription.unsubscribe();
  }, []);

  return { user, loading };
}
