"use client";

import { BarChart3, Building2, CircleHelp, LayoutTemplate, UserPlus } from "lucide-react";
import { QuickjumpBar } from "./quickjump-bar";

/**
 * /for-developers' own floating bottom menu (owner, 2026-09-29: "also add a
 * floating menu on the bottom for developers page") — same QuickjumpBar
 * /web-design and every listing page already use, just this page's own
 * section anchors. "Register" links straight to /developers/register
 * rather than opening a popup — this page's whole point is that signup,
 * so it gets its own tab instead of a Contact popup.
 */
export function ForDevelopersQuickjump() {
  return (
    <QuickjumpBar
      items={[
        { href: "#show-product", label: "Overview", icon: LayoutTemplate },
        { href: "#analytics", label: "Analytics", icon: BarChart3 },
        { href: "#listings", label: "Listings", icon: Building2 },
        { href: "#faq", label: "FAQ", icon: CircleHelp },
        { href: "/developers/register", label: "Register", icon: UserPlus },
      ]}
      gateSelector=".fdv-hero"
    />
  );
}
