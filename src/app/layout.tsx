import type { Metadata } from "next";
import { Archivo } from "next/font/google";
import { Footer, Header } from "@/components/marketplace/components";
import { BreadcrumbBar } from "@/components/layout/breadcrumb-bar";
import { LanguageProvider } from "@/components/layout/language-provider";
import { AuthModalProvider } from "@/components/auth/auth-modal-provider";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

// Experimental font trial (3rd pass) — requested "Neue Haas Grotesk", a
// commercial Monotype typeface with no free source (same situation as the
// Avenir/Chronicle Display and Compass Sans trials before it). Archivo is
// the closest free stand-in — designed in the same grotesque lineage as
// Helvetica/Neue Haas Grotesk. Revert: remove this block + the `variable`
// class on <html> below, and set --font-ref-sans back to the system stack
// in globals.css.
const bodyFont = Archivo({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-avenir-trial" });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "NewHomesSrilanka | New Homes in Sri Lanka",
    template: "%s | NewHomesSrilanka",
  },
  description: "Discover new homes and apartment communities across Sri Lanka.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "NewHomesSrilanka",
    title: "NewHomesSrilanka | New Homes in Sri Lanka",
    description: "Discover new homes and apartment communities across Sri Lanka.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NewHomesSrilanka | New Homes in Sri Lanka",
    description: "Discover new homes and apartment communities across Sri Lanka.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className={`h-full antialiased ${bodyFont.variable}`}><body className="min-h-full" suppressHydrationWarning><LanguageProvider><AuthModalProvider><Header /><BreadcrumbBar /><main>{children}</main><Footer /></AuthModalProvider></LanguageProvider></body></html>;
}
