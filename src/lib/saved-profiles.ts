import type { createSupabaseServerClient } from "@/lib/supabase-server";
import { getMarketingCompanyBySlug } from "@/lib/marketing-company-store";
import { getSalesCompanyBySlug } from "@/lib/sales-company-store";
import { getArchitectBySlug } from "@/lib/architect-store";
import { getInteriorDesignerBySlug } from "@/lib/interior-designer-store";
import { getConstructionCompanyBySlug } from "@/lib/construction-company-store";
import { PROFILE_ENTITY_BASE_PATH, PROFILE_ENTITY_LABEL, isProfileEntityType } from "@/lib/profile-entities";
import type { CompanyProfile, Developer, ProfileEntityType } from "@/types";

// One row on the account dashboard's "Saved developments" page — a followed
// developer (saved_developers) or a followed partner-directory profile
// (saved_companies: marketing/sales company, architect, interior designer,
// construction company). Both follow buttons live in ProfileView.
export type SavedProfileItem = {
  kind: ProfileEntityType;
  slug: string;
  name: string;
  logo: string;
  href: string;
  /** "Developer", "Marketing Company", … */
  label: string;
  /** Second line under the name. */
  meta: string;
  savedAt: string;
};

type UserSupabase = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const COMPANY_LOOKUP: Record<Exclude<ProfileEntityType, "developer">, (slug: string) => Promise<CompanyProfile | undefined>> = {
  "marketing-company": getMarketingCompanyBySlug,
  "sales-company": getSalesCompanyBySlug,
  architect: getArchitectBySlug,
  "interior-designer": getInteriorDesignerBySlug,
  "construction-company": (slug) => getConstructionCompanyBySlug(slug) as Promise<CompanyProfile | undefined>,
};

// `supabase` must be the signed-in user's client: saved_developers and
// saved_companies are RLS "read own". The directory records themselves are
// read through the stores (service role) because the partner tables have no
// public-read policy for anon/user sessions.
export async function getSavedProfiles(supabase: UserSupabase, userId: string): Promise<SavedProfileItem[]> {
  const [devRes, companyRes] = await Promise.all([
    supabase.from("saved_developers").select("developer_slug, created_at, developers(data)").eq("user_id", userId),
    supabase.from("saved_companies").select("entity_type, entity_slug, created_at").eq("user_id", userId),
  ]);

  const developers: SavedProfileItem[] = (devRes.data ?? []).flatMap((row) => {
    const developer = (row as unknown as { developers: { data: Developer } | null }).developers?.data;
    if (!developer) return [];
    const active = developer.activeProjects ?? 0;
    const completed = developer.completedProjects ?? 0;
    return [{
      kind: "developer" as const,
      slug: developer.slug,
      name: developer.name,
      logo: developer.logo ?? "",
      href: `${PROFILE_ENTITY_BASE_PATH.developer}/${developer.slug}`,
      label: PROFILE_ENTITY_LABEL.developer,
      meta: active || completed ? `${active} active project${active === 1 ? "" : "s"} · ${completed} completed` : developer.location ?? "",
      savedAt: (row as { created_at: string }).created_at,
    }];
  });

  const companies = await Promise.all(
    (companyRes.data ?? []).map(async (row): Promise<SavedProfileItem | null> => {
      const { entity_type: kind, entity_slug: slug, created_at: savedAt } = row as { entity_type: string; entity_slug: string; created_at: string };
      if (!isProfileEntityType(kind) || kind === "developer") return null;
      const company = await COMPANY_LOOKUP[kind](slug).catch(() => undefined);
      if (!company) return null;
      return {
        kind,
        slug,
        name: company.name,
        logo: company.logo ?? "",
        href: `${PROFILE_ENTITY_BASE_PATH[kind]}/${slug}`,
        label: PROFILE_ENTITY_LABEL[kind],
        meta: company.location || PROFILE_ENTITY_LABEL[kind],
        savedAt,
      };
    }),
  );

  return [...developers, ...companies.filter((item): item is SavedProfileItem => item !== null)]
    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime());
}
