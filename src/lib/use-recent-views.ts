"use client";

import { useEffect, useState } from "react";
import { SESSION_KEY } from "@/components/marketplace/view-tracker";
import type { Project } from "@/types";

export function useRecentViews() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only ever join against an id that a real page visit already created —
    // minting a fresh session id here would just be a key that never
    // matches anything in project_views.
    const sessionId = localStorage.getItem(SESSION_KEY);
    if (!sessionId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    fetch(`/api/recent-views?sessionId=${encodeURIComponent(sessionId)}`)
      .then((response) => response.json())
      .then((data) => {
        if (Array.isArray(data?.projects)) setProjects(data.projects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { projects, loading };
}
