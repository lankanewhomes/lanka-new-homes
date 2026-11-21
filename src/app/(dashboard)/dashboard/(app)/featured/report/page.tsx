import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "../../../_components/PageHero";
import { getSession } from "../../../_data/session";
import { manageableDeveloperSlugs } from "@/lib/featured/admin";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { getMonthlyReport } from "@/lib/featured/report";
import { getFeaturedData } from "@/lib/featured/store";
import { FEATURED_ENABLED } from "@/lib/featured/demo";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Featured monthly report" };
export const dynamic = "force-dynamic";

export default async function ReportPage({ searchParams }: { searchParams: Promise<{ developer?: string; month?: string }> }) {
  if (!FEATURED_ENABLED) notFound();
  const session = await getSession();
  if (!session) redirect("/developers/login");
  const query = await searchParams;
  const { state, developers } = await getFeaturedData();
  const allowed = await manageableDeveloperSlugs(session);
  const withPackage = [...new Set(state.packages.map((pkg) => pkg.developerSlug))].filter((slug) => allowed === "all" || allowed.includes(slug));
  const developer = query.developer && withPackage.includes(query.developer) ? query.developer : withPackage[0];
  const month = /^\d{4}-\d{2}$/.test(query.month ?? "") ? query.month! : new Date().toISOString().slice(0, 7);
  const name = (slug: string) => developers.find((entry) => entry.slug === slug)?.name ?? slug;
  const report = developer ? await getMonthlyReport(developer, month) : { rows: [], demo: false };
  const total = report.rows.reduce((sum, row) => ({ impressions: sum.impressions + row.impressions, clicks: sum.clicks + row.clicks, leads: sum.leads + row.leads }), { impressions: 0, clicks: 0, leads: 0 });
  const pct = (a: number, b: number) => (b ? `${((a / b) * 100).toFixed(1)}%` : "-");

  return (
    <div className="space-y-6">
      <PageHero title="Monthly report" description="Views, clicks and leads for each placement your package shows in." stat={{ label: "Leads this month", value: String(total.leads) }} />
      {FEATURED_DEMO ? <p className="border border-[#f47b36] bg-[#fff4ec] px-4 py-3 text-sm"><strong>DEMO NUMBERS.</strong> These figures are invented for the preview. Live numbers come from the visits and clicks we record once placements are running.</p> : null}
      <p className="text-sm"><Link className="underline" href="/dashboard/featured">Back to packages</Link></p>
      <form className="flex flex-wrap items-end gap-3 text-sm" method="get">
        {withPackage.length > 1 ? <label>Developer<select name="developer" defaultValue={developer} className="ml-2 rounded border border-[#d8d2c4] bg-white px-3 py-2">{withPackage.map((slug) => <option key={slug} value={slug}>{name(slug)}</option>)}</select></label> : null}
        <label>Month<input type="month" name="month" defaultValue={month} className="ml-2 rounded border border-[#d8d2c4] bg-white px-3 py-2" /></label>
        <button className="rounded-full bg-[#17171b] px-5 py-2 text-white" type="submit">Show</button>
      </form>
      {developer ? <h2 className="text-xl font-medium">{name(developer)}, {month}</h2> : <p className="text-sm">No package yet.</p>}
      <div className="overflow-x-auto border border-[#e6e0d2] bg-white">
        <table className="w-full min-w-[560px] text-left text-sm">
          <thead className="bg-[#f7f4ec]"><tr><th className="p-3">Placement</th><th className="p-3 text-right">Views</th><th className="p-3 text-right">Clicks</th><th className="p-3 text-right">Click rate</th><th className="p-3 text-right">Leads</th></tr></thead>
          <tbody>
            {report.rows.map((row) => <tr key={row.placement} className="border-t border-[#eee8da]"><td className="p-3">{row.label}</td><td className="p-3 text-right tabular-nums">{row.impressions.toLocaleString()}</td><td className="p-3 text-right tabular-nums">{row.clicks.toLocaleString()}</td><td className="p-3 text-right tabular-nums">{pct(row.clicks, row.impressions)}</td><td className="p-3 text-right tabular-nums">{row.leads}</td></tr>)}
            <tr className="border-t-2 border-[#17171b] font-medium"><td className="p-3">Total</td><td className="p-3 text-right tabular-nums">{total.impressions.toLocaleString()}</td><td className="p-3 text-right tabular-nums">{total.clicks.toLocaleString()}</td><td className="p-3 text-right tabular-nums">{pct(total.clicks, total.impressions)}</td><td className="p-3 text-right tabular-nums">{total.leads}</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
