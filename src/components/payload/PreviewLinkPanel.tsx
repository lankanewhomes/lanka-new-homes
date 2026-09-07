"use client";

import { useState } from "react";
import { useFormFields } from "@payloadcms/ui";

export function PreviewLinkPanel() {
  const slug = useFormFields(([fields]) => fields.slug?.value as string | undefined);
  const isPublished = useFormFields(([fields]) => fields.isPublished?.value as boolean | undefined);
  const [copied, setCopied] = useState(false);

  if (!slug) {
    return (
      <p style={{ fontSize: 13, opacity: 0.65 }}>Save this listing with a slug to get a preview link.</p>
    );
  }

  const path = `/listing-preview/${slug}`;
  const href = typeof window !== "undefined" ? `${window.location.origin}${path}` : path;

  const copyLink = () => {
    navigator.clipboard.writeText(href).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div
      style={{
        border: "1px solid var(--theme-elevation-150)",
        borderRadius: 4,
        padding: "12px 14px",
        background: "var(--theme-elevation-0)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
        flexWrap: "wrap",
      }}
    >
      <div>
        <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: 0.4, opacity: 0.65 }}>
          Preview link
        </div>
        <a href={path} target="_blank" rel="noreferrer" style={{ fontSize: 14 }}>
          {href}
        </a>
        <div style={{ fontSize: 12, marginTop: 4, opacity: 0.75 }}>
          {isPublished
            ? "This listing is live on the site — this link just mirrors it."
            : "Not published yet — only visible via this link, not on the live site."}
        </div>
      </div>
      <button
        type="button"
        onClick={copyLink}
        className="btn btn--icon-style-without-border"
        style={{
          border: "1px solid var(--theme-elevation-150)",
          borderRadius: 4,
          padding: "6px 12px",
          background: "transparent",
          cursor: "pointer",
          fontSize: 13,
          whiteSpace: "nowrap",
        }}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
