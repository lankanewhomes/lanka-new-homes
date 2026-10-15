import type { ReactNode } from "react";
import { ScrollReveal } from "@/components/marketplace/scroll-reveal";

// The shared layout of /login and /developers/register (hero on the left, form card on the right, steps or perks
// underneath), so sign up, forgot password and reset password all look like the same family.
export function AuthSplitPage({ label, headline, sub, ctas, children, below }: { label: string; headline: string; sub: string; ctas?: ReactNode; children: ReactNode; below?: ReactNode }) {
  return (
    <div className="fdv-page wdx-page login-page">
      <ScrollReveal />
      <section className="fdv-hero fdv-hero--split" aria-label={label}>
        <div className="fdv-hero-split-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">{headline}</h1>
            <p className="fdv-hero-sub">{sub}</p>
            {ctas ? <div className="fdv-hero-ctas">{ctas}</div> : null}
          </div>
          <div className="login-card auth-page">{children}</div>
        </div>
      </section>
      {below}
    </div>
  );
}

export function AuthBoxes({ title, lede, items }: { title: string; lede: string; items: readonly { title: string; body: string }[] }) {
  return (
    <section className="fdv-box fdv-box--cream" aria-label={title}>
      <div className="wdx-section-head" data-reveal><h2>{title}</h2><p>{lede}</p></div>
      <div className="fdv-box-grid fdv-box-grid--3" data-reveal>
        {items.map((item, i) => (
          <div key={item.title} className="fdv-box-card">
            <span className="login-step-number" aria-hidden="true">{i + 1}</span>
            <h3>{item.title}</h3>
            <p>{item.body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
