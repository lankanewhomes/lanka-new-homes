"use client";

import { useState } from "react";
import Link from "next/link";

// Payload's default logout link is a small icon at the bottom of the left
// sidebar, easy to miss — this adds a conventional top-right "Account /
// Log out" menu instead, registered via admin.components.header in
// payload.config.ts (a global slot, not tied to any one collection/view).
// Fixed-position rather than trying to hook into Payload's own header DOM,
// so it renders reliably regardless of that internal structure.
export function TopRightAccountMenu() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ position: "fixed", top: 14, right: 56, zIndex: 100 }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          padding: "6px 12px",
          borderRadius: 999,
          border: "1px solid var(--theme-elevation-200)",
          background: "var(--theme-elevation-0)",
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Account ▾
      </button>
      {open && (
        <>
          <div
            style={{ position: "fixed", inset: 0, zIndex: 99 }}
            onClick={() => setOpen(false)}
          />
          <div
            style={{
              position: "absolute",
              top: "calc(100% + 6px)",
              right: 0,
              minWidth: 160,
              background: "var(--theme-elevation-0)",
              border: "1px solid var(--theme-elevation-200)",
              borderRadius: 6,
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              overflow: "hidden",
              zIndex: 100,
            }}
          >
            <Link
              href="/cms/account"
              style={{ display: "block", padding: "10px 14px", fontSize: 13, textDecoration: "none", color: "inherit" }}
            >
              Account
            </Link>
            <Link
              href="/cms/logout"
              style={{ display: "block", padding: "10px 14px", fontSize: 13, textDecoration: "none", color: "inherit", borderTop: "1px solid var(--theme-elevation-100)" }}
            >
              Log out
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
