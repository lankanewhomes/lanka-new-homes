import type { Metadata } from "next";
import Link from "next/link";
import { SeoAboutBlock } from "@/components/marketplace/seo-about-block";
import { guides } from "@/lib/guides";

export const metadata: Metadata = {
  title: "Buying Guides for Sri Lanka Real Estate",
  description: "Guides for buying new property in Sri Lanka, including foreign ownership rules, investment property advice, and the golden visa residency route.",
  alternates: {
    canonical: "/guides",
  },
};

export default function GuidesIndexPage() {
  const guideList = Object.values(guides);

  return (
    <div className="space-y-4">
      <h1 className="text-3xl font-semibold">Buying Guides for Sri Lanka Real Estate</h1>
      <p className="text-sm text-stone-600">Practical guides for buying new-build property in Sri Lanka, written for local and overseas buyers.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {guideList.map((guide) => (
          <Link key={guide.slug} href={guide.path} className="block border border-stone-200 bg-white p-4 hover:border-stone-400">
            <h2 className="text-lg font-semibold text-stone-900">{guide.h1}</h2>
            <p className="mt-2 text-sm text-stone-600">{guide.metaDescription}</p>
          </Link>
        ))}
      </div>
      <SeoAboutBlock
        title="How to use these guides"
        paragraphs={[
          "These guides explain the questions buyers ask most when looking at new-build property in Sri Lanka: whether foreigners can buy, how investment property works, and how a residency route such as the golden visa fits with a purchase. They are written in plain language for both local and overseas buyers.",
          "Treat each guide as a starting point rather than legal advice. Rules on ownership, taxes and residency can change, so confirm the current position with a qualified lawyer or the relevant authority before you commit to a purchase.",
          "Foreign buyers should read the foreign ownership guide first, because it covers who can buy, which property types are open to overseas buyers and what to check before paying a deposit. Investors will find the investment property guide more useful, as it explains how to think about location, developer track record and payment plans. The golden visa guide covers the residency route linked to qualifying property investment.",
          "Every guide links to the new projects, neighbourhoods and developer profiles it mentions, so you can move from reading about a topic to seeing real homes. If you have a question the guides do not answer, contact us and we will point you to the right developer or source.",
          "When you are ready to look at homes, browse new projects by area or type on LankaNewHomes, compare payment plans and floor plans on each listing, and send an enquiry straight to the developer.",
        ]}
      />
    </div>
  );
}
