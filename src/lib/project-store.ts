import { supabaseAdmin } from "@/lib/supabase";
import type { Project } from "@/types";

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

type ProjectRow = {
  slug: string;
  data: Project;
};

function rowToProject(row: ProjectRow): Project {
  return { ...row.data, slug: row.slug };
}

function projectToRow(project: Project) {
  return {
    slug: project.slug,
    name: project.name,
    developer_slug: project.developerSlug,
    developer_name: project.developerName,
    status: project.status,
    type: project.type,
    starting_price_lkr: project.startingPriceLkr,
    location: project.location,
    city: project.city,
    district: project.district,
    province: project.province,
    neighborhood: project.neighborhood,
    is_featured: Boolean(project.isFeatured),
    is_move_in_now: Boolean(project.isMoveInNow),
    data: project,
  };
}

export async function getAllProjects(): Promise<Project[]> {
  const { data, error } = await supabaseAdmin.from("projects").select("slug, data");
  if (error) throw new Error(`Failed to load projects: ${error.message}`);
  return (data ?? []).map((row) => rowToProject(row as ProjectRow));
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const { data, error } = await supabaseAdmin.from("projects").select("slug, data").eq("slug", slug).maybeSingle();
  if (error) throw new Error(`Failed to load project ${slug}: ${error.message}`);
  return data ? rowToProject(data as ProjectRow) : undefined;
}

export async function updateProject(slug: string, changes: Partial<Project>) {
  const existing = await getProjectBySlug(slug);
  if (!existing) return undefined;

  const merged: Project = { ...existing, ...changes, slug };
  const { error } = await supabaseAdmin.from("projects").update(projectToRow(merged)).eq("slug", slug);
  if (error) throw new Error(`Failed to update project ${slug}: ${error.message}`);

  return merged;
}

function defaultProjectFields(input: Partial<Project>): Partial<Project> {
  // Every required (non-optional) field on Project needs a safe fallback here so a
  // minimally-filled create request never crashes a page that assumes it's present
  // (e.g. project.gallery.map(...)).
  return {
    location: input.location || "Location coming soon",
    district: input.district || "",
    city: input.city || "",
    province: input.province || "",
    neighborhood: input.neighborhood || "",
    type: input.type || "Private Residence",
    status: input.status || "Coming Soon",
    launchDate: input.launchDate || new Date().toISOString().slice(0, 10),
    completionYear: input.completionYear || new Date().getFullYear() + 1,
    constructionStatus: input.constructionStatus || "Planning",
    startingPriceLkr: input.startingPriceLkr ?? 0,
    priceRange: input.priceRange || "Contact for pricing",
    bedrooms: input.bedrooms || "-",
    bathrooms: input.bathrooms || "-",
    floorAreaRange: input.floorAreaRange || "-",
    units: input.units ?? 0,
    floors: input.floors ?? 0,
    parking: input.parking || "-",
    security: input.security || "-",
    ownership: input.ownership || "-",
    paymentPlan: input.paymentPlan || "",
    summary: input.summary || input.description || "",
    description: input.description || "",
    heroImage: input.heroImage || "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=85&w=2600&auto=format&fit=crop",
    gallery: input.gallery ?? [],
    amenities: input.amenities ?? [],
    floorPlans: input.floorPlans ?? [],
    nearby: input.nearby ?? [],
    coordinates: input.coordinates ?? { lat: 6.9271, lng: 79.8612 },
    contact: input.contact ?? { name: input.developerName ?? "", email: "", phone: "" },
    coDevelopers: input.coDevelopers ?? [],
  };
}

export async function createProject(input: Partial<Project> & { name: string; developerSlug: string; developerName: string }) {
  const { data: existingSlugs, error: slugError } = await supabaseAdmin.from("projects").select("slug");
  if (slugError) throw new Error(`Failed to check existing slugs: ${slugError.message}`);
  const taken = new Set((existingSlugs ?? []).map((row) => row.slug as string));

  const baseSlug = toSlug(input.name) || "new-project";
  let slug = baseSlug;
  let suffix = 2;
  while (taken.has(slug)) {
    slug = `${baseSlug}-${suffix}`;
    suffix += 1;
  }

  const definedInput = Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<Project>;
  const project = { ...defaultProjectFields(input), ...definedInput, slug } as Project;

  const { error } = await supabaseAdmin.from("projects").insert(projectToRow(project));
  if (error) throw new Error(`Failed to create project: ${error.message}`);

  return getProjectBySlug(slug);
}
