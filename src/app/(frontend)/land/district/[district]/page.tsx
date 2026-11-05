import { notFound, permanentRedirect } from "next/navigation";
import { LandDistrictPage, landDistrictMetadata, landDistricts } from "@/lib/land-seo-pages";
import { getAllLands } from "@/lib/land-store";

// "Land for sale in <district> district" (owner, 2026-11-02). One page per district that has land, built from the live plots.
// The Colombo district's page is /land/best-land-for-sale-in-colombo, so that one is sent there.
export const revalidate = 60;

type Props = { params: Promise<{ district: string }> };

export async function generateStaticParams() {
  return landDistricts(await getAllLands()).map((entry) => ({ district: entry.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { district } = await params;
  return landDistrictMetadata(district);
}

export default async function Page({ params }: Props) {
  const { district } = await params;
  if (district === "colombo") permanentRedirect("/land/best-land-for-sale-in-colombo");
  const body = await LandDistrictPage({ slug: district });
  if (!body) return notFound();
  return body;
}
