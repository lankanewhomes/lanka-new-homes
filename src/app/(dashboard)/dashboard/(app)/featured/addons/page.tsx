import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "../../../_components/PageHero";
import { getSession } from "../../../_data/session";
import { ADD_ONS, type AddOnType } from "@/lib/featured/config";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { getFeaturedData } from "@/lib/featured/store";
import { bookAddonAction } from "../actions";
import { FEATURED_ENABLED } from "@/lib/featured/demo";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Featured add-ons" };
export const dynamic = "force-dynamic";

const input = "w-full rounded border border-[#d8d2c4] bg-white px-3 py-2 text-sm";
const rs = (n: number) => `Rs. ${n.toLocaleString("en-US")}`;
const CITIES = ["Colombo", "Kandy", "Galle", "Negombo", "Nuwara Eliya"];

export default async function AddonsPage({ searchParams }: { searchParams: Promise<{ notice?: string; ok?: string }> }) {
  if (!FEATURED_ENABLED) notFound();
  const session = await getSession();
  if (!session) redirect("/developers/login");
  if (session.role !== "admin") redirect("/dashboard/featured");
  const { notice, ok } = await searchParams;
  const { state, projects, developers } = await getFeaturedData();
  const name = (slug: string) => developers.find((developer) => developer.slug === slug)?.name ?? slug;
  const devs = developers.filter((developer) => projects.some((project) => project.developerSlug === developer.slug)).sort((a, b) => a.name.localeCompare(b.name));
  const sorted = [...state.bookings].sort((a, b) => a.type.localeCompare(b.type) || a.startDate.localeCompare(b.startDate));

  return (
    <div className="space-y-6">
      <PageHero title="Add-on bookings" description="Hero slides, announcement bar, Developer of the Month, new launches, city tiles, sponsored articles, social posts, reels, newsletter slots and website links in search." stat={{ label: "Bookings", value: String(state.bookings.length) }} />
      {FEATURED_DEMO ? <p className="border border-[#f47b36] bg-[#fff4ec] px-4 py-3 text-sm"><strong>DEMO DATA.</strong> Saving is switched off in the preview.</p> : null}
      {notice ? <p className={`border px-4 py-3 text-sm ${ok === "1" ? "border-green-600 bg-green-50" : "border-[#d8d2c4] bg-[#f7f4ec]"}`}>{notice}</p> : null}
      <p className="text-sm"><Link className="underline" href="/dashboard/featured">Back to packages</Link></p>

      <section className="border border-[#e6e0d2] bg-white p-4" aria-label="Book an add-on">
        <h2 className="text-xl font-medium">Book an add-on</h2>
        <form action={bookAddonAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3" encType="multipart/form-data">
          <label className="text-sm">Type<select name="type" className={input}>{(Object.keys(ADD_ONS) as AddOnType[]).map((type) => <option key={type} value={type}>{ADD_ONS[type].name}: {rs(ADD_ONS[type].priceLkr)} {ADD_ONS[type].unit}</option>)}</select></label>
          <label className="text-sm">Developer<select name="developer" className={input} required>{devs.map((developer) => <option key={developer.slug} value={developer.slug}>{developer.name}</option>)}</select></label>
          <label className="text-sm">Project<select name="project" className={input}><option value="">(none)</option>{projects.filter((project) => project.isPublished !== false).map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}</select></label>
          <label className="text-sm">City (city tile only)<select name="city" className={input}><option value="">(none)</option>{CITIES.map((city) => <option key={city} value={city}>{city}</option>)}</select></label>
          <label className="text-sm">Start date<input type="date" name="start" className={input} required /></label>
          <label className="text-sm">End date<input type="date" name="end" className={input} required /></label>
          <label className="text-sm">Creative image (upload)<input type="file" name="image_file" accept="image/*" className={input} /></label>
          <label className="text-sm">…or image URL<input name="image_url" className={input} placeholder="https://…" /></label>
          <label className="text-sm">Headline<input name="headline" className={input} /></label>
          <label className="text-sm">Sub-line<input name="subline" className={input} /></label>
          <label className="text-sm">CTA label<input name="cta_label" className={input} placeholder="View project" /></label>
          <label className="text-sm">CTA link<input name="cta_href" className={input} placeholder="/projects/…" /></label>
          <p className="text-sm text-[#6b6b6b] sm:col-span-2 lg:col-span-3">Website link in search: pick the developer, leave Project on (none) to cover all their Featured projects (or pick one project), set the dates, and put their website (https://…) in the CTA link box. Nothing else is needed. It shows on their Featured cards in the phone search and needs an active Premium or Elite package.</p>
          <div><button type="submit" className="inline-flex items-center rounded-full bg-[#17171b] px-5 py-2 text-sm font-medium text-white">Book add-on</button></div>
        </form>
      </section>

      <section aria-label="Bookings" className="overflow-x-auto border border-[#e6e0d2] bg-white">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-[#f7f4ec]"><tr><th className="p-3">Add-on</th><th className="p-3">Developer</th><th className="p-3">Project / city</th><th className="p-3">Dates</th><th className="p-3">Creative</th></tr></thead>
          <tbody>{sorted.map((booking) => (
            <tr key={booking.id} className="border-t border-[#eee8da]">
              <td className="p-3">{ADD_ONS[booking.type]?.name}</td><td className="p-3">{name(booking.developerSlug)}</td>
              <td className="p-3">{booking.city ?? booking.projectSlug ?? ""}</td><td className="p-3">{booking.startDate} to {booking.endDate}</td>
              <td className="p-3">{booking.type === "website-link" ? booking.creative?.ctaHref ?? "" : booking.creative?.headline ?? ""}</td>
            </tr>))}</tbody>
        </table>
      </section>
    </div>
  );
}
