import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service",
  alternates: { canonical: "/terms" },
  robots: { index: false, follow: true },
};

export default function TermsPage() {
  return (
    <div className="static-page-shell">
      <h1>Terms of Service</h1>
      <p className="static-page-lede">By using LankaNewHomes, you agree to the following terms. Please read them carefully.</p>

      <h2>What LankaNewHomes is</h2>
      <p>LankaNewHomes is a marketplace that lists new construction projects, developments, and land parcels on behalf of developers, builders, and landowners across Sri Lanka. We do not own, develop, build, or sell the properties listed on this site — all transactions, negotiations, and agreements happen directly between buyers and the listed developer, builder, or seller. LankaNewHomes is not a party to any such transaction and is not a real estate broker or agent.</p>

      <h2>Accounts</h2>
      <p>You must provide accurate information when creating an account, whether as a buyer or a developer, and keep your login credentials secure. You&apos;re responsible for activity that happens under your account. We may suspend or remove an account that violates these terms.</p>

      <h2>Developer accounts and listings</h2>
      <p>Developers, builders, and their representatives are solely responsible for the accuracy of the project information, pricing, floor plans, imagery, and any other content they submit. Listings must represent real, genuine properties available for sale — fabricated, misleading, or duplicate listings are not permitted and may be removed without notice. Featured and Premium placements (see our <Link href="/pricing">Pricing</Link> page) affect how a listing is displayed and ranked; they do not guarantee a sale or any particular outcome.</p>

      <h2>Buyer use of the platform</h2>
      <p>Buyers may browse listings, save projects, and submit inquiries free of charge. Inquiry details are shared with the relevant developer or sales team so they can respond directly — see our <Link href="/privacy">Privacy Policy</Link> for how we handle that information. Using the platform to send spam, scrape data, or misrepresent yourself to a developer is not permitted.</p>

      <h2>Acceptable use</h2>
      <p>You agree not to:</p>
      <ul>
        <li>Post false, misleading, or infringing content;</li>
        <li>Attempt to gain unauthorized access to other accounts or non-public parts of the site;</li>
        <li>Interfere with the normal operation of the platform (e.g. automated scraping, denial-of-service);</li>
        <li>Use the platform for any unlawful purpose.</li>
      </ul>

      <h2>Intellectual property</h2>
      <p>The LankaNewHomes name, logo, and site design are our property. Project content (photos, floor plans, descriptions) remains the property of the submitting developer or its licensors; by submitting it, developers grant us a license to display it on the platform and in related marketing.</p>

      <h2>Disclaimers</h2>
      <p>Listing information is provided by developers and, while we make reasonable efforts to review it, we do not independently verify every detail (pricing, availability, completion dates, or specifications) and cannot guarantee its accuracy. Buyers should independently confirm all details directly with the developer before making any purchase decision. The platform is provided &quot;as is&quot; without warranties of any kind.</p>

      <h2>Limitation of liability</h2>
      <p>To the fullest extent permitted by law, LankaNewHomes is not liable for any loss or damage arising from a transaction between a buyer and a developer, from reliance on listing information, or from the platform being unavailable or containing errors.</p>

      <h2>Governing law</h2>
      <p>These terms are governed by the laws of Sri Lanka.</p>

      <h2>Changes to these terms</h2>
      <p>We may update these terms as the platform evolves. Continued use of the site after a change means you accept the updated terms.</p>

      <h2>Contact</h2>
      <p>Questions about these terms can be sent to <a href="mailto:support@lankanewhomes.com">support@lankanewhomes.com</a>.</p>
    </div>
  );
}
