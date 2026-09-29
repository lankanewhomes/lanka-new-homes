"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { SAMPLE_SITES, SampleDevices } from "./web-design-frames";

/**
 * Lets a visitor browse all the sample sites from the live-sample band on
 * /web-design (owner, 2026-09-28: "need more sample websites, built them") —
 * a row of pills picks which theme SampleDevices' laptop+phone preview shows,
 * and "Open the full sample" / the caption below follow the selection. Each
 * pill's own preview is a real, separately-built site (see the theme-*.ts
 * files), not a mockup swapped in for this switcher.
 */
export function SampleSiteSwitcher() {
  const [selectedId, setSelectedId] = useState<(typeof SAMPLE_SITES)[number]["id"]>(SAMPLE_SITES[0].id);
  const selected = SAMPLE_SITES.find((site) => site.id === selectedId) ?? SAMPLE_SITES[0];

  return (
    <div>
      <div className="wdx-sample-tabs" role="tablist" aria-label="Choose a sample site">
        {SAMPLE_SITES.map((site) => (
          <button
            key={site.id}
            type="button"
            role="tab"
            aria-selected={site.id === selectedId}
            className={`wdx-sample-tab${site.id === selectedId ? " is-active" : ""}`}
            onClick={() => setSelectedId(site.id)}
          >
            <span className="wdx-sample-tab-name">{site.label}</span>
            <span className="wdx-sample-tab-type">{site.propertyType}</span>
          </button>
        ))}
      </div>

      <SampleDevices embedSrc={selected.embedSrc} browserUrl={selected.browserUrl} label={selected.label} />

      <div className="wdx-sample-foot">
        <Link href={selected.href} className="fdv-cta-primary">Open the full sample <ArrowRight size={16} aria-hidden="true" /></Link>
        <p>Sample design — a fictional development ({selected.propertyType.toLowerCase()}) with illustrative images, prices and contact details.</p>
      </div>
    </div>
  );
}
