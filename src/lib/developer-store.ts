import { promises as fs } from "node:fs";
import path from "node:path";
import { developers as staticDevelopers } from "@/data/developers";
import type { Developer } from "@/types";

const customDevelopersPath = path.join(process.cwd(), "data", "custom-developers.json");

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
};

function toSlug(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

async function readCustomDevelopers(): Promise<Developer[]> {
  try {
    const raw = await fs.readFile(customDevelopersPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Developer[]) : [];
  } catch {
    return [];
  }
}

async function writeCustomDevelopers(items: Developer[]) {
  await fs.mkdir(path.dirname(customDevelopersPath), { recursive: true });
  await fs.writeFile(customDevelopersPath, JSON.stringify(items, null, 2), "utf8");
}

function mergeDevelopers(customDevelopers: Developer[]) {
  const bySlug = new Map<string, Developer>();

  for (const developer of staticDevelopers) {
    bySlug.set(developer.slug, developer);
  }

  for (const developer of customDevelopers) {
    bySlug.set(developer.slug, developer);
  }

  return Array.from(bySlug.values());
}

export async function getAllDevelopers(): Promise<Developer[]> {
  const customDevelopers = await readCustomDevelopers();
  return mergeDevelopers(customDevelopers);
}

export async function getDeveloperBySlug(slug: string): Promise<Developer | undefined> {
  const allDevelopers = await getAllDevelopers();
  return allDevelopers.find((developer) => developer.slug === slug);
}

export async function createDeveloper(input: CreateDeveloperInput): Promise<Developer> {
  const customDevelopers = await readCustomDevelopers();
  const allDevelopers = mergeDevelopers(customDevelopers);

  const baseSlug = toSlug(input.name) || "new-developer";
  let slug = baseSlug;
  let suffix = 2;

  while (allDevelopers.some((developer) => developer.slug === slug)) {
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
  };

  customDevelopers.push(developer);
  await writeCustomDevelopers(customDevelopers);

  return developer;
}
