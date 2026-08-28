import { supabaseAdmin } from "@/lib/supabase";
import type { ConstructionCompany, ConstructionCompanyCategory } from "@/types";

type ConstructionCompanyRow = {
  slug: string;
  data: ConstructionCompany;
};

function rowToCompany(row: ConstructionCompanyRow): ConstructionCompany {
  return { ...row.data, slug: row.slug };
}

export async function getAllConstructionCompanies(): Promise<ConstructionCompany[]> {
  const { data, error } = await supabaseAdmin.from("construction_companies").select("slug, data");
  if (error) throw new Error(`Failed to load construction companies: ${error.message}`);
  return (data ?? []).map((row) => rowToCompany(row as ConstructionCompanyRow));
}

export async function getConstructionCompaniesByCategory(category: ConstructionCompanyCategory): Promise<ConstructionCompany[]> {
  const companies = await getAllConstructionCompanies();
  return companies.filter((company) => company.categories.includes(category));
}
