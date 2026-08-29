import { supabaseAdmin } from "@/lib/supabase";
import type { CompanyProfile } from "@/types";

type CompanyProfileRow = {
  slug: string;
  data: CompanyProfile;
};

type CreateCompanyProfileInput = {
  name: string;
  logo: string;
  description: string;
  location: string;
  yearsInBusiness?: number;
  website?: string;
  email?: string;
  phone?: string;
  officeHours?: CompanyProfile["officeHours"];
  socialLinks?: CompanyProfile["socialLinks"];
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function rowToCompany(row: CompanyProfileRow): CompanyProfile {
  return { ...row.data, slug: row.slug };
}

function companyToRow(company: CompanyProfile) {
  return {
    slug: company.slug,
    name: company.name,
    location: company.location,
    data: company,
  };
}

// Every partner directory (marketing companies, sales companies, architects,
// interior designers) shares the exact CompanyProfile shape and CRUD
// behavior — this factory backs each with its own Supabase table instead of
// four near-identical copies of construction-company-store.ts.
export function createCompanyProfileStore(table: string) {
  async function getAll(): Promise<CompanyProfile[]> {
    const { data, error } = await supabaseAdmin.from(table).select("slug, data");
    if (error) throw new Error(`Failed to load ${table}: ${error.message}`);
    return (data ?? []).map((row) => rowToCompany(row as CompanyProfileRow));
  }

  async function getBySlug(slug: string): Promise<CompanyProfile | undefined> {
    const { data, error } = await supabaseAdmin.from(table).select("slug, data").eq("slug", slug).maybeSingle();
    if (error) throw new Error(`Failed to load ${table} ${slug}: ${error.message}`);
    return data ? rowToCompany(data as CompanyProfileRow) : undefined;
  }

  async function create(input: CreateCompanyProfileInput): Promise<CompanyProfile> {
    const { data: existingSlugs, error: slugError } = await supabaseAdmin.from(table).select("slug");
    if (slugError) throw new Error(`Failed to check existing slugs in ${table}: ${slugError.message}`);
    const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

    const baseSlug = toSlug(input.name) || "new-entry";
    let slug = baseSlug;
    let suffix = 2;
    while (taken.has(slug)) {
      slug = `${baseSlug}-${suffix}`;
      suffix += 1;
    }

    const company: CompanyProfile = {
      slug,
      name: input.name,
      logo: input.logo,
      description: input.description,
      location: input.location,
      yearsInBusiness: input.yearsInBusiness,
      website: input.website,
      email: input.email,
      phone: input.phone,
      officeHours: input.officeHours ?? [],
      socialLinks: input.socialLinks ?? {},
    };

    const { error } = await supabaseAdmin.from(table).insert(companyToRow(company));
    if (error) throw new Error(`Failed to create ${table} entry: ${error.message}`);

    return company;
  }

  async function update(slug: string, changes: Partial<Omit<CompanyProfile, "slug">>): Promise<CompanyProfile | undefined> {
    const current = await getBySlug(slug);
    if (!current) return undefined;

    const updated: CompanyProfile = { ...current, ...changes, slug };
    const { error } = await supabaseAdmin.from(table).update(companyToRow(updated)).eq("slug", slug);
    if (error) throw new Error(`Failed to update ${table} entry ${slug}: ${error.message}`);

    return updated;
  }

  return { getAll, getBySlug, create, update };
}
