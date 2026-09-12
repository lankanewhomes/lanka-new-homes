import { getArchitectBySlug } from "@/lib/architect-store";
import { getDeveloperBySlug } from "@/lib/developer-store";
import { getInteriorDesignerBySlug } from "@/lib/interior-designer-store";
import { getMarketingCompanyBySlug } from "@/lib/marketing-company-store";
import { getSalesCompanyBySlug } from "@/lib/sales-company-store";
import type { CompanyProfile, Developer, Project } from "@/types";

export type ProjectTeamRole = {
  key: string;
  label: string;
  profile: CompanyProfile | Developer;
  profileHref: string;
  /** Other published projects with this same company in the same role, most recent... well, in getAllProjects order — excludes the current project. Real count, nothing estimated. */
  otherProjects: Project[];
};

// Every role a Project can actually link to a company profile — Builder /
// Landscape Architect (from the reference layout) have no equivalent field
// on Project, so they're never offered here rather than shown empty.
const ROLE_DEFS: {
  key: string;
  label: string;
  slugOf: (p: Project) => string | undefined;
  nameOf: (p: Project) => string | undefined;
  profileBase: string;
  fetch: (slug: string) => Promise<CompanyProfile | Developer | undefined>;
  matches: (p: Project, slug: string) => boolean;
}[] = [
  { key: "developer", label: "Developer", slugOf: (p) => p.developerSlug, nameOf: (p) => p.developerName, profileBase: "/developers", fetch: getDeveloperBySlug, matches: (p, slug) => p.developerSlug === slug },
  { key: "architect", label: "Architect", slugOf: (p) => p.architectSlug, nameOf: (p) => p.architectName, profileBase: "/architects", fetch: getArchitectBySlug, matches: (p, slug) => p.architectSlug === slug },
  { key: "marketing", label: "Project Marketer", slugOf: (p) => p.marketingCompanySlug, nameOf: (p) => p.marketingCompanyName, profileBase: "/marketing-companies", fetch: getMarketingCompanyBySlug, matches: (p, slug) => p.marketingCompanySlug === slug },
  { key: "sales", label: "Sales Company", slugOf: (p) => p.salesCompanySlug, nameOf: (p) => p.salesCompanyName, profileBase: "/sales-companies", fetch: getSalesCompanyBySlug, matches: (p, slug) => p.salesCompanySlug === slug },
  { key: "interior", label: "Interior Designer", slugOf: (p) => p.interiorDesignerSlug, nameOf: (p) => p.interiorDesignerName, profileBase: "/interior-designers", fetch: getInteriorDesignerBySlug, matches: (p, slug) => p.interiorDesignerSlug === slug },
];

// "Meet the team" data for one project: every real linked company (skips
// blank roles entirely — a project with no Interior Designer just doesn't
// get that tab), each with its own profile and its other real projects on
// this site in that same role (a genuine count from actual relationships,
// not a self-reported or estimated number).
export async function buildProjectTeam(project: Project, allProjects: Project[]): Promise<ProjectTeamRole[]> {
  const candidates = ROLE_DEFS.map((def) => ({ def, slug: def.slugOf(project), name: def.nameOf(project) })).filter((c) => c.slug && c.name);

  const resolved = await Promise.all(
    candidates.map(async ({ def, slug }) => {
      const profile = await def.fetch(slug!);
      if (!profile) return null;
      const otherProjects = allProjects.filter((p) => p.slug !== project.slug && def.matches(p, slug!)).slice(0, 6);
      return { key: def.key, label: def.label, profile, profileHref: `${def.profileBase}/${slug}`, otherProjects } satisfies ProjectTeamRole;
    }),
  );

  return resolved.filter((r): r is ProjectTeamRole => r !== null);
}
