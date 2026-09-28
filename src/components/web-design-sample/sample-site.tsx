import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Baby,
  Car,
  Check,
  Coffee,
  Download,
  Dumbbell,
  Film,
  MessageCircle,
  Phone,
  PlugZap,
  Sailboat,
  ShieldCheck,
  Sparkles,
  Sun,
  TreePine,
  UtensilsCrossed,
  Waves,
  Wifi,
} from "lucide-react";
import { LocationMap } from "./location-map";
import { PlanDrawing } from "./plan-drawing";
import { SampleEnquiryForm } from "./sample-enquiry-form";
import { SampleHeader } from "./sample-header";
import { HALCYON_THEME } from "./sample-data";
import type { AmenityIconKey, SampleTheme } from "./theme-types";

// One icon set shared by all three themes' amenity lists — each theme only
// uses the keys relevant to its own property type (waves/dumbbell/trees/etc.
// for garden villas, +film/wifi/car for a tower, +sailboat/utensils for a
// beach resort).
const AMENITY_ICONS: Record<AmenityIconKey, typeof Waves> = {
  waves: Waves,
  dumbbell: Dumbbell,
  trees: TreePine,
  shield: ShieldCheck,
  baby: Baby,
  plug: PlugZap,
  coffee: Coffee,
  sun: Sun,
  film: Film,
  wifi: Wifi,
  car: Car,
  sparkles: Sparkles,
  sailboat: Sailboat,
  utensils: UtensilsCrossed,
};

/**
 * A complete sample homepage for a fictional development, to show developers
 * what LankaNewHomes Web Design can build. `theme` picks which of the three
 * samples renders (Halcyon Residences / Meridian Heights / Azure Cove —
 * defaults to Halcyon so existing callers/routes need no changes). `embedded`
 * drops the "this is a sample" bar — used for the live previews inside the
 * device frames on /web-design. Every name, figure, distance and contact
 * detail is placeholder content, and the page says so.
 */
export function SampleSite({ theme = HALCYON_THEME, embedded = false }: { theme?: SampleTheme; embedded?: boolean }) {
  return (
    <div className="smp-root" id="top" data-theme={theme.id}>
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

      <SampleHeader hasBanner={!embedded} theme={theme} />

      <main>
        {/* HERO */}
        <section className="smp-hero" aria-label={theme.heroAriaLabel}>
          <Image src={theme.images.hero} alt="" fill priority sizes="100vw" className="smp-hero-img" />
          <div className="smp-hero-shade" />
          <div className="smp-hero-content">
            <p className="smp-eyebrow smp-eyebrow-light">{theme.locationLine}</p>
            <h1 className="smp-hero-title">{theme.heroHeadline}</h1>
            <p className="smp-hero-sub">{theme.heroSub}</p>
            <div className="smp-hero-ctas">
              <a href="#enquire" className="smp-btn smp-btn-brass">Register interest</a>
              <a href="#enquire" className="smp-btn smp-btn-ghost"><Download size={16} aria-hidden="true" /> Download brochure</a>
            </div>
          </div>
          <ul className="smp-facts" aria-label="Key facts">
            {theme.facts.map((fact) => (
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
              <p className="smp-eyebrow">{theme.introEyebrow}</p>
              <h2 className="smp-h2">{theme.introHeading}</h2>
              <p>{theme.introBody}</p>
              <ul className="smp-checks">
                {theme.introChecks.map((line) => (
                  <li key={line}><Check size={16} aria-hidden="true" /> {line}</li>
                ))}
              </ul>
            </div>
            <div className="smp-intro-media">
              <Image src={theme.images.intro} alt="" fill sizes="(min-width: 900px) 46vw, 100vw" className="smp-cover" />
            </div>
          </div>
        </section>

        {/* RESIDENCES */}
        <section className="smp-section smp-residences" id="residences" aria-label={theme.residencesEyebrow}>
          <div className="smp-section-head">
            <p className="smp-eyebrow">{theme.residencesEyebrow}</p>
            <h2 className="smp-h2">{theme.residencesHeading}</h2>
            <p>{theme.residencesSub}</p>
          </div>
          <div className="smp-residence-grid">
            {theme.residences.map((residence) => (
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
            <h2 className="smp-h2">{theme.galleryHeading}</h2>
          </div>
          <div className="smp-gallery-grid">
            {theme.gallery.map((item) => (
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
            <p className="smp-eyebrow smp-eyebrow-light">{theme.amenitiesEyebrow}</p>
            <h2 className="smp-h2 smp-h2-light">{theme.amenitiesHeading}</h2>
          </div>
          <div className="smp-amenity-grid">
            {theme.amenities.map((amenity) => {
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
              <p className="smp-eyebrow">{theme.locationEyebrow}</p>
              <h2 className="smp-h2">{theme.locationHeading}</h2>
              <p>{theme.locationBody}</p>
              <ul className="smp-nearby">
                {theme.nearby.map((place) => (
                  <li key={place.name}><span>{place.name}</span><strong>{place.time}</strong></li>
                ))}
              </ul>
            </div>
            <div className="smp-location-map"><LocationMap title={theme.mapTitle} pois={theme.mapPois} /></div>
          </div>
        </section>

        {/* PROGRESS + PAYMENT */}
        <section className="smp-section smp-progress" id="progress" aria-label="Construction progress and payment plan">
          <div className="smp-section-head">
            <p className="smp-eyebrow">{theme.progressEyebrow}</p>
            <h2 className="smp-h2">{theme.progressHeading}</h2>
            <p>{theme.progressSub}</p>
          </div>
          <ol className="smp-stepper">
            {theme.progress.map((step) => (
              <li key={step.title} className={`is-${step.state}`}>
                <span className="smp-step-dot" aria-hidden="true">{step.state === "done" ? <Check size={14} /> : null}</span>
                <span className="smp-step-title">{step.title}</span>
                <span className="smp-step-state">{step.state === "done" ? "Complete" : step.state === "current" ? "In progress" : "Upcoming"}</span>
              </li>
            ))}
          </ol>

          <div className="smp-pay">
            <h3>{theme.payHeading}</h3>
            <div className="smp-pay-grid">
              {theme.paymentSteps.map((step, index) => (
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
              <p className="smp-eyebrow smp-eyebrow-light">{theme.enquireEyebrow}</p>
              <h2 className="smp-h2 smp-h2-light">{theme.enquireHeading}</h2>
              <p>{theme.enquireBody}</p>
              <div className="smp-contact-list">
                <a href="#enquire"><Phone size={16} aria-hidden="true" /> {theme.contactPhonePlaceholder}</a>
                <a href="#enquire"><MessageCircle size={16} aria-hidden="true" /> WhatsApp us</a>
                <a href="#enquire"><Download size={16} aria-hidden="true" /> Download the brochure</a>
              </div>
            </div>
            <div className="smp-enquire-card"><SampleEnquiryForm residences={theme.residences} /></div>
          </div>
        </section>
      </main>

      <footer className="smp-footer">
        <div className="smp-footer-inner">
          <div>
            <span className="smp-logo-mark">{theme.siteName}</span>
            <span className="smp-logo-sub">{theme.siteNameSub}</span>
            <p>Sales gallery: address to come · {theme.contactEmail}</p>
          </div>
          <p className="smp-footer-note">{theme.footerNote}</p>
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
