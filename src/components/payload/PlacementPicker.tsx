"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { PAYMENT_TYPE_OPTIONS } from "@/collections/Payments";

type PlacementPricingDoc = {
  id: string | number;
  payment_type: string;
  featured_page?: string | null;
  tier_name?: string | null;
  price: number;
  currency: string;
  duration_days?: number | null;
  description?: string | null;
};

type ProjectOption = { id: string | number; name: string; slug: string };

type PaymentDoc = {
  id: string | number;
  payment_type: string;
  amount: number;
  currency: string;
  status: string;
  featured_page?: string | null;
  related_project?: { id: string | number; name?: string } | string | number | null;
  createdAt: string;
};

// Types that apply to one specific listing — the wizard shows a project
// picker for these. subscription/lead_package are company-wide products,
// not tied to a single project.
const PROJECT_SCOPED_TYPES = new Set(['featured_listing', 'featured_search', 'hero_slide', 'banner_ad', 'top_of_category'])

// Where each placement actually shows up on the live site — shown as a
// one-line description under each type card in step 1, so a developer
// knows what they're buying before they pick it.
const TYPE_DESCRIPTIONS: Record<string, string> = {
  featured_listing: "Shown in the Featured Listings section on the homepage, and on the matching city/category page.",
  featured_search: "Ranks higher in general search results across the site.",
  hero_slide: "Rotates in the large image carousel at the top of the homepage.",
  banner_ad: "A banner placement on relevant pages.",
  top_of_category: "Pinned near the top of its category page.",
  subscription: "Account-wide plan — more active listings and features, not tied to one project.",
  lead_package: "Adds a bundle of leads to your account — not tied to one project.",
}

const STATUS_LABEL: Record<string, string> = { pending: "Pending review", completed: "Active", failed: "Failed", refunded: "Refunded" };
const STATUS_COLOR: Record<string, string> = {
  pending: "var(--theme-warning-500)",
  completed: "var(--theme-success-500)",
  failed: "var(--theme-error-500)",
  refunded: "var(--theme-elevation-500)",
};

function formatMoney(amount: number, currency: string): string {
  return `${currency} ${amount.toLocaleString()}`;
}

// The step-by-step "choose a placement" flow for developers, reachable from
// the "✨ Get Featured" nav link (NavPlacementLink.tsx). Submitting creates
// a pending Payments record — same self-service-create-forced-to-pending
// pattern already used everywhere else (Developers, HeroSlides) — an admin
// confirms it manually in /cms today; real checkout comes once a payment
// gateway is chosen.
export function PlacementPicker() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [pricing, setPricing] = useState<PlacementPricingDoc[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [pastPayments, setPastPayments] = useState<PaymentDoc[]>([]);
  const [developerId, setDeveloperId] = useState<string | number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [selectedTierId, setSelectedTierId] = useState<string | number | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // Hero slide details — only collected when selectedType === 'hero_slide'.
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroImage, setHeroImage] = useState("");
  const [heroImageUploading, setHeroImageUploading] = useState(false);
  const [heroImageError, setHeroImageError] = useState("");
  const [heroLink, setHeroLink] = useState("");
  const [heroStartDate, setHeroStartDate] = useState("");
  const [heroEndDate, setHeroEndDate] = useState("");

  const resetHeroFields = () => {
    setHeroHeadline("");
    setHeroImage("");
    setHeroImageError("");
    setHeroLink("");
    setHeroStartDate("");
    setHeroEndDate("");
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const meRes = await fetch("/payload-api/users/me", { credentials: "include" });
        const me = await meRes.json();
        if (!me?.user) throw new Error("Please log in as a developer to request a placement.");

        const devRes = await fetch(`/payload-api/developers?where[user][equals]=${me.user.id}&depth=0&limit=1`, { credentials: "include" });
        const devBody = await devRes.json();
        const developer = devBody?.docs?.[0];
        if (!developer) throw new Error("No company profile linked to your account yet — set one up first.");
        setDeveloperId(developer.id);

        const [pricingRes, projectsRes, paymentsRes] = await Promise.all([
          fetch("/payload-api/placement-pricing?where[active][equals]=true&depth=0&limit=100", { credentials: "include" }),
          fetch(`/payload-api/projects?where[developer][equals]=${developer.id}&depth=0&limit=100`, { credentials: "include" }),
          fetch("/payload-api/payments?depth=1&limit=50&sort=-createdAt", { credentials: "include" }),
        ]);
        const pricingBody = await pricingRes.json();
        const projectsBody = await projectsRes.json();
        const paymentsBody = await paymentsRes.json();
        setPricing(Array.isArray(pricingBody?.docs) ? pricingBody.docs : []);
        setProjects(Array.isArray(projectsBody?.docs) ? projectsBody.docs.map((p: { id: string | number; name: string; slug: string }) => ({ id: p.id, name: p.name, slug: p.slug })) : []);
        setPastPayments(Array.isArray(paymentsBody?.docs) ? paymentsBody.docs : []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const typesWithPricing = useMemo(() => {
    const activeTypes = new Set(pricing.map((row) => row.payment_type));
    return PAYMENT_TYPE_OPTIONS.filter((option) => activeTypes.has(option.value));
  }, [pricing]);

  const tiersForSelectedType = useMemo(
    () => pricing.filter((row) => row.payment_type === selectedType),
    [pricing, selectedType],
  );
  const selectedTier = useMemo(() => tiersForSelectedType.find((row) => String(row.id) === String(selectedTierId)) ?? null, [tiersForSelectedType, selectedTierId]);
  const selectedProject = useMemo(() => projects.find((p) => String(p.id) === String(selectedProjectId)) ?? null, [projects, selectedProjectId]);
  const needsProject = selectedType ? PROJECT_SCOPED_TYPES.has(selectedType) : false;
  const isHeroSlide = selectedType === "hero_slide";

  const onHeroImageFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setHeroImageError("");
    setHeroImageUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "hero-slides");
      const response = await fetch("/api/uploads/image", { method: "POST", body: formData });
      const body = await response.json();
      if (!response.ok) throw new Error(body?.error ?? "Upload failed");
      setHeroImage(body.url);
    } catch (err) {
      setHeroImageError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setHeroImageUploading(false);
    }
  };

  const onSubmit = async () => {
    if (!selectedTier || !developerId) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      let relatedHeroSlideId: string | number | undefined;

      // Hero slides need the actual slide content created alongside the
      // payment request — HeroSlides.create already lets a developer
      // self-register one (forced to status: 'pending'), and
      // activatePlacementOnPayment already knows how to flip it to
      // 'active' once this payment is confirmed via related_hero_slide,
      // same as every other placement type auto-activating on confirm.
      if (isHeroSlide) {
        if (!heroHeadline.trim() || !heroImage.trim()) throw new Error("Add a headline and an image for the hero slide.");
        const heroRes = await fetch("/payload-api/hero-slides", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            headline: heroHeadline.trim(),
            image: heroImage.trim(),
            project: selectedProjectId,
            link: heroLink.trim() || (selectedProject ? `/projects/${selectedProject.slug}` : undefined),
            advertiser: developerId,
            start_date: heroStartDate || undefined,
            end_date: heroEndDate || undefined,
          }),
        });
        const heroBody = await heroRes.json();
        if (!heroRes.ok) throw new Error(heroBody?.errors?.[0]?.message ?? "Couldn't save the hero slide details.");
        relatedHeroSlideId = heroBody?.doc?.id;
      }

      const res = await fetch("/payload-api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          payer: { relationTo: "developers", value: developerId },
          amount: selectedTier.price,
          currency: selectedTier.currency,
          payment_type: selectedTier.payment_type,
          featured_page: selectedTier.featured_page || undefined,
          related_project: needsProject ? selectedProjectId : undefined,
          related_hero_slide: relatedHeroSlideId,
        }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body?.errors?.[0]?.message ?? "Couldn't submit this request.");
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Couldn't submit this request.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setSelectedType(null);
    setSelectedTierId(null);
    setSelectedProjectId(null);
    setSubmitted(false);
    setSubmitError("");
    resetHeroFields();
  };

  const cardStyle: React.CSSProperties = { border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 16, background: "var(--theme-elevation-0)", cursor: "pointer", textAlign: "left" };
  const cardSelectedStyle: React.CSSProperties = { ...cardStyle, border: "2px solid #f47b36" };

  return (
    <div style={{ padding: "24px 32px", maxWidth: 720 }}>
      <Link
        href="/cms"
        style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 13, color: "inherit", opacity: 0.7, textDecoration: "none", marginBottom: 16 }}
      >
        ← Back to Dashboard
      </Link>
      <h1 style={{ marginBottom: 4 }}>Get Featured</h1>
      <p style={{ opacity: 0.7, marginTop: 0, marginBottom: 24 }}>
        Choose a placement, pick a listing, and submit a request. We&apos;ll confirm your payment and activate it —
        usually within one business day.
      </p>

      {loading && <p style={{ opacity: 0.7 }}>Loading…</p>}
      {error && <p style={{ color: "var(--theme-error-500)" }}>{error}</p>}

      {!loading && !error && submitted && (
        <div style={{ border: "1px solid var(--theme-success-500)", background: "var(--theme-success-100)", borderRadius: 6, padding: 20, marginBottom: 24 }}>
          <p style={{ margin: 0, fontWeight: 600, color: "var(--theme-success-800)" }}>Request submitted.</p>
          <p style={{ margin: "6px 0 12px", fontSize: 14, color: "var(--theme-success-800)" }}>
            It&apos;s pending admin confirmation. Once your payment is confirmed, it activates automatically — no
            further steps needed from you.
          </p>
          <button type="button" onClick={resetWizard} style={{ fontSize: 13, padding: "8px 16px", borderRadius: 999, border: "1px solid var(--theme-elevation-200)", background: "transparent", color: "inherit", cursor: "pointer" }}>
            Request another placement
          </button>
        </div>
      )}

      {!loading && !error && !submitted && (
        <>
          {/* Step 1: type */}
          <div style={{ marginBottom: 20 }}>
            <h5 style={{ marginBottom: 10 }}>1. What kind of placement?</h5>
            {typesWithPricing.length === 0 ? (
              <p style={{ fontSize: 13, opacity: 0.65 }}>No placements are available to purchase right now — check back later.</p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                {typesWithPricing.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    style={selectedType === type.value ? cardSelectedStyle : cardStyle}
                    onClick={() => {
                      setSelectedType(type.value);
                      setSelectedTierId(null);
                      setSelectedProjectId(null);
                      resetHeroFields();
                      setStep(2);
                    }}
                  >
                    <strong style={{ fontSize: 14 }}>{type.label}</strong>
                    {TYPE_DESCRIPTIONS[type.value] && (
                      <div style={{ fontSize: 12, opacity: 0.65, marginTop: 4 }}>{TYPE_DESCRIPTIONS[type.value]}</div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Step 2: tier/page */}
          {step >= 2 && selectedType && (
            <div style={{ marginBottom: 20 }}>
              <h5 style={{ marginBottom: 10 }}>2. Choose an option</h5>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 10 }}>
                {tiersForSelectedType.map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    style={String(selectedTierId) === String(tier.id) ? cardSelectedStyle : cardStyle}
                    onClick={() => {
                      setSelectedTierId(tier.id);
                      setStep(needsProject ? 3 : 5);
                    }}
                  >
                    {tier.tier_name && <div style={{ fontWeight: 600, fontSize: 14 }}>{tier.tier_name}</div>}
                    {tier.featured_page && <div style={{ fontSize: 13, opacity: 0.75 }}>{tier.featured_page}</div>}
                    <div style={{ fontSize: 18, fontWeight: 700, marginTop: 6 }}>{formatMoney(tier.price, tier.currency)}</div>
                    {tier.duration_days && <div style={{ fontSize: 12, opacity: 0.65 }}>{tier.duration_days} days</div>}
                    {tier.description && <div style={{ fontSize: 12, opacity: 0.65, marginTop: 6 }}>{tier.description}</div>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 3: project */}
          {step >= 3 && needsProject && selectedTier && (
            <div style={{ marginBottom: 20 }}>
              <h5 style={{ marginBottom: 10 }}>3. Which listing?</h5>
              {projects.length === 0 ? (
                <p style={{ fontSize: 13, opacity: 0.65 }}>You don&apos;t have any listings yet — add a project first.</p>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
                  {projects.map((project) => (
                    <button
                      key={project.id}
                      type="button"
                      style={String(selectedProjectId) === String(project.id) ? cardSelectedStyle : cardStyle}
                      onClick={() => {
                        setSelectedProjectId(project.id);
                        if (isHeroSlide) {
                          setHeroLink((current) => current || `/projects/${project.slug}`);
                          setStep(4);
                        } else {
                          setStep(5);
                        }
                      }}
                    >
                      <strong style={{ fontSize: 14 }}>{project.name}</strong>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 4: hero slide details (hero_slide only) */}
          {step >= 4 && isHeroSlide && selectedProject && (
            <div style={{ marginBottom: 20 }}>
              <h5 style={{ marginBottom: 10 }}>4. Hero slide details</h5>
              <div style={{ display: "grid", gap: 12, maxWidth: 420 }}>
                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Headline
                  <input
                    type="text"
                    value={heroHeadline}
                    onChange={(e) => setHeroHeadline(e.target.value)}
                    placeholder='e.g. "Now Selling: Colombo Heights"'
                    style={{ padding: "8px 10px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", color: "inherit" }}
                  />
                </label>

                <div style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  <span>Image</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <input
                      type="text"
                      value={heroImage}
                      onChange={(e) => setHeroImage(e.target.value)}
                      placeholder="https://... (or upload below)"
                      style={{ flex: 1, minWidth: 200, padding: "8px 10px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", color: "inherit" }}
                    />
                    <label style={{ fontSize: 13, padding: "8px 14px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", cursor: heroImageUploading ? "not-allowed" : "pointer" }}>
                      {heroImageUploading ? "Uploading…" : "Upload image"}
                      <input type="file" accept="image/*" onChange={onHeroImageFileSelected} disabled={heroImageUploading} style={{ display: "none" }} />
                    </label>
                  </div>
                  {heroImageError && <p style={{ color: "var(--theme-error-500)", fontSize: 12, margin: 0 }}>{heroImageError}</p>}
                  {heroImage && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={heroImage} alt="Hero preview" style={{ width: "100%", maxWidth: 300, height: 120, objectFit: "cover", borderRadius: 4, border: "1px solid var(--theme-elevation-150)" }} />
                  )}
                </div>

                <label style={{ display: "grid", gap: 4, fontSize: 13 }}>
                  Link (where a click takes people)
                  <input
                    type="text"
                    value={heroLink}
                    onChange={(e) => setHeroLink(e.target.value)}
                    placeholder={`/projects/${selectedProject.slug}`}
                    style={{ padding: "8px 10px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", color: "inherit" }}
                  />
                </label>

                <div style={{ display: "flex", gap: 12 }}>
                  <label style={{ display: "grid", gap: 4, fontSize: 13, flex: 1 }}>
                    Start date
                    <input
                      type="date"
                      value={heroStartDate}
                      onChange={(e) => setHeroStartDate(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", color: "inherit" }}
                    />
                  </label>
                  <label style={{ display: "grid", gap: 4, fontSize: 13, flex: 1 }}>
                    End date
                    <input
                      type="date"
                      value={heroEndDate}
                      onChange={(e) => setHeroEndDate(e.target.value)}
                      style={{ padding: "8px 10px", borderRadius: 4, border: "1px solid var(--theme-elevation-200)", background: "var(--theme-elevation-0)", color: "inherit" }}
                    />
                  </label>
                </div>

                <button
                  type="button"
                  disabled={!heroHeadline.trim() || !heroImage.trim()}
                  onClick={() => setStep(5)}
                  style={{
                    justifySelf: "start",
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "8px 20px",
                    borderRadius: 999,
                    border: "1px solid var(--theme-elevation-200)",
                    background: "var(--theme-elevation-100)",
                    color: "inherit",
                    cursor: !heroHeadline.trim() || !heroImage.trim() ? "not-allowed" : "pointer",
                    opacity: !heroHeadline.trim() || !heroImage.trim() ? 0.5 : 1,
                  }}
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 5: review + submit */}
          {step >= 5 && selectedTier && (!needsProject || selectedProject) && (!isHeroSlide || (heroHeadline.trim() && heroImage.trim())) && (
            <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, padding: 16, background: "var(--theme-elevation-50)" }}>
              <h5 style={{ marginTop: 0, marginBottom: 10 }}>5. Review &amp; submit</h5>
              <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Placement:</strong> {PAYMENT_TYPE_OPTIONS.find((t) => t.value === selectedType)?.label}</p>
              {selectedTier.tier_name && <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Option:</strong> {selectedTier.tier_name}</p>}
              {selectedTier.featured_page && <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Page:</strong> {selectedTier.featured_page}</p>}
              {selectedProject && <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Listing:</strong> {selectedProject.name}</p>}
              {isHeroSlide && (
                <>
                  <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Headline:</strong> {heroHeadline}</p>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={heroImage} alt="Hero preview" style={{ width: "100%", maxWidth: 260, height: 100, objectFit: "cover", borderRadius: 4, border: "1px solid var(--theme-elevation-150)", margin: "6px 0" }} />
                </>
              )}
              <p style={{ margin: "4px 0", fontSize: 14 }}><strong>Price:</strong> {formatMoney(selectedTier.price, selectedTier.currency)}{selectedTier.duration_days ? ` for ${selectedTier.duration_days} days` : ""}</p>
              {submitError && <p style={{ color: "var(--theme-error-500)", fontSize: 13 }}>{submitError}</p>}
              <button
                type="button"
                disabled={submitting}
                onClick={onSubmit}
                style={{ marginTop: 12, fontSize: 14, fontWeight: 600, padding: "10px 24px", borderRadius: 999, border: "1px solid #f47b36", background: "#f47b36", color: "#1f1f1f", cursor: submitting ? "not-allowed" : "pointer" }}
              >
                {submitting ? "Submitting…" : "Submit request"}
              </button>
            </div>
          )}
        </>
      )}

      {!loading && pastPayments.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h5 style={{ marginBottom: 10 }}>Your requests</h5>
          <div style={{ border: "1px solid var(--theme-elevation-150)", borderRadius: 6, overflow: "hidden" }}>
            <table style={{ width: "100%", fontSize: 13, borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ textAlign: "left", opacity: 0.65, background: "var(--theme-elevation-50)" }}>
                  <th style={{ padding: "8px 14px" }}>Type</th>
                  <th style={{ padding: "8px 14px" }}>Listing</th>
                  <th style={{ padding: "8px 14px" }}>Amount</th>
                  <th style={{ padding: "8px 14px" }}>Status</th>
                  <th style={{ padding: "8px 14px" }}>Submitted</th>
                </tr>
              </thead>
              <tbody>
                {pastPayments.map((payment) => (
                  <tr key={payment.id} style={{ borderTop: "1px solid var(--theme-elevation-150)" }}>
                    <td style={{ padding: "8px 14px" }}>{PAYMENT_TYPE_OPTIONS.find((t) => t.value === payment.payment_type)?.label ?? payment.payment_type}</td>
                    <td style={{ padding: "8px 14px" }}>{typeof payment.related_project === "object" && payment.related_project ? payment.related_project.name : "—"}</td>
                    <td style={{ padding: "8px 14px" }}>{formatMoney(payment.amount, payment.currency)}</td>
                    <td style={{ padding: "8px 14px" }}>
                      <span style={{ color: STATUS_COLOR[payment.status] ?? "inherit", fontWeight: 600 }}>{STATUS_LABEL[payment.status] ?? payment.status}</span>
                    </td>
                    <td style={{ padding: "8px 14px" }}>{new Date(payment.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
