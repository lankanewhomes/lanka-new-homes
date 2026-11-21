import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { PageHero } from "../../_components/PageHero";
import { getSession } from "../../_data/session";
import { TIERS, TIER_ORDER, priceWithDiscount, PLACEMENT_LABEL, PLACEMENT_MIN_TIER, TIER_RANK, type Placement } from "@/lib/featured/config";
import { FEATURED_DEMO } from "@/lib/featured/demo";
import { isActive } from "@/lib/featured/engine";
import { manageableDeveloperSlugs } from "@/lib/featured/admin";
import { getFeaturedData } from "@/lib/featured/store";
import { assignPackageAction, saveProjectsAction } from "./actions";
import { FEATURED_ENABLED } from "@/lib/featured/demo";
import { notFound } from "next/navigation";

export const metadata: Metadata = { title: "Featured placements" };
export const dynamic = "force-dynamic";

const input = "w-full rounded border border-[#d8d2c4] bg-white px-3 py-2 text-sm";
const button = "inline-flex items-center rounded-full bg-[#17171b] px-5 py-2 text-sm font-medium text-white hover:bg-[#2c2c33]";
const rs = (n: number) => `Rs. ${n.toLocaleString("en-US")}`;

export default async function FeaturedAdminPage({ searchParams }: { searchParams: Promise<{ notice?: string; ok?: string }> }) {
  if (!FEATURED_ENABLED) notFound();
  const session = await getSession();
  if (!session) redirect("/developers/login");
  const { notice, ok } = await searchParams;
  const { state, projects, developers } = await getFeaturedData();
  const allowed = await manageableDeveloperSlugs(session);
  const isAdmin = session.role === "admin";
  const packages = state.packages.filter((pkg) => allowed === "all" || allowed.includes(pkg.developerSlug));
  const today = new Date().toISOString().slice(0, 10);
  const devName = (slug: string) => developers.find((developer) => developer.slug === slug)?.name ?? slug;
  const ownProjects = (slug: string) => projects.filter((project) => project.developerSlug === slug && project.isPublished !== false);
  const devsWithProjects = developers.filter((developer) => projects.some((project) => project.developerSlug === developer.slug)).sort((a, b) => a.name.localeCompare(b.name));

  return (
    <div className="space-y-6">
      <PageHero
        title={isAdmin ? "Featured placements" : "My featured placements"}
        description={isAdmin ? "Assign a package to a developer, pick the projects for its slots and book add-ons." : "Choose which of your projects fill your package slots. You can swap them any time until the end date."}
        stat={{ label: "Active packages", value: String(packages.filter((pkg) => isActive(pkg.startDate, pkg.endDate, new Date())).length) }}
      />

      {FEATURED_DEMO ? <p className="border border-[#f47b36] bg-[#fff4ec] px-4 py-3 text-sm"><strong>DEMO DATA.</strong> These packages are made up from real projects so you can see every placement. Saving is switched off in the preview.</p> : null}
      {notice ? <p className={`border px-4 py-3 text-sm ${ok === "1" ? "border-green-600 bg-green-50" : "border-[#d8d2c4] bg-[#f7f4ec]"}`}>{notice}</p> : null}

      <nav className="flex flex-wrap gap-3 text-sm">
        {isAdmin ? <Link className="underline" href="/dashboard/featured/addons">Add-on bookings</Link> : null}
        <Link className="underline" href="/dashboard/featured/report">Monthly report</Link>
        <Link className="underline" href="/advertise" target="_blank">Public pricing page</Link>
      </nav>

      <section className="space-y-4" aria-label="Packages">
        <h2 className="text-xl font-medium">Packages</h2>
        {packages.length === 0 ? <p className="text-sm text-[#6b6355]">No package yet.</p> : null}
        {packages.map((pkg) => {
          const own = ownProjects(pkg.developerSlug);
          const ended = today > pkg.endDate;
          return (
            <form key={pkg.id} action={saveProjectsAction} className="border border-[#e6e0d2] bg-white p-4">
              <input type="hidden" name="package" value={pkg.id} />
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-medium">{devName(pkg.developerSlug)} <span className="ml-2 rounded bg-[#17171b] px-2 py-0.5 text-xs uppercase tracking-wide text-white">{TIERS[pkg.tier].name}</span></h3>
                <p className="text-sm text-[#6b6355]">{pkg.startDate} to {pkg.endDate} · {pkg.projectSlugs.length}/{pkg.slots} slots · {ended ? "ended" : isActive(pkg.startDate, pkg.endDate, new Date()) ? "active" : "not started"}{pkg.foundingPartner ? " · Founding Partner" : ""}</p>
              </div>
              <p className="mt-2 text-sm text-[#6b6355]">Pick up to {pkg.slots} {pkg.slots === 1 ? "project" : "projects"}.{ended ? " This package has ended, so the projects are locked." : ""}</p>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2 lg:grid-cols-3">
                {own.map((project) => (
                  <li key={project.slug}>
                    <label className="flex items-start gap-2 text-sm">
                      <input type="checkbox" name="project" value={project.slug} defaultChecked={pkg.projectSlugs.includes(project.slug)} disabled={ended} className="mt-1" />
                      <span>{project.name}<small className="block text-[#6b6355]">{[project.city, project.type, project.status].filter(Boolean).join(" · ")}</small></span>
                    </label>
                  </li>
                ))}
              </ul>
              <div className="mt-3"><button type="submit" className={button} disabled={ended}>Save projects</button></div>
            </form>
          );
        })}
      </section>

      {isAdmin ? (
        <section className="border border-[#e6e0d2] bg-white p-4" aria-label="Assign a package">
          <h2 className="text-xl font-medium">Assign a package</h2>
          <form action={assignPackageAction} className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">Developer<select name="developer" className={input} required>{devsWithProjects.map((developer) => <option key={developer.slug} value={developer.slug}>{developer.name}</option>)}</select></label>
            <label className="text-sm">Tier<select name="tier" className={input}>{[...TIER_ORDER].reverse().map((tier) => <option key={tier} value={tier}>{TIERS[tier].name}: {rs(TIERS[tier].priceLkrPerMonth)}/month, {TIERS[tier].projectSlots} {TIERS[tier].projectSlots === 1 ? "project" : "projects"}</option>)}</select></label>
            <label className="text-sm">Start date<input type="date" name="start" className={input} required defaultValue={today} /></label>
            <label className="text-sm">End date<input type="date" name="end" className={input} required /></label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="founding" /> Founding Partner (50% off first 6 months)</label>
            <div><button type="submit" className={button}>Assign package</button></div>
          </form>
          <details className="mt-4 text-sm">
            <summary className="cursor-pointer">Price check</summary>
            <table className="mt-2 text-left text-sm"><thead><tr><th className="pr-4">Tier</th><th className="pr-4">1 mo</th><th className="pr-4">3 mo</th><th className="pr-4">6 mo</th><th>12 mo</th></tr></thead>
              <tbody>{[...TIER_ORDER].reverse().map((tier) => <tr key={tier}><td className="pr-4">{TIERS[tier].name}</td>{[1, 3, 6, 12].map((m) => <td key={m} className="pr-4">{rs(priceWithDiscount(TIERS[tier].priceLkrPerMonth, m).total)}</td>)}</tr>)}</tbody></table>
            <p className="mt-1 text-xs text-[#6b6355]">Prices are edited in src/lib/featured/config.ts.</p>
          </details>
        </section>
      ) : null}

      <section aria-label="What each tier unlocks" className="border border-[#e6e0d2] bg-white p-4">
        <h2 className="text-xl font-medium">Where each tier shows</h2>
        <ul className="mt-2 grid gap-1 text-sm sm:grid-cols-2">
          {(Object.keys(PLACEMENT_MIN_TIER) as Placement[]).sort((a, b) => TIER_RANK[PLACEMENT_MIN_TIER[a]!] - TIER_RANK[PLACEMENT_MIN_TIER[b]!]).map((placement) => <li key={placement}>{PLACEMENT_LABEL[placement]}: <strong>{TIERS[PLACEMENT_MIN_TIER[placement]!].name}</strong> and above</li>)}
        </ul>
      </section>
    </div>
  );
}
