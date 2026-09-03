"use client";

import { useCallback, useEffect, useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";
import type { SavedSearch } from "@/types";

type SavedSearchRow = {
  id: number;
  user_id: string;
  name: string;
  filters: Record<string, unknown>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function rowToSavedSearch(row: SavedSearchRow): SavedSearch {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    filters: row.filters,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function useSavedSearches() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searches, setSearches] = useState<SavedSearch[]>([]);

  const load = useCallback(async () => {
    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    setUserId(user?.id ?? null);

    if (!user) {
      setSearches([]);
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from("saved_searches")
      .select("id, user_id, name, filters, is_active, created_at, updated_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    setSearches((data ?? []).map((row) => rowToSavedSearch(row as SavedSearchRow)));
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
  }, [load]);

  const create = useCallback(
    async (name: string, filters: Record<string, unknown> = {}) => {
      if (!userId) return;
      const supabase = createSupabaseBrowserClient();
      await supabase.from("saved_searches").insert({ user_id: userId, name, filters, is_active: true });
      await load();
    },
    [userId, load]
  );

  const toggleActive = useCallback(
    async (id: number, isActive: boolean) => {
      const supabase = createSupabaseBrowserClient();
      await supabase.from("saved_searches").update({ is_active: isActive }).eq("id", id);
      setSearches((prev) => prev.map((search) => (search.id === id ? { ...search, isActive } : search)));
    },
    []
  );

  const remove = useCallback(async (id: number) => {
    const supabase = createSupabaseBrowserClient();
    await supabase.from("saved_searches").delete().eq("id", id);
    setSearches((prev) => prev.filter((search) => search.id !== id));
  }, []);

  return { userId, loading, searches, create, toggleActive, remove };
}
