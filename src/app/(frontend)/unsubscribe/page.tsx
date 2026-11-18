import type { Metadata } from "next";
import { UnsubscribeForm } from "./unsubscribe-form";

export const metadata: Metadata = { title: "Unsubscribe", robots: { index: false, follow: false } };

export default async function UnsubscribePage({ searchParams }: { searchParams: Promise<{ e?: string; t?: string }> }) {
  const { e = "", t = "" } = await searchParams;
  return (
    <div className="fdv-page legal-page">
      <section className="fdv-box fdv-box--gray" aria-label="Unsubscribe">
        <div className="static-page-shell legal-card">
          <h1>Unsubscribe</h1>
          <UnsubscribeForm email={e} token={t} />
        </div>
      </section>
    </div>
  );
}
