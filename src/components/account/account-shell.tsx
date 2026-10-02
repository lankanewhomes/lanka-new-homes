import Link from "next/link";
import { AccountMenu } from "@/components/account/account-menu";

// Owner, 2026-10-02: new look for the buyer account area — a side menu beside
// contained-box sections (docs/design.md "Page section style: contained
// boxes"). Shared by /account and its sub-pages so the menu stays identical.
export function AccountShell({ active, children }: { active: string; children: React.ReactNode }) {
  return (
    <div className="fdv-page account-page">
      <div className="account-shell">
        <AccountMenu active={active} />
        <div className="account-main">{children}</div>
      </div>
    </div>
  );
}

// Dark split hero used at the top of every account page: title and intro on
// the left, one live count on the right.
export function AccountPageHero({
  title,
  intro,
  stat,
  cta,
}: {
  title: string;
  intro: string;
  stat?: { label: string; value: number };
  cta?: { label: string; href: string };
}) {
  return (
    <section className="fdv-hero fdv-hero--split" aria-label={title}>
      <div className="fdv-hero-split-inner">
        <div className="fdv-hero-content">
          <h1 className="fdv-hero-headline">{title}</h1>
          <p className="fdv-hero-sub">{intro}</p>
          {cta ? (
            <div className="fdv-hero-ctas">
              <Link href={cta.href} className="fdv-cta-final-button">{cta.label}</Link>
            </div>
          ) : null}
        </div>
        {stat ? (
          <div className="about-hero-panel">
            <dl className="about-hero-panel-grid directory-hero-stat" aria-label={stat.label}>
              <div className="about-hero-panel-stat">
                <dd>{stat.value}</dd>
                <dt>{stat.label}</dt>
              </div>
            </dl>
          </div>
        ) : null}
      </div>
    </section>
  );
}
