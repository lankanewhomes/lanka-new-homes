import type { Metadata } from "next";
import type { Project } from "@/types";
import { formatLkr } from "@/lib/format";
import { withSocial } from "@/lib/seo";

// "Apartments for sale in Colombo 7" pages (owner, 2026-11-09). Ubersuggest volumes: colombo 7 = 260, colombo 5 = 260, colombo 6 = 210,
// colombo 4 = 170, colombo 3 = 140, colombo 2 = 110, colombo 13 = 90, colombo 15 = 50 searches a month. One page per Colombo postcode
// (1 to 15) that has at least one apartment listing; the rest 404 until they do. Text comes from the live listings.

const APARTMENT = /apartment|condominium|penthouse/i;

/** The Colombo postcode (1 to 15) in a project's city or location, e.g. "Colombo 07" or "Colombo 5", or null. */
export function colomboPostcode(project: Project): number | null {
  const match = `${project.city ?? ""} ${project.location ?? ""}`.match(/colombo\s*0?(\d{1,2})\b/i);
  const n = match ? Number(match[1]) : NaN;
  return n >= 1 && n <= 15 ? n : null;
}

export const postcodeProjects = (all: Project[], n: number) =>
  all.filter((p) => APARTMENT.test(p.type ?? "") && colomboPostcode(p) === n);

export function colomboPostcodes(all: Project[]): number[] {
  const set = new Set<number>();
  for (const p of all) {
    const n = colomboPostcode(p);
    if (n && APARTMENT.test(p.type ?? "")) set.add(n);
  }
  return [...set].sort((a, b) => a - b);
}

export function parsePostcode(slug: string) {
  const n = /^colombo-(\d{1,2})$/.test(slug) ? Number(slug.split("-")[1]) : NaN;
  return n >= 1 && n <= 15 ? n : null;
}
export const postcodePath = (n: number) => `/projects/colombo/colombo-${n}`;

export function postcodeContent(n: number, projects: Project[]) {
  const pad = String(n).padStart(2, "0");
  const title = projects.length ? `Apartments for Sale in Colombo ${n}: ${projects.length} New ${projects.length === 1 ? "Project" : "Projects"}` : `Apartments for Sale in Colombo ${n}`;
  const priced = projects.map((p) => p.startingPriceLkr).filter((v) => v > 0);
  const developers = [...new Set(projects.map((p) => p.developerName).filter(Boolean))];
  const description = !projects.length ? `Apartments for sale in Colombo ${n} (Colombo ${pad}) on LankaNewHomes: new projects will appear here as developers list them.` : `Apartments for sale in Colombo ${n} (Colombo ${pad}): ${projects.length} new ${projects.length === 1 ? "project" : "projects"}${priced.length ? ` from ${formatLkr(Math.min(...priced))}` : ""}, with floor plans, photos and developer details. Enquire direct.`;
  const emptyParagraphs = [
    `There are no new apartment projects in Colombo ${n} (also written Colombo ${pad}) on LankaNewHomes yet; they will appear here as developers list them.`,
    `For the area itself, see the [Colombo ${n} neighbourhood guide](/neighborhoods/colombo-${pad}), or browse [all new apartment projects in Colombo](/projects/colombo).`,
  ];
  const paragraphs = !projects.length ? emptyParagraphs : [
    `This page lists the ${projects.length} new apartment ${projects.length === 1 ? "project" : "projects"} in Colombo ${n} (also written Colombo ${pad}) on LankaNewHomes${developers.length ? `, from ${developers.length} ${developers.length === 1 ? "developer" : "developers"}` : ""}.${priced.length ? ` Published starting prices run from ${formatLkr(Math.min(...priced))} to ${formatLkr(Math.max(...priced))}.` : ""}`,
    "Open a project to see its floor plans, sizes, amenities and status, and to check which units are still available. Use the enquiry form on any listing to ask the developer about prices, a site visit or availability: it goes straight to them, with no agent in between.",
    `For the area itself, see the [Colombo ${n} neighbourhood guide](/neighborhoods/colombo-${pad}), or browse [all new apartment projects in Colombo](/projects/colombo).`,
  ];
  return { title, description, paragraphs };
}

export function postcodeMetadata(n: number, projects: Project[]): Metadata {
  const { title, description } = postcodeContent(n, projects);
  const path = postcodePath(n);
  const meta = withSocial({ title, description, alternates: { canonical: path } }, { path });
  return projects.length ? meta : { ...meta, robots: { index: false, follow: true } };
}
