"use client";

import { useState } from "react";
import type { ComponentType } from "react";
import { BarChart3, Building2, ChevronDown, Clock, Globe2, Layers, Phone, ShieldCheck, Sparkles, UploadCloud } from "lucide-react";

type FeatureItem = { icon: ComponentType<{ className?: string }>; label: string; body: string };
type FeatureGroup = { key: string; label: string; items: FeatureItem[] };

const GROUPS: FeatureGroup[] = [
  {
    key: "discovered",
    label: "Get discovered",
    items: [
      { icon: ShieldCheck, label: "A Verified badge on your name", body: "Once your company profile is reviewed and approved, a Verified badge shows on every listing, your builder card, and your profile — no extra application." },
      { icon: Globe2, label: "List in Sinhala and Tamil too", body: "Buyers can switch the whole site — including your project description — between English, Sinhala, and Tamil. Anything left blank just shows in English." },
      { icon: Sparkles, label: "Optional boosted placement", body: "When you want extra reach, feature a project on the homepage, a city or category page, or higher in search results — turned on whenever you want it." },
    ],
  },
  {
    key: "faster",
    label: "Move faster than a missed call",
    items: [
      { icon: Clock, label: "Instant lead alerts", body: "Every inquiry — from a listing, a floor plan, or a brochure download — reaches you the second it's submitted, before the buyer's even closed the tab." },
      { icon: Phone, label: "Free WhatsApp click-to-chat", body: "Add your WhatsApp number once and a chat button appears on your listings automatically — no API keys, no setup, no cost." },
      { icon: BarChart3, label: "A dashboard that answers “how are we doing”", body: "Views, saves, inquiries, WhatsApp clicks, response times, and where your traffic is coming from — per listing and across your whole portfolio." },
    ],
  },
  {
    key: "busywork",
    label: "Let the platform do the busywork",
    items: [
      { icon: UploadCloud, label: "Already have a website or brochure?", body: "Paste the link or upload the PDF and we'll draft your first listing from it — photos sorted, highlights pulled out, contact details filled in." },
      { icon: Layers, label: "A checklist that tells you exactly what's left", body: "Every listing gets a live completeness score with a concrete to-do list — and a more complete listing genuinely ranks higher in search." },
      { icon: Building2, label: "Automatic repeat exposure", body: "Buyers who save your company get a weekly email whenever you change a price or post a construction update — free reminders, no extra work." },
    ],
  },
];

// Same accordion pattern as a real listing's Key Features section
// (KeyFeaturesSection in components.tsx) — reusing its exact CSS classes
// (.key-features-shell/-row/-row-trigger/-chevron/-row-body/-item) so this
// page's own "features" read like a native part of the site, not a
// separate marketing template.
export function ForDevelopersFeatures() {
  const [openKey, setOpenKey] = useState<string>(GROUPS[0]!.key);

  return (
    <section id="key-features" className="key-features-shell fd-key-features">
      <div className="key-features-pattern" aria-hidden="true" />
      <h2>Everything that comes with a listing</h2>

      <div className="key-features-list">
        {GROUPS.map((group) => {
          const isOpen = openKey === group.key;
          return (
            <div key={group.key} className={`key-features-row ${isOpen ? "open" : ""}`}>
              <button type="button" className="key-features-row-trigger" aria-expanded={isOpen} onClick={() => setOpenKey(isOpen ? "" : group.key)}>
                <span>{group.label}</span>
                <ChevronDown className="key-features-chevron h-6 w-6" aria-hidden="true" />
              </button>
              {isOpen ? (
                <div className="key-features-row-body fd-key-features-body">
                  {group.items.map((item) => (
                    <span key={item.label} className="key-features-item fd-key-features-item">
                      <item.icon className="fd-key-features-item-icon" aria-hidden="true" />
                      <span className="key-features-item-label">{item.label}</span>
                      {item.body}
                    </span>
                  ))}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
}
