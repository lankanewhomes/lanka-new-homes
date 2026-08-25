import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { projects } from "@/data/projects";

export const metadata: Metadata = {
  title: "Courtyard by Prime Brochure",
  robots: { index: false, follow: false },
};

type BrochurePageProps = { params: Promise<{ slug: string }> };

export default async function BrochurePage({ params }: BrochurePageProps) {
  const { slug } = await params;
  const project = projects.find((item) => item.slug === slug);
  if (!project) return notFound();

  return (
    <main className="mx-auto w-full max-w-290 space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="space-y-2 border-b border-stone-200 pb-6">
        <p className="text-sm text-stone-600">Prime | Thalawathugoda</p>
        <h1 className="text-4xl font-semibold">{project.name}</h1>
        <p className="max-w-2xl text-stone-700">An exclusive collection of limited private residences built around a unique courtyard-centred design.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2">
        {project.gallery.map((item) => (
          <figure key={item.image} className="border border-stone-200 bg-stone-50 p-2">
            <Image src={item.image} alt={item.label} width={1200} height={540} className="h-auto w-full" />
            <figcaption className="p-2 text-sm font-medium">{item.label}</figcaption>
          </figure>
        ))}
        {project.floorPlans.map((floorPlan) => (
          <figure key={floorPlan.id} className="border border-stone-200 bg-stone-50 p-2">
            <Image src={floorPlan.image} alt={floorPlan.planName} width={1200} height={720} className="h-auto w-full" />
            <figcaption className="p-2 text-sm font-medium">{floorPlan.planName}</figcaption>
          </figure>
        ))}
      </div>
      <section className="grid gap-6 border border-stone-200 bg-white p-6 md:grid-cols-2">
        <div>
          <h2 className="text-xl font-semibold">Location Highlights</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
            <li>1.5 KM to Thalawathugoda Town</li>
            <li>200m to 689 bus route</li>
            <li>Nearby banks, supermarkets, and Vidura College</li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold">Payment plan</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-stone-700">
            <li>25% Down Payment</li>
            <li>1% Monthly for 30 Months</li>
            <li>5% payable in the 12th and 24th months</li>
            <li>35% balance at handover</li>
          </ul>
        </div>
      </section>
      <p className="text-sm font-medium text-stone-700">Hotline: 1322 | From LKR 85,000,000 per unit upwards</p>
    </main>
  );
}
