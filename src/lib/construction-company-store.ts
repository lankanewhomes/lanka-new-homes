import { supabaseAdmin } from "@/lib/supabase";
import type { ConstructionCompany, ConstructionCompanyCategory } from "@/types";

type ConstructionCompanyRow = {
  slug: string;
  data: ConstructionCompany;
};

type CreateConstructionCompanyInput = {
  name: string;
  logo: string;
  description: string;
  location: string;
  categories: ConstructionCompanyCategory[];
  yearsInBusiness?: number;
  website?: string;
  email?: string;
  phone?: string;
  socialLinks?: ConstructionCompany["socialLinks"];
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function rowToCompany(row: ConstructionCompanyRow): ConstructionCompany {
  return { ...row.data, slug: row.slug };
}

function companyToRow(company: ConstructionCompany) {
  return {
    slug: company.slug,
    name: company.name,
    location: company.location,
    data: company,
  };
}

export async function getAllConstructionCompanies(): Promise<ConstructionCompany[]> {
  const { data, error } = await supabaseAdmin.from("construction_companies").select("slug, data");
  if (error) throw new Error(`Failed to load construction companies: ${error.message}`);
  return (data ?? []).map((row) => rowToCompany(row as ConstructionCompanyRow));
}

export async function getConstructionCompanyBySlug(slug: string): Promise<ConstructionCompany | undefined> {
  const { data, error } = await supabaseAdmin.from("construction_companies").select("slug, data").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load construction company ${slug}: ${error.message}`);
  return data ? rowToCompany(data as ConstructionCompanyRow) : undefined;
}

export async function getConstructionCompaniesByCategory(category: ConstructionCompanyCategory): Promise<ConstructionCompany[]> {
  const companies = await getAllConstructionCompanies();
  return companies.filter((company) => company.categories.includes(category));
}

export async function createConstructionCompany(input: CreateConstructionCompanyInput): Promise<ConstructionCompany> {
  const { data: existingSlugs, error: slugError } = await supabaseAdmin.from("construction_companies").select("slug");
  if (slugError) throw new Error(`Failed to check existing slugs: ${slugError.message}`);
  const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

  const baseSlug = toSlug(input.name) || "new-construction-company";
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const company: ConstructionCompany = {
    slug,
    name: input.name,
    logo: input.logo,
    description: input.description,
    location: input.location,
    categories: input.categories,
    yearsInBusiness: input.yearsInBusiness,
    website: input.website,
    email: input.email,
    phone: input.phone,
    socialLinks: input.socialLinks ?? {},
  };

  const { error } = await supabaseAdmin.from("construction_companies").insert(companyToRow(company));
  if (error) throw new Error(`Failed to create construction company: ${error.message}`);

  return company;
}

export async function updateConstructionCompany(slug: string, changes: Partial<Omit<ConstructionCompany, "slug">>): Promise<ConstructionCompany | undefined> {
  const current = await getConstructionCompanyBySlug(slug);
  if (!current) return undefined;

  const updated: ConstructionCompany = { ...current, ...changes, slug };
  const { error } = await supabaseAdmin.from("construction_companies").update(companyToRow(updated)).eq("slug", slug);
  if (error) throw new Error(`Failed to update construction company ${slug}: ${error.message}`);

  return updated;
}
