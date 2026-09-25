"use client";

import { useEffect, useState } from "react";
import { useDocumentInfo } from "@payloadcms/ui";
import { formatLkr } from "@/lib/format";
import { ADDON_PRICES, type AddonType } from "@/lib/packages";

type ProjectDoc = { id: string | number; developer?: { id: string | number; plan?: string } | string | number | null };
type AddonRequestDoc = {
  id: string | number;
  addon_type: AddonType;
  price: number;
  status: string;
  createdAt: string;
};

const ADDON_LABEL: Record<AddonType, string> = {
  newsletter: "Newsletter feature",
  social: "Social media push",
};

const STATUS_LABEL: Record<string, string> = {
  requested: "Requested — awaiting confirmation",
  confirmed: "Confirmed",
  fulfilled: "Fulfilled",
  canceled: "Canceled",
};

function relatedPlan(value: ProjectDoc["developer"]): string {
  return value && typeof value === "object" && "plan" in value ? (value.plan as string) || "free" : "free";
}

function relatedId(value: unknown): string | number | undefined {
  if (value && typeof value === "object" && "id" in value) return (value as { id: string | number }).id;
  return typeof value === "string" || typeof value === "number" ? value : undefined;
}

// Mounted as the "Promotion" tab on the Project edit form — lets a
// developer request a one-off newsletter feature or social media push for
// THIS project. Free/Featured/Featured Plus pay the flat à la carte price;
// Developer Pro gets one included per quarter (quota isn't auto-tracked —
// an admin manages that when confirming); Campaign has it bundled, so this
// just points them to their account team instead of taking a request.
// Owner, 2026-09-24: "can we built this. No à la carte purchase flow
// exists yet." Every request is fulfilled by hand today (see
// AddonRequests.ts) — there's no newsletter system or automated social
// pipeline to actually send anything yet.
export function AddonRequestPanel() {
  const { id, collectionSlug } = useDocumentInfo();
  const [developerId, setDeveloperId] = useState<string | number | null>(null);
  const [plan, setPlan] = useState("free");
  const [requests, setRequests] = useState<AddonRequestDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState<AddonType | null>(null);
  const [notice, setNotice] = useState("");

  const load = async () => {
    if (!id || collectionSlug !== "projects") return;
    setLoading(true);
    setError("");
    try {
      const projectRes = await fetch(`/payload-api/projects/${id}?depth=1`, { credentials: "include" });
      const project: ProjectDoc = await projectRes.json();
      const devId = relatedId(project.developer);
      setDeveloperId(devId ?? null);
      setPlan(relatedPlan(project.developer));

      const requestsRes = await fetch(`/payload-api/addon-requests?where[project][equals]=${id}&depth=0&sort=-createdAt&limit=20`, { credentials: "include" });
      const requestsBody = await requestsRes.json();
      setRequests(Array.isArray(requestsBody?.docs) ? requestsBody.docs : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load.");
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  useEffect(() => { load(); }, [id, collectionSlug]);

  const requestAddon = async (addonType: AddonType) => {
    if (!id || !developerId) return;
    setSubmitting(addonType);
    setNotice("");
    setError("");
    try {
      const res = await fetch("/payload-api/addon-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ developer: developerId, project: id, addon_type: addonType }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Couldn't submit this request.");
      setNotice(`${ADDON_LABEL[addonType]} requested — we'll confirm shortly.`);
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit this request.");
    } finally {
      setSubmitting(null);
    }
  };

  if (collectionSlug !== "projects") return null;
  if (loading) return <p style={{ opacity: 0.7, fontSize: 13 }}>Loading…</p>;

  return (
    <div style={{ maxWidth: 640 }}>
      {plan === "campaign" ? (
        <p style={{ fontSize: 13.5, padding: "12px 14px", border: "1px solid var(--theme-elevation-150)", borderRadius: 6 }}>
          Newsletter and social media promotion are included with your Campaign package — contact us to schedule this project&apos;s feature.
        </p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {plan === "developer-pro" && (
            <p style={{ fontSize: 12.5, opacity: 0.75, margin: 0 }}>
              Developer Pro includes one newsletter or social push per quarter — request it below and we&apos;ll confirm it against your quota.
            </p>
          )}
          {(Object.keys(ADDON_PRICES) as AddonType[]).map((addonType) => (
            <div key={addonType} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "12px 14px", border: "1px solid var(--theme-elevation-150)", borderRadius: 6 }}>
              <div>
                <strong style={{ fontSize: 14 }}>{ADDON_LABEL[addonType]}</strong>
                <div style={{ fontSize: 12.5, opacity: 0.7 }}>
                  {plan === "developer-pro" ? "Included this quarter, or " : ""}
                  {formatLkr(ADDON_PRICES[addonType])} one-off
                </div>
              </div>
              <button
                type="button"
                disabled={submitting !== null}
                onClick={() => requestAddon(addonType)}
                style={{
                  fontSize: 12.5,
                  fontWeight: 600,
                  padding: "8px 16px",
                  borderRadius: 999,
                  border: "1px solid #f47b36",
                  background: "#f47b36",
                  color: "#1f1f1f",
                  cursor: submitting !== null ? "not-allowed" : "pointer",
                }}
              >
                {submitting === addonType ? "Submitting…" : "Request"}
              </button>
            </div>
          ))}
        </div>
      )}

      {notice && <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--theme-success-500)" }}>{notice}</p>}
      {error && <p style={{ marginTop: 12, fontSize: 12.5, color: "var(--theme-error-500)" }}>{error}</p>}

      {requests.length > 0 && (
        <div style={{ marginTop: 20 }}>
          <p style={{ fontSize: 13, fontWeight: 600, margin: "0 0 8px" }}>Requests for this project</p>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 6 }}>
            {requests.map((req) => (
              <li key={req.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, padding: "8px 12px", border: "1px solid var(--theme-elevation-150)", borderRadius: 4 }}>
                <span>{ADDON_LABEL[req.addon_type]} — {formatLkr(req.price)}</span>
                <span style={{ opacity: 0.75 }}>{STATUS_LABEL[req.status] ?? req.status}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
