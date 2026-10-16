"use client";

import { LayoutPanelTop } from "lucide-react";
import type { FieldProps } from "./shared";
import { DeveloperEmailLog } from "../DeveloperEmailLog";
import { DeveloperOverview } from "../DeveloperOverview";
import { ListingTimeline } from "../ListingTimeline";
import { usePathname } from "next/navigation";

const human = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");

/** Payload `ui` field: a custom admin panel that stores no data. The preview only marks where it sits. */
export function UiField({ field }: FieldProps<null>) {
  if (field.name === "developer_emails") return <DeveloperEmailLog />;
  if (field.name === "activityTimeline") return <ActivityByRecord />;
  // Developer Overview tab: one real panel (numbers + timeline) instead of the three /cms placeholders.
  if (field.name === "developer_summary") return <DeveloperOverview mode="tiles" />;
  if (field.name === "overview_stats" || field.name === "profile_completeness") return null;
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
      <LayoutPanelTop size={14} />
      <span>Custom panel in /cms: <span className="font-medium text-fg">{human(field.custom ?? field.name ?? "panel")}</span> (no data stored)</span>
    </div>
  );
}

/** The Activity tab: the developer timeline on developers, the listing timeline on projects and lands, a company timeline on the rest. */
function ActivityByRecord() {
  const path = usePathname();
  if (path.startsWith("/dashboard/developers/")) return <DeveloperOverview mode="timeline" />;
  return <ListingTimeline />;
}
