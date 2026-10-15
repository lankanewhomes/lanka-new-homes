import type { Metadata } from "next";
import type { ReactNode } from "react";
import { archivoSite } from "@/lib/local-fonts";
import "./dashboard/_components/dashboard.css";

// Its own root layout (like (payload) and (sample)): the dashboard design preview shares nothing with the public site's header,
// footer or fonts setup. It is a mock-data preview, so it is never indexed.
export const metadata: Metadata = {
  title: { default: "LankaNewHomes Dashboard (design preview)", template: "%s | LankaNewHomes Dashboard" },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={archivoSite.variable} suppressHydrationWarning>
      <body className="min-h-screen bg-bg text-fg antialiased">
        {children}
      </body>
    </html>
  );
}
