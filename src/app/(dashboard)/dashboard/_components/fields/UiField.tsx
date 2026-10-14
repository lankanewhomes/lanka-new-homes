"use client";

import { LayoutPanelTop } from "lucide-react";
import type { FieldProps } from "./shared";

const human = (s: string) => s.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");

/** Payload `ui` field: a custom admin panel that stores no data. The preview only marks where it sits. */
export function UiField({ field }: FieldProps<null>) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-dashed border-line px-3 py-2 text-xs text-muted">
      <LayoutPanelTop size={14} />
      <span>Custom panel in /cms: <span className="font-medium text-fg">{human(field.custom ?? field.name ?? "panel")}</span> (no data stored)</span>
    </div>
  );
}
