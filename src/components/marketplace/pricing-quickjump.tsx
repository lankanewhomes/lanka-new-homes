"use client";

import { HelpCircle, LayoutGrid, ListChecks, MapPin } from "lucide-react";
import { QuickjumpBar } from "./quickjump-bar";

/** /pricing's floating bottom menu — one item per section anchor (add one whenever a section is added). */
export function PricingQuickjump() {
  return (
    <QuickjumpBar
      items={[
        { href: "#packages", label: "Packages", icon: LayoutGrid },
        { href: "#how-it-works", label: "How it works", icon: ListChecks },
        { href: "#placements", label: "Placements", icon: MapPin },
        { href: "#faq", label: "FAQ", icon: HelpCircle },
      ]}
      gateSelector=".fdv-hero"
    />
  );
}
