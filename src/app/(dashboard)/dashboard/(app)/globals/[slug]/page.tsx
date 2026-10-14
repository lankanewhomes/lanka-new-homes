import { notFound } from "next/navigation";
import { GlobalEdit } from "../../../_components/CollectionEdit";
import { schemaIndex } from "../../../_mock/schema-index";

export default async function GlobalPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!schemaIndex.globals.some((g) => g.slug === slug)) notFound();
  return <GlobalEdit slug={slug} />;
}
