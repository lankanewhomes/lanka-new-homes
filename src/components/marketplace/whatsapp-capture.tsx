"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { buildInternationalPhone, DEFAULT_PHONE_COUNTRY, isPlausiblePhone } from "@/lib/phone";
import { PhoneField, type PhoneValue } from "@/components/marketplace/phone-field";
import { toWhatsAppNumber, whatsappChatHref } from "@/lib/whatsapp";
import { captureUtmParams, getLandingPage, getStoredUtmParams, getTrafficSource, trackEvent } from "@/lib/ga4";
import { getSessionId } from "@/components/marketplace/view-tracker";

// "Capture their number before opening WhatsApp" (owner, 2026-11-09). Every WhatsApp button on a listing calls openWhatsAppCapture();
// this host (mounted once in the site layout) shows a small window asking for a name and WhatsApp number, saves a lead for the
// developer (source "whatsapp", /api/leads), then opens the developer's WhatsApp with the enquiry ready. Whether the buyer went on
// to WhatsApp is recorded by /api/leads/whatsapp-continue, which also logs the "whatsapp_click" event that counts as a WhatsApp lead.

export type WhatsAppCaptureDetail = {
  /** The developer's wa.me link from listingWhatsAppHref (carries the developer's number and the opening message). */
  href: string;
  projectSlug: string;
  projectName: string;
  developerSlug?: string;
  heroImage?: string;
  planName?: string;
};

const EVENT = "lnh:whatsapp-capture";

export function openWhatsAppCapture(detail: WhatsAppCaptureDetail) {
  window.dispatchEvent(new CustomEvent<WhatsAppCaptureDetail>(EVENT, { detail }));
}

function openingMessage(href: string, fallback: string): string {
  try {
    return new URL(href).searchParams.get("text") || fallback;
  } catch {
    return fallback;
  }
}

export function WhatsAppCaptureHost() {
  const [detail, setDetail] = useState<WhatsAppCaptureDetail | null>(null);
  useEffect(() => {
    const onOpen = (event: Event) => setDetail((event as CustomEvent<WhatsAppCaptureDetail>).detail);
    window.addEventListener(EVENT, onOpen);
    return () => window.removeEventListener(EVENT, onOpen);
  }, []);
  if (!detail) return null;
  return <WhatsAppCaptureDialog key={`${detail.projectSlug}-${detail.href}`} detail={detail} onClose={() => setDetail(null)} />;
}

function WhatsAppCaptureDialog({ detail, onClose }: { detail: WhatsAppCaptureDetail; onClose: () => void }) {
  const fallbackMessage = `Hi, I'm interested in ${detail.projectName} that I saw on LankaNewHomes. Could you send me more details?`;
  const [name, setName] = useState("");
  const [phoneValue, setPhoneValue] = useState<PhoneValue>({ country: DEFAULT_PHONE_COUNTRY, national: "" });
  const [message, setMessage] = useState(() => openingMessage(detail.href, fallbackMessage));
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [openHref, setOpenHref] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [onClose]);

  const developerNumber = toWhatsAppNumber(detail.href);

  const goToWhatsApp = (href: string) => {
    const opened = window.open(href, "_blank", "noopener,noreferrer");
    if (!opened) window.location.assign(href); // pop-up blocked: leave this page for WhatsApp instead
  };

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const phone = isPlausiblePhone(phoneValue.country, phoneValue.national) ? buildInternationalPhone(phoneValue.country, phoneValue.national) : null;
    const next: { name?: string; phone?: string } = {};
    if (!name.trim()) next.name = "Please enter your name so the developer knows who you are.";
    if (!phone) next.phone = phoneValue.country === "LK" ? "That number does not look right. Type your WhatsApp number without the first 0, for example 77 123 4567." : "That number does not look right. Please check the country and the number.";
    if (next.name || next.phone) {
      setErrors(next);
      if (next.name) formRef.current?.querySelector<HTMLInputElement>("#wa-capture-name")?.focus();
      return;
    }
    setErrors({});
    setSubmitting(true);
    captureUtmParams();
    const enquiry = message.trim() || fallbackMessage;
    const sessionId = getSessionId();
    const trafficSource = getTrafficSource();
    const utm = getStoredUtmParams();
    let leadId: string | undefined;
    try {
      // Saving the lead must never stop the buyer reaching the developer: if it fails they still go on to WhatsApp.
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: "",
          phone,
          preferredContactMethod: "WhatsApp",
          message: enquiry,
          projectSlug: detail.projectSlug,
          developerSlug: detail.developerSlug || "unknown",
          isWhatsAppCapture: true,
          floorPlanName: detail.planName || undefined,
          sessionId,
          trafficSource,
          utm,
        }),
      });
      if (response.ok) leadId = (await response.json().catch(() => null))?.id;
    } catch {
      // carry on to WhatsApp
    }
    trackEvent("generate_lead", {
      listing_id: detail.projectSlug,
      listing_name: detail.projectName,
      ...(detail.developerSlug ? { developer_slug: detail.developerSlug } : {}),
      traffic_source: trafficSource,
      landing_page: getLandingPage(),
      form_type: "whatsapp",
    });
    trackEvent("click_whatsapp", { listing_id: detail.projectSlug, listing_name: detail.projectName, ...(detail.developerSlug ? { developer_slug: detail.developerSlug } : {}) });
    fetch("/api/leads/whatsapp-continue", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, projectSlug: detail.projectSlug, sessionId, trafficSource, utm }),
      keepalive: true,
    }).catch(() => {});
    const href = whatsappChatHref(developerNumber, enquiry) ?? detail.href;
    setOpenHref(href);
    setSubmitting(false);
    goToWhatsApp(href);
  };

  return (
    <div className="request-info-overlay" role="dialog" aria-modal="true" aria-label="Connect with the developer" onClick={onClose}>
      <div className="request-info-dialog request-info-dialog-brochure" onClick={(event) => event.stopPropagation()}>
        <div className="request-info-topbar">
          <p className="request-info-topbar-title">Connect with the developer</p>
          <button type="button" className="request-info-close" aria-label="Close" onClick={onClose}><X className="h-5 w-5" /></button>
        </div>
        <div className="request-info-listing request-info-listing-brochure">
          {detail.heroImage ? <Image src={detail.heroImage} alt={detail.projectName} width={64} height={64} className="request-info-listing-image" /> : null}
          <div className="request-info-listing-text">
            <p className="request-info-listing-title">{detail.projectName}</p>
            {detail.planName ? <p className="request-info-listing-address">{detail.planName}</p> : null}
          </div>
        </div>

        {openHref ? (
          <div className="request-info-success">
            <h2>WhatsApp is opening</h2>
            <p>Your enquiry is ready in WhatsApp with the developer&apos;s number. Just press send. If nothing opened, use the button below.</p>
            <a className="request-info-submit-big" href={openHref} target="_blank" rel="noopener noreferrer">
              <span className="request-info-submit-icon" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.5} /></span>
              Open WhatsApp
            </a>
            <button type="button" onClick={onClose}>Close</button>
          </div>
        ) : (
          <form ref={formRef} onSubmit={onSubmit} noValidate className="request-info-body">
            <p className="request-info-lead">Enter your name and WhatsApp number so the developer can answer your enquiry.</p>
            <label className="request-info-field">
              <span>Name<span className="request-info-star">*</span></span>
              <input id="wa-capture-name" value={name} onChange={(event) => { setName(event.target.value); if (errors.name) setErrors((e) => ({ ...e, name: undefined })); }} autoComplete="name" autoCapitalize="words" placeholder="Enter your name" aria-invalid={errors.name ? true : undefined} />
              {errors.name ? <span className="request-info-field-error" role="alert">{errors.name}</span> : null}
            </label>
            <div className="request-info-field">
              <span id="wa-capture-phone-label" className="request-info-field-visible-label">Your WhatsApp number<span className="request-info-star">*</span></span>
              <PhoneField value={phoneValue} onChange={(nextValue) => { setPhoneValue(nextValue); if (errors.phone) setErrors((e) => ({ ...e, phone: undefined })); }} labelId="wa-capture-phone-label" />
              {errors.phone ? <span className="request-info-field-error" role="alert">{errors.phone}</span> : null}
            </div>
            <label className="request-info-field">
              <span>Your enquiry</span>
              <textarea value={message} onChange={(event) => setMessage(event.target.value.slice(0, 900))} rows={3} />
            </label>
            <div className="request-info-actions">
              <p className="request-info-promise">Your number goes to this developer only, so they can reply. WhatsApp then opens with the developer&apos;s number and your enquiry ready.</p>
              <div className="request-info-actions-row">
                <button type="submit" className="request-info-submit-big" disabled={submitting}>
                  <span className="request-info-submit-icon" aria-hidden="true"><ArrowRight size={16} strokeWidth={2.5} /></span>
                  {submitting ? "Opening..." : "Continue to WhatsApp"}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
