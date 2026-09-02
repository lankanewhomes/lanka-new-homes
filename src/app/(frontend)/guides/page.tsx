import type { Metadata } from "next";
import Link from "next/link";
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
    </div>
  );
}
