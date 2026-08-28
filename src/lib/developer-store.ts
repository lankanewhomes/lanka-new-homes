import { supabaseAdmin } from "@/lib/supabase";
import type { CoDeveloperEntry, Developer, OfficeHoursEntry } from "@/types";

type CreateDeveloperInput = {
  name: string;
  logo: string;
  description: string;
  location: string;
  establishedYear: number;
  yearsInBusiness: number;
  activeProjects: number;
  completedProjects: number;
  website: string;
  email: string;
  phone: string;
  coDevelopers?: CoDeveloperEntry[];
  officeHours?: OfficeHoursEntry[];
  socialLinks?: Developer["socialLinks"];
};

type DeveloperRow = {
  slug: string;
  data: Developer;
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function rowToDeveloper(row: DeveloperRow): Developer {
  return { ...row.data, slug: row.slug };
}

function developerToRow(developer: Developer) {
  return {
    slug: developer.slug,
    name: developer.name,
    location: developer.location,
    data: developer,
  };
}

export async function getAllDevelopers(): Promise<Developer[]> {
  const { data, error } = await supabaseAdmin.from("developers").select("slug, data");
  if (error) throw new Error(`Failed to load developers: ${error.message}`);
  return (data ?? []).map((row) => rowToDeveloper(row as DeveloperRow));
}

export async function getDeveloperBySlug(slug: string): Promise<Developer | undefined> {
  const { data, error } = await supabaseAdmin.from("developers").select("slug, data").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load developer ${slug}: ${error.message}`);
  return data ? rowToDeveloper(data as DeveloperRow) : undefined;
}

export async function createDeveloper(input: CreateDeveloperInput): Promise<Developer> {
  const { data: existingSlugs, error: slugError } = await supabaseAdmin.from("developers").select("slug");
  if (slugError) throw new Error(`Failed to check existing slugs: ${slugError.message}`);
  const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

  const baseSlug = toSlug(input.name) || "new-developer";
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const developer: Developer = {
    slug,
    name: input.name,
    logo: input.logo,
    description: input.description,
    location: input.location,
    establishedYear: input.establishedYear,
    yearsInBusiness: input.yearsInBusiness,
    activeProjects: input.activeProjects,
    completedProjects: input.completedProjects,
    website: input.website,
    email: input.email,
    phone: input.phone,
    coDevelopers: input.coDevelopers ?? [],
    officeHours: input.officeHours ?? [],
    socialLinks: input.socialLinks ?? {},
  };

  const { error } = await supabaseAdmin.from("developers").insert(developerToRow(developer));
  if (error) throw new Error(`Failed to create developer: ${error.message}`);

  return developer;
}

export async function updateDeveloper(slug: string, changes: Partial<Omit<Developer, "slug">>): Promise<Developer | undefined> {
  const current = await getDeveloperBySlug(slug);
  if (!current) return undefined;

  const updated: Developer = { ...current, ...changes, slug };
  const { error } = await supabaseAdmin.from("developers").update(developerToRow(updated)).eq("slug", slug);
  if (error) throw new Error(`Failed to update developer ${slug}: ${error.message}`);

  return updated;
}
