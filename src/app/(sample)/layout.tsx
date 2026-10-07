import type { Metadata } from "next";
import { cormorantSample as display, dmSansSample as body } from "@/lib/local-fonts";
import "./sample.css";

// Its own root layout (like (payload)): every sample website must look like
// a developer's own standalone site, so it gets none of LankaNewHomes' header,
// footer or compare bar. Three samples now live under this one route group
// (Halcyon Residences, Meridian Heights, Azure Cove — see
// src/components/web-design-sample/theme-*.ts), each with its own font pair
// and palette, a deliberate contrast with each other and with the
// marketplace's Archivo, to show that a site carries the developer's own
// brand. Halcyon's fonts are loaded here, on <html>, since it's the default
// route (`/web-design/sample`); Meridian's and Azure Cove's routes load
// their own fonts and apply them via a wrapper div lower in the tree, which
// shadows these CSS variables for everything inside it — see
// web-design/sample/meridian/page.tsx for that pattern.

export const metadata: Metadata = {
  title: "Sample website | LankaNewHomes Web Design",
  description: "A sample developer website by LankaNewHomes Web Design. Fictional development, illustrative content.",
  // A demo, not a real project — never something to index. Every sample
  // route shares this; each route's own metadata sets its specific title.
  robots: { index: false, follow: false },
};

export default function SampleLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="smp-body">{children}</body>
    </html>
  );
}
