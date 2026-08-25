import { promises as fs } from "node:fs";
import path from "node:path";
import { projects as staticProjects } from "@/data/projects";
import type { Project } from "@/types";

const customProjectsPath = path.join(process.cwd(), "data", "custom-projects.json");

async function readCustomProjects(): Promise<Partial<Project>[]> {
  try {
    const raw = await fs.readFile(customProjectsPath, "utf8");
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function getProjectBySlug(slug: string): Promise<Project | undefined> {
  const project = staticProjects.find((item) => item.slug === slug);
  const override = (await readCustomProjects()).find((item) => item.slug === slug);
  return project && override ? { ...project, ...override } : project;
}

export async function updateProject(slug: string, changes: Partial<Project>) {
  const customProjects = await readCustomProjects();
  const next = customProjects.filter((item) => item.slug !== slug);
  next.push({ slug, ...changes });
  await fs.mkdir(path.dirname(customProjectsPath), { recursive: true });
  await fs.writeFile(customProjectsPath, JSON.stringify(next, null, 2), "utf8");
  return getProjectBySlug(slug);
}
