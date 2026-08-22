import type { Metadata } from "next";
import { Footer, Header } from "@/components/marketplace/components";
import { LanguageProvider } from "@/components/layout/language-provider";
import { getSiteUrl } from "@/lib/seo";
import "./globals.css";

const siteUrl = getSiteUrl();

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "LankaLiving | New Homes in Sri Lanka",
    template: "%s | LankaLiving",
  },
  description: "Discover new homes and apartment communities across Sri Lanka.",
  openGraph: {
    type: "website",
    url: "/",
    siteName: "LankaLiving",
    title: "LankaLiving | New Homes in Sri Lanka",
    description: "Discover new homes and apartment communities across Sri Lanka.",
  },
  twitter: {
    card: "summary_large_image",
    title: "LankaLiving | New Homes in Sri Lanka",
    description: "Discover new homes and apartment communities across Sri Lanka.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return <html lang="en" className="h-full antialiased"><body className="min-h-full" suppressHydrationWarning><LanguageProvider><Header /><main>{children}</main><Footer /></LanguageProvider></body></html>;
}
