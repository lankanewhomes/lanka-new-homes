import type { Metadata } from "next";
import Link from "next/link";
import { withSocial } from "@/lib/seo";

export const metadata: Metadata = withSocial({
  title: "Cookie Policy",
  alternates: { canonical: "/cookies" },
  robots: { index: false, follow: true },
}, { path: "/cookies" });

export default function CookiePolicyPage() {
  return (
    <div className="fdv-page legal-page">
      {/* Owner, 2026-09-30: "redesign this also" — same contained-box system as /about, /press and /contact; the policy text itself is unchanged. */}
      <section className="fdv-hero fdv-hero--split" aria-label="Cookie Policy">
        <div className="fdv-hero-split-inner legal-hero-inner">
          <div className="fdv-hero-content">
            <h1 className="fdv-hero-headline">Cookie Policy</h1>
            <p className="fdv-hero-sub">This page explains the cookies and similar technologies LankaNewHomes uses, and how you can control them.</p>
          </div>
        </div>
      </section>

      <section className="fdv-box fdv-box--gray" aria-label="Policy text">
        <div className="static-page-shell legal-card">

      <h2>What cookies are</h2>
      <p>Cookies are small text files stored on your device when you visit a website. We also use similar technologies like browser local storage for some features.</p>

      <h2>Cookies we use</h2>
      <ul>
        <li><strong>Essential.</strong> Required to sign in and keep you signed in (including Google/Facebook/LinkedIn sign-in), and to keep the site secure. The site won&apos;t function properly without these.</li>
        <li><strong>Analytics.</strong> Google Analytics and Google Tag Manager cookies help us understand how visitors use the site — which pages are viewed, which listings get the most interest, and where visitors come from. This data is aggregated and doesn&apos;t identify you personally. Microsoft Clarity cookies do the same with heatmaps and anonymised session replays (text you type into forms is masked).</li>
        <li><strong>Advertising.</strong> The Meta Pixel (from Facebook and Instagram&apos;s parent company, Meta) records which pages you visit so we can measure how well our Facebook and Instagram ads work and show our ads to people who have visited the site. It does not give us your name or contact details.</li>
        <li><strong>Preferences.</strong> We use your browser&apos;s local storage (not a cookie, but similar in purpose) to remember things like your saved listings and language choice, so they&apos;re there next time you visit from the same browser.</li>
      </ul>

      <h2>Third-party cookies</h2>
      <p>Some cookies are set by services we use, not by us directly:</p>
      <ul>
        <li><strong>Google</strong> — Analytics, Tag Manager, and sign-in.</li>
        <li><strong>Microsoft</strong> — Clarity (heatmaps and session replays).</li>
        <li><strong>Meta (Facebook and Instagram)</strong> — the Meta Pixel (advertising measurement), and sign-in where you choose to use it.</li>
        <li><strong>LinkedIn</strong> — sign-in, where you choose to use it.</li>
      </ul>
      <p>These providers have their own privacy and cookie policies governing how they use this data.</p>

      <h2>Managing cookies</h2>
      <p>Most browsers let you block or delete cookies in their settings. Blocking essential cookies may prevent you from signing in or using account features. You can also opt out of Google Analytics tracking across all websites using Google&apos;s <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer">Analytics opt-out browser add-on</a>. To limit Meta&apos;s ad tracking, use the ad preferences in your <a href="https://www.facebook.com/settings?tab=ads" target="_blank" rel="noopener noreferrer">Facebook settings</a> or <a href="https://accountscenter.instagram.com/ads/" target="_blank" rel="noopener noreferrer">Instagram settings</a>.</p>

      <h2>Changes to this policy</h2>
      <p>We may update this policy as the platform evolves. Material changes will be reflected by an updated date on this page.</p>

      <h2>Contact</h2>
      <p>Questions about this policy can be sent to <a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a>. See also our <Link href="/privacy">Privacy Policy</Link>.</p>
        </div>
      </section>
    </div>
  );
}
