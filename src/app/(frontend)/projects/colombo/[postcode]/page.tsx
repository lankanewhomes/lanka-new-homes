import { notFound } from "next/navigation";
import { getAllProjects } from "@/lib/project-store";
import { ProjectListingShell } from "@/components/marketplace/listing-shell";
import { colomboPostcodes, parsePostcode, postcodeContent, postcodeMetadata, postcodePath, postcodeProjects } from "@/lib/colombo-postcode-pages";

// "Apartments for sale in Colombo 7" etc. (owner, 2026-11-09) — see src/lib/colombo-postcode-pages.ts.
export const revalidate = 60;

type Props = { params: Promise<{ postcode: string }> };

export async function generateStaticParams() {
  return colomboPostcodes(await getAllProjects()).map((n) => ({ postcode: `colombo-${n}` }));
}

export async function generateMetadata({ params }: Props) {
  const n = parsePostcode((await params).postcode);
  if (!n) return {};
  return postcodeMetadata(n, postcodeProjects(await getAllProjects(), n));
}

export default async function Page({ params }: Props) {
  const n = parsePostcode((await params).postcode);
  if (!n) return notFound();
  const all = await getAllProjects();
  const projects = postcodeProjects(all, n);
  if (!projects.length) return notFound();
  const { paragraphs } = postcodeContent(n, projects);
  const others = colomboPostcodes(all).filter((x) => x !== n).slice(0, 3).map(postcodePath);

  return (
    <ProjectListingShell
      breadcrumbs={[{ label: "Home", href: "/" }, { label: "New Projects", href: "/projects" }, { label: "Colombo", href: "/projects/colombo" }, { label: `Colombo ${n}` }]}
      h1={`Apartments for Sale in Colombo ${n}`}
      intro={`New apartment projects in Colombo ${n}: ${projects.length} ${projects.length === 1 ? "project" : "projects"} with current prices, floor plans and photos.`}
      projects={projects}
      relatedPaths={["/projects/colombo", ...others]}
      about={{ title: `About apartments in Colombo ${n}`, paragraphs }}
    />
  );
}
