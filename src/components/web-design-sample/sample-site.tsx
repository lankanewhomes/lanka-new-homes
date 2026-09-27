import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Baby, Check, Coffee, Download, Dumbbell, MessageCircle, Phone, PlugZap, ShieldCheck, Sun, TreePine, Waves } from "lucide-react";
import { LocationMap } from "./location-map";
import { PlanDrawing } from "./plan-drawing";
import { SampleEnquiryForm } from "./sample-enquiry-form";
import { SampleHeader } from "./sample-header";
import {
  SAMPLE_AMENITIES,
  SAMPLE_FACTS,
  SAMPLE_GALLERY,
  SAMPLE_IMAGES,
  SAMPLE_NEARBY,
  SAMPLE_PAYMENT_STEPS,
  SAMPLE_PROGRESS,
  SAMPLE_RESIDENCES,
} from "./sample-data";

const AMENITY_ICONS = {
  waves: Waves,
  dumbbell: Dumbbell,
  trees: TreePine,
  shield: ShieldCheck,
  baby: Baby,
  plug: PlugZap,
  coffee: Coffee,
  sun: Sun,
} as const;

/**
 * A complete sample homepage for a fictional development, to show developers
 * what LankaNewHomes Web Design can build. `embedded` drops the "this is a
 * sample" bar — used for the live previews inside the device frames on
 * /web-design. Every name, figure, distance and contact detail is placeholder
 * content, and the page says so.
 */
export function SampleSite({ embedded = false }: { embedded?: boolean }) {
  return (
    <div className="smp-root" id="top">
      {!embedded ? (
        <div className="smp-banner" role="note">
          <span className="smp-banner-text">
            <strong>Sample design.</strong>
            <span className="smp-banner-long"> A fictional development, made by LankaNewHomes Web Design to show what your site could look like.</span>
          </span>
          <span className="smp-banner-links">
            <Link href="/web-design">← Back to Web design</Link>
            <Link href="/contact" className="smp-banner-cta">Get a site like this</Link>
          </span>
        </div>
      ) : null}

      <SampleHeader hasBanner={!embedded} />

      <main>
        {/* HERO */}
        <section className="smp-hero" aria-label="Halcyon Residences">
          <Image src={SAMPLE_IMAGES.hero} alt="" fill priority sizes="100vw" className="smp-hero-img" />
          <div className="smp-hero-shade" />
          <div className="smp-hero-content">
            <p className="smp-eyebrow smp-eyebrow-light">Battaramulla · Colombo</p>
            <h1 className="smp-hero-title">Live where the garden meets the city.</h1>
            <p className="smp-hero-sub">
              Thirty-two garden villas in a gated community — a pool, a clubhouse and mature trees, ten minutes from everything.
            </p>
            <div className="smp-hero-ctas">
              <a href="#enquire" className="smp-btn smp-btn-brass">Register interest</a>
              <a href="#enquire" className="smp-btn smp-btn-ghost"><Download size={16} aria-hidden="true" /> Download brochure</a>
            </div>
          </div>
          <ul className="smp-facts" aria-label="Key facts">
            {SAMPLE_FACTS.map((fact) => (
              <li key={fact.value}>
                <strong>{fact.value}</strong>
                <span>{fact.label}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* INTRO */}
        <section className="smp-section smp-intro" aria-label="About the development">
          <div className="smp-intro-grid">
            <div className="smp-intro-copy">
              <p className="smp-eyebrow">The development</p>
              <h2 className="smp-h2">A quiet address, close to everything.</h2>
              <p>
                Halcyon Residences is a community of thirty-two villas set around shared gardens. Every home is planned
                around light, cross-ventilation and a garden you can walk out to — with the city a short drive away.
              </p>
              <ul className="smp-checks">
                {["Architect-designed, three villa types", "Private gardens and shared green space", "Ten minutes to schools, hospitals and the expressway"].map((line) => (
                  <li key={line}><Check size={16} aria-hidden="true" /> {line}</li>
                ))}
              </ul>
            </div>
            <div className="smp-intro-media">
              <Image src={SAMPLE_IMAGES.intro} alt="Villa with a pool and palm trees" fill sizes="(min-width: 900px) 46vw, 100vw" className="smp-cover" />
            </div>
          </div>
        </section>

        {/* RESIDENCES */}
        <section className="smp-section smp-residences" id="residences" aria-label="Residences">
          <div className="smp-section-head">
            <p className="smp-eyebrow">Residences</p>
            <h2 className="smp-h2">Three villas. One way of living.</h2>
            <p>Choose the plan that fits your family. Prices below are placeholders for the sample.</p>
          </div>
          <div className="smp-residence-grid">
            {SAMPLE_RESIDENCES.map((residence) => (
              <article className="smp-residence" key={residence.key}>
                <div className="smp-plan"><PlanDrawing rooms={residence.rooms} label={`Sketch plan of ${residence.name}`} /></div>
                <h3>{residence.name}</h3>
                <p className="smp-residence-specs">{residence.bedrooms} · {residence.size}</p>
                <p>{residence.blurb}</p>
                <div className="smp-residence-foot">
                  <span className="smp-price">From Rs. XX.X million</span>
                  <a href="#enquire" className="smp-link">Request the plan <ArrowRight size={15} aria-hidden="true" /></a>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* GALLERY */}
        <section className="smp-section smp-gallery" id="gallery" aria-label="Gallery">
          <div className="smp-section-head">
            <p className="smp-eyebrow">Gallery</p>
            <h2 className="smp-h2">Made to be lived in.</h2>
          </div>
          <div className="smp-gallery-grid">
            {SAMPLE_GALLERY.map((item) => (
              <figure className={`smp-gallery-item${item.wide ? " is-wide" : ""}`} key={item.src}>
                <Image src={item.src} alt={item.alt} fill sizes="(min-width: 900px) 33vw, 100vw" className="smp-cover" />
                <figcaption>{item.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* AMENITIES */}
        <section className="smp-section smp-amenities" id="amenities" aria-label="Amenities">
          <div className="smp-section-head">
            <p className="smp-eyebrow smp-eyebrow-light">Amenities</p>
            <h2 className="smp-h2 smp-h2-light">Everything shared, nothing crowded.</h2>
          </div>
          <div className="smp-amenity-grid">
            {SAMPLE_AMENITIES.map((amenity) => {
              const Icon = AMENITY_ICONS[amenity.icon];
              return (
                <div className="smp-amenity" key={amenity.title}>
                  <Icon size={26} strokeWidth={1.4} aria-hidden="true" />
                  <h3>{amenity.title}</h3>
                  <p>{amenity.body}</p>
                </div>
              );
            })}
          </div>
        </section>

        {/* LOCATION */}
        <section className="smp-section smp-location" id="location" aria-label="Location">
          <div className="smp-location-grid">
            <div className="smp-location-copy">
              <p className="smp-eyebrow">Location</p>
              <h2 className="smp-h2">Ten minutes from what matters.</h2>
              <p>Distances are illustrative for the sample. On your site this section shows your real location and nearby places.</p>
              <ul className="smp-nearby">
                {SAMPLE_NEARBY.map((place) => (
                  <li key={place.name}><span>{place.name}</span><strong>{place.time}</strong></li>
                ))}
              </ul>
            </div>
            <div className="smp-location-map"><LocationMap /></div>
          </div>
        </section>

        {/* PROGRESS + PAYMENT */}
        <section className="smp-section smp-progress" id="progress" aria-label="Construction progress and payment plan">
          <div className="smp-section-head">
            <p className="smp-eyebrow">Progress</p>
            <h2 className="smp-h2">See it being built.</h2>
            <p>Buyers can follow construction stage by stage — updated by your team.</p>
          </div>
          <ol className="smp-stepper">
            {SAMPLE_PROGRESS.map((step) => (
              <li key={step.title} className={`is-${step.state}`}>
                <span className="smp-step-dot" aria-hidden="true">{step.state === "done" ? <Check size={14} /> : null}</span>
                <span className="smp-step-title">{step.title}</span>
                <span className="smp-step-state">{step.state === "done" ? "Complete" : step.state === "current" ? "In progress" : "Upcoming"}</span>
              </li>
            ))}
          </ol>

          <div className="smp-pay">
            <h3>A payment plan that follows the build.</h3>
            <div className="smp-pay-grid">
              {SAMPLE_PAYMENT_STEPS.map((step, index) => (
                <div className="smp-pay-step" key={step.title}>
                  <span className="smp-pay-number">{String(index + 1).padStart(2, "0")}</span>
                  <h4>{step.title}</h4>
                  <p>{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ENQUIRE */}
        <section className="smp-section smp-enquire" id="enquire" aria-label="Enquire">
          <div className="smp-enquire-grid">
            <div className="smp-enquire-copy">
              <p className="smp-eyebrow smp-eyebrow-light">Register your interest</p>
              <h2 className="smp-h2 smp-h2-light">Come and see the show villa.</h2>
              <p>
                Leave your details and our sales team will call you to arrange a visit — or message us on WhatsApp.
                Buyers overseas are welcome: choose your country code and we&apos;ll reach you there.
              </p>
              <div className="smp-contact-list">
                <a href="#enquire"><Phone size={16} aria-hidden="true" /> +94 XX XXX XXXX</a>
                <a href="#enquire"><MessageCircle size={16} aria-hidden="true" /> WhatsApp us</a>
                <a href="#enquire"><Download size={16} aria-hidden="true" /> Download the brochure</a>
              </div>
            </div>
            <div className="smp-enquire-card"><SampleEnquiryForm /></div>
          </div>
        </section>
      </main>

      <footer className="smp-footer">
        <div className="smp-footer-inner">
          <div>
            <span className="smp-logo-mark">Halcyon</span>
            <span className="smp-logo-sub">Residences</span>
            <p>Sales gallery: address to come · hello@yourproject.lk</p>
          </div>
          <p className="smp-footer-note">
            Sample website for a fictional development, designed by LankaNewHomes Web Design. All names, prices, distances and
            contact details are placeholders. Photography from Unsplash.
          </p>
        </div>
      </footer>

      {/* Phone-only action bar — the thumb-reach shortcuts most buyers use. */}
      <nav className="smp-action-bar" aria-label="Quick actions">
        <a href="#enquire"><Phone size={18} aria-hidden="true" /> Call</a>
        <a href="#enquire"><MessageCircle size={18} aria-hidden="true" /> WhatsApp</a>
        <a href="#enquire" className="is-primary">Enquire</a>
      </nav>
    </div>
  );
}
