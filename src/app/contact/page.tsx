import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with the NewHomesSrilanka team.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <div className="static-page-shell">
      <h1>Contact us</h1>
      <p className="static-page-lede">Have a question about a listing, a developer partnership, or the platform itself? Reach us directly.</p>

      <h2>General inquiries</h2>
      <p>Email <a href="mailto:hello@lankaliving.lk">hello@lankaliving.lk</a> and we&apos;ll get back to you within one business day.</p>

      <h2>Developer partnerships</h2>
      <p>Interested in listing your projects or advertising on the homepage? Email <a href="mailto:partners@lankaliving.lk">partners@lankaliving.lk</a> or <a href="/developers/register">register as a developer</a>.</p>

      <h2>Office</h2>
      <p>Colombo, Sri Lanka</p>
    </div>
  );
}
