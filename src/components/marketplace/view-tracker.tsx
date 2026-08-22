"use client";

import { useEffect } from "react";

const SESSION_KEY = "lankaliving-session-id";

function getSessionId() {
  const existing = localStorage.getItem(SESSION_KEY);
  if (existing) return existing;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(SESSION_KEY, id);
  return id;
}

export function ProjectViewTracker({
  projectSlug,
  developerSlug,
}: {
  projectSlug: string;
  developerSlug: string;
}) {
  useEffect(() => {
    const sessionId = getSessionId();

    fetch("/api/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectSlug, developerSlug, sessionId }),
    }).catch(() => {
      // No-op for UI mode.
    });
  }, [projectSlug, developerSlug]);

  return null;
}
