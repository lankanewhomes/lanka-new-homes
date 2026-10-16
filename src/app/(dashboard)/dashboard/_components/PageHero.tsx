import type { ReactNode } from "react";

/**
 * The brand's dark split hero (same as the /account pages): a big light-weight title with a short line under it on the left, and one
 * white stat card on the right. `actions` sit under the text as outline buttons.
 */
export function PageHero({ title, description, stat, extraStats, chips, actions }: {
  title: string;
  description?: ReactNode;
  stat?: { label: string; value: string };
  /** More white stat cards beside the first one (e.g. Lands next to Projects). */
  extraStats?: { label: string; value: string }[];
  chips?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <section className="d-hero mb-6">
      <div className="grid items-center gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,320px)]">
        <div className="min-w-0">
          <h1 className="text-[32px] font-normal leading-tight tracking-tight sm:text-[40px]">{title}</h1>
          {description ? <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-white/75">{description}</p> : null}
          {chips ? <div className="mt-3 flex flex-wrap items-center gap-2">{chips}</div> : null}
          {actions ? <div className="mt-5 flex flex-wrap gap-2">{actions}</div> : null}
        </div>
        {stat ? (
          <div className={`grid gap-3 ${extraStats?.length ? "grid-cols-2" : ""}`}>
            {[stat, ...(extraStats ?? [])].map((item) => (
              <div key={item.label} className="bg-white px-6 py-5 text-[#1f1f1f]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#6b6355]">{item.label}</p>
                <p className="mt-1.5 text-[40px] font-normal leading-none tabular-nums">{item.value}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}

/** Outline pill button for the hero (white outline on the dark ground, like "Browse new homes" on /account). */
export const heroBtn = "inline-flex items-center gap-1.5 rounded-full border border-white/70 px-5 py-2 text-sm font-medium text-white transition hover:bg-white hover:text-[#17171b] disabled:opacity-50";
export const heroBtnSolid = "inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2 text-sm font-medium text-[#17171b] transition hover:bg-white/90 disabled:opacity-50";
