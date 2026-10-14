import type { Metadata } from "next";
import { archivoSite as bodyFont } from "@/lib/local-fonts";
import { DeferredGoogleTags } from "@/components/analytics/deferred-google-tags";
import { DeferredClarity } from "@/components/analytics/deferred-clarity";
import { Footer, Header } from "@/components/marketplace/components";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { LanguageProvider } from "@/components/layout/language-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { UtmCapture } from "@/components/analytics/utm-capture";
import { InternalTrafficFlag } from "@/components/analytics/internal-traffic-flag";
import { CompareBar } from "@/components/marketplace/compare-bar";
import { buildOrganizationJsonLd, buildWebsiteJsonLd, getSiteUrl, jsonLdScriptProps, withSocial } from "@/lib/seo";
import "./globals.css";

const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
const gtmContainerId = process.env.NEXT_PUBLIC_GTM_ID;
// Microsoft Clarity project id (public). Set NEXT_PUBLIC_CLARITY_ID to override or, with an empty value, to switch it off.
const clarityId = process.env.NEXT_PUBLIC_CLARITY_ID ?? "yxrv3ynig5";

const siteUrl = getSiteUrl();

// Experimental font trial (3rd pass) — requested "Neue Haas Grotesk", a
// commercial Monotype typeface with no free source (same situation as the
// Avenir/Chronicle Display and Compass Sans trials before it). Archivo is
// the closest free stand-in — designed in the same grotesque lineage as
// Helvetica/Neue Haas Grotesk. Revert: remove this block + the `variable`
// class on <html> below, and set --font-ref-sans back to the system stack
// in globals.css.

export const metadata: Metadata = withSocial({
  metadataBase: new URL(siteUrl),
  title: {
    default: "LankaNewHomes | New Homes in Sri Lanka",
    template: "%s | LankaNewHomes",
  },
  description: "Discover new homes and apartment communities across Sri Lanka.",
  robots: {
    index: true,
    follow: true,
  },
  // Set once the user has a verification code from Google Search Console —
  // renders <meta name="google-site-verification"> automatically when
  // present, omitted entirely otherwise (no fabricated placeholder value).
  verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
}, { path: "/", socialTitle: "LankaNewHomes | New Homes in Sri Lanka" });

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`h-full antialiased ${bodyFont.variable}`}>
      <body className="min-h-full" suppressHydrationWarning>
        <script {...jsonLdScriptProps(buildOrganizationJsonLd())} />
        <script {...jsonLdScriptProps(buildWebsiteJsonLd())} />
        <DeferredGoogleTags gaId={gaMeasurementId} gtmId={gtmContainerId} />
        <DeferredClarity projectId={clarityId} />
        <InternalTrafficFlag gaId={gaMeasurementId} />
        <UtmCapture />
        <LanguageProvider>
          <AuthModalProvider>
            <Header />
            <BreadcrumbBar />
            <main>{children}</main>
            <Footer />
            <CompareBar />
          </AuthModalProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
