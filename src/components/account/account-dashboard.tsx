import Image from "next/image";
import Link from "next/link";
import { RecentlyViewedPreview } from "@/components/account/recently-viewed-preview";
import { formatLkr } from "@/lib/format";
import { AccountShell } from "@/components/account/account-shell";
import type { SavedProfileItem } from "@/lib/saved-profiles";
import type { Project } from "@/types";

export type AccountEnquiry = { id: string; project_slug: string; created_at: string; status: string };

// Owner, 2026-10-02: "i need a totally new design" for /account — same
// contained-box system as /about, /guides and the directories
// (docs/design.md "Page section style: contained boxes"): dark split hero
// with the live counts, then tinted boxes of bordered white cards. All
// numbers are live from the signed-in buyer's own records.
function prettySlug(slug: string) {
  return slug
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function AccountDashboard({
  name,
  email,
  avatarUrl,
  savedProjects,
  followed,
  savedSearchCount,
  activeAlerts,
  enquiries,
}: {
  name: string;
  email: string;
  avatarUrl?: string | null;
  savedProjects: Project[];
  followed: SavedProfileItem[];
  savedSearchCount: number;
  activeAlerts: number;
  enquiries: AccountEnquiry[];
}) {
  const stats = [
    { label: "Saved properties", value: savedProjects.length },
    { label: "Saved developments", value: followed.length },
    { label: "Saved searches", value: savedSearchCount },
    { label: "Active alerts", value: activeAlerts },
    { label: "Enquiries sent", value: enquiries.length },
  ];

  const shortcuts = [
    { label: "Saved homes", note: "Every home you have saved.", href: "/account/saved" },
    { label: "Following", note: "Developers and companies you follow.", href: "/account/developments" },
    { label: "Compare", note: "Put saved homes side by side.", href: "/account/compare" },
    { label: "Searches and alerts", note: `${activeAlerts} alert${activeAlerts === 1 ? "" : "s"} switched on.`, href: "/account/alerts" },
    { label: "My enquiries", note: "Messages you sent to developers.", href: "/account/enquiries" },
    { label: "Profile and settings", note: "Your details, password and preferences.", href: "/account/profile" },
  ];

  return (
    <AccountShell active="/account">
      <section className="fdv-hero fdv-hero--split" aria-label="My account">
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- user-supplied URL from any host
              <img src={avatarUrl} alt="" className="account-avatar account-avatar--hero" />
            ) : null}
            <h1 className="fdv-hero-headline">Welcome back{name ? `, ${name}` : ""}.</h1>
            <p className="fdv-hero-sub">Signed in as {email}. Your saved homes, followed developers and enquiries are all here.</p>
            <div className="fdv-hero-ctas">
              <Link href="/projects" className="fdv-cta-final-button">Browse new homes</Link>
              <Link href="/account/settings" className="fdv-cta-secondary fdv-hero-explore-link">Account settings</Link>
            </div>
          </div>
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid" aria-label="Your account in numbers">
              {stats.map((stat) => (
                <div className="about-hero-panel-stat" key={stat.label}>
                  <dd>{stat.value}</dd>
                  <dt>{stat.label}</dt>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" id="recent" aria-label="Recently viewed">
        <div className="wdx-section-head" data-reveal>
          <h2>Pick up where you left off.</h2>
          <p>The projects you looked at most recently on this device.</p>
        </div>
        <div className="account-card-grid" data-reveal>
          <RecentlyViewedPreview />
        </div>
      </section>

      <section className="fdv-box fdv-box--cream" id="saved" aria-label="Saved homes">
        <div className="wdx-section-head" data-reveal>
          <h2>Saved properties.</h2>
          <p>
            {savedProjects.length > 0
              ? "Your three most recent saves."
              : "Tap the heart on any listing to keep it here."}
          </p>
        </div>
        {savedProjects.length > 0 ? (
          <div className="account-card-grid" data-reveal>
            {savedProjects.slice(0, 3).map((project) => (
              <Link key={project.slug} href={`/projects/${project.slug}`} className="account-home-card">
                <span className="account-home-card-media">
                  <Image src={project.heroImage} alt={project.name} fill sizes="(min-width: 900px) 33vw, 100vw" className="account-home-card-img" />
                </span>
                <span className="account-home-card-name">{project.name}</span>
                <span className="account-home-card-meta">
                  {project.startingPriceLkr > 0 ? `From ${formatLkr(project.startingPriceLkr)}` : project.location}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <div className="fdv-box-card account-empty" data-reveal>
            <p>You have not saved any homes yet.</p>
            <Link href="/projects" className="account-link">Browse new homes</Link>
          </div>
        )}
        {savedProjects.length > 0 ? (
          <p className="account-more" data-reveal><Link href="/account/saved" className="account-link">See all saved homes</Link></p>
        ) : null}
      </section>

      <section className="fdv-box fdv-box--sage" id="following" aria-label="Saved developments">
        <div className="wdx-section-head" data-reveal>
          <h2>Saved developments.</h2>
          <p>Developers and companies whose new projects you want to hear about.</p>
        </div>
        {followed.length > 0 ? (
          <ul className="account-follow-list" data-reveal>
            {followed.slice(0, 6).map((item) => (
              <li key={`${item.kind}:${item.slug}`}>
                <Link href={item.href}>
                  <span className="account-follow-logo">
                    {item.logo ? <Image src={item.logo} alt="" fill sizes="44px" className="account-follow-logo-img" /> : null}
                  </span>
                  <span className="account-follow-text">
                    <span>{item.name}</span>
                    <small>{item.label}{item.meta && item.meta !== item.label ? ` · ${item.meta}` : ""}</small>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <div className="fdv-box-card account-empty" data-reveal>
            <p>You are not following any developers or companies yet.</p>
            <Link href="/developers" className="account-link">Browse developers</Link>
          </div>
        )}
      </section>

      <section className="fdv-box fdv-box--lilac" id="enquiries" aria-label="Recent enquiries">
        <div className="wdx-section-head" data-reveal>
          <h2>Recent enquiries.</h2>
          <p>The last messages you sent to developers.</p>
        </div>
        {enquiries.length > 0 ? (
          <ul className="account-enquiry-list" data-reveal>
            {enquiries.map((lead) => (
              <li key={lead.id}>
                <span className="account-enquiry-name">{prettySlug(lead.project_slug)}</span>
                <span className="account-enquiry-date">{new Date(lead.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</span>
                <span className="account-enquiry-status">{lead.status}</span>
              </li>
            ))}
          </ul>
        ) : (
          <div className="fdv-box-card account-empty" data-reveal>
            <p>You have not contacted any developers yet.</p>
            <Link href="/projects" className="account-link">Find a home to ask about</Link>
          </div>
        )}
      </section>

      <section className="fdv-box fdv-box--dark guides-howto" id="manage" aria-label="Manage your account">
        <div className="guides-howto-grid">
          <div className="guides-howto-text">
            <h2>Manage your account.</h2>
            <p>Keep your details up to date and choose which alerts reach you. Saved searches can email you when a new matching home is listed.</p>
          </div>
          <div className="guides-howto-box">
            <h3>Go to</h3>
            <ul>
              {shortcuts.map((item) => (
                <li key={item.href}>
                  <Link href={item.href}>
                    <strong>{item.label}</strong>
                    <span>{item.note}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </AccountShell>
  );
}
