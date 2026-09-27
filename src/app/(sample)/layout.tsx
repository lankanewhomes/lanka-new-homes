import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import "./sample.css";

// Its own root layout (like (payload)): the sample website must look like a
// developer's own standalone site, so it gets none of LankaNewHomes' header,
// footer or compare bar, and its own font pairing — a deliberate contrast with
// the marketplace's Archivo, to show that a site carries the developer's brand.
const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  variable: "--smp-font-display",
});
const body = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--smp-font-body",
});

export const metadata: Metadata = {
  title: "Halcyon Residences — sample website | LankaNewHomes Web Design",
  description: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  // A demo, not a real project — never something to index.
  robots: { index: false, follow: false },
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="smp-body">{children}</body>
    </html>
  );
}
