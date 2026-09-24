"use client";

import { useState, type FormEvent } from "react";

// Replaces the old plain "Coming soon" pill (owner, 2026-09-24: "the paid
// columns have no action, so interested builders can't do anything. This
// way you collect leads before launch"). Opens a small modal, submits to
// the public plan-waitlist collection (PlanWaitlist.ts — same "guests can
// submit without an account" access pattern as Leads.ts), pre-filled with
// which plan's button was clicked.
export function EarlyAccessButton({ plan, planName }: { plan: string; planName: string }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  const close = () => {
    setOpen(false);
    setError("");
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/payload-api/plan-waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, company, interested_plan: plan }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.errors?.[0]?.message ?? "Couldn't submit — please try again.");
      }
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't submit — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <button type="button" className="pricing-table-cta" onClick={() => setOpen(true)}>
        Get early access
      </button>
      {open && (
        <div className="pricing-early-access-overlay" role="dialog" aria-modal="true" aria-label={`Get early access to ${planName}`}>
          <div className="pricing-early-access-modal">
            <button type="button" className="pricing-early-access-close" aria-label="Close" onClick={close}>
              ×
            </button>
            {done ? (
              <>
                <h3>Thanks!</h3>
                <p>We&apos;ll reach out as soon as {planName} is ready to buy.</p>
                <button type="button" className="pricing-table-cta" onClick={close}>
                  Close
                </button>
              </>
            ) : (
              <>
                <h3>Get early access — {planName}</h3>
                <p>Leave your details and we&apos;ll contact you the moment paid plans go live.</p>
                <form onSubmit={onSubmit} className="pricing-early-access-form">
                  <label>
                    <span className="sr-only">Name</span>
                    <input type="text" placeholder="Your name" required value={name} onChange={(e) => setName(e.target.value)} />
                  </label>
                  <label>
                    <span className="sr-only">Email</span>
                    <input type="email" placeholder="Email address" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </label>
                  <label>
                    <span className="sr-only">Company</span>
                    <input type="text" placeholder="Company (optional)" value={company} onChange={(e) => setCompany(e.target.value)} />
                  </label>
                  {error && <p className="auth-error">{error}</p>}
                  <button type="submit" className="pricing-table-cta" disabled={submitting}>
                    {submitting ? "Submitting…" : "Request early access"}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
