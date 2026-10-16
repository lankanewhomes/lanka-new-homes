import type { ListingFaq } from "@/lib/listing-faq";

// Same markup as the neighbourhood and guide FAQs (details/summary), so the style comes from the existing guide-page-faq-item rules.
export function ListingFaqSection({ faqs }: { faqs: ListingFaq[] }) {
  if (faqs.length === 0) return null;
  return (
    <section id="faq" className="project-description-shell" aria-label="Frequently asked questions">
      <h2>Frequently Asked Questions</h2>
      {faqs.map((faq) => (
        <details key={faq.question} className="guide-page-faq-item">
          <summary>{faq.question}</summary>
          <p>{faq.answer}</p>
        </details>
      ))}
    </section>
  );
}
