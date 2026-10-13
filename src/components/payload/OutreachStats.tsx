"use client";

import { useEffect, useState } from "react";

// Stats strip above the Outreach log list (owner, 2026-10-12: "you can add stats also"). Computed in the browser from the rows
// (a few hundred at most) and the list of verified developers.
type Row = { status?: string; clickCount?: number; developer?: number | { id: number } | null };

const box = { border: "1px solid var(--theme-elevation-150)", padding: "12px 16px", minWidth: 130, flex: "1 1 130px" } as const;

export function OutreachStats() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [verified, setVerified] = useState<Set<number>>(new Set());

  useEffect(() => {
    fetch("/payload-api/outreach?limit=1000&depth=0&select[status]=true&select[clickCount]=true&select[developer]=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((b) => setRows((b.docs ?? []) as Row[]))
      .catch(() => setRows([]));
    fetch("/payload-api/developers?where[domain_verified][equals]=true&limit=500&depth=0&select[name]=true", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : { docs: [] }))
      .then((b) => setVerified(new Set((b.docs ?? []).map((d: { id: number }) => d.id))))
      .catch(() => setVerified(new Set()));
  }, []);

  if (!rows) return null;
  const sent = rows.filter((r) => r.status && r.status !== "draft");
  const drafts = rows.length - sent.length;
  const clicked = sent.filter((r) => (r.clickCount ?? 0) > 0);
  const totalClicks = rows.reduce((n, r) => n + (r.clickCount ?? 0), 0);
  const replied = sent.filter((r) => r.status === "replied").length;
  const idOf = (r: Row) => (r.developer && typeof r.developer === "object" ? r.developer.id : (r.developer as number | null | undefined) ?? null);
  const reached = new Set(sent.map(idOf).filter((x): x is number => x !== null));
  const verifiedReached = [...reached].filter((id) => verified.has(id)).length;
  const rate = sent.length ? Math.round((clicked.length / sent.length) * 100) : 0;
  const tiles: [string, string, string][] = [
    ["Emails sent", String(sent.length), drafts ? `${drafts} draft${drafts === 1 ? "" : "s"} waiting` : "no drafts"],
    ["Clicked a link", String(clicked.length), sent.length ? `${rate}% of sent` : "nothing sent yet"],
    ["Total clicks", String(totalClicks), "all links combined"],
    ["Replied", String(replied), "marked by you"],
    ["Companies reached", String(reached.size), "unique, sent only"],
    ["Verified since", `${verifiedReached}`, reached.size ? `of ${reached.size} reached` : "—"],
  ];
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 12, margin: "0 0 20px" }}>
      {tiles.map(([k, v, note]) => (
        <div key={k} style={box}>
          <div style={{ fontSize: 12, opacity: 0.65, textTransform: "none" }}>{k}</div>
          <div style={{ fontSize: 26, fontWeight: 700, lineHeight: 1.2 }}>{v}</div>
          <div style={{ fontSize: 12, opacity: 0.6 }}>{note}</div>
        </div>
      ))}
    </div>
  );
}
