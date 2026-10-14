import { notFound } from "next/navigation";
import { CollectionEdit } from "../../../_components/CollectionEdit";
import { schemaIndex } from "../../../_mock/schema-index";

// /dashboard/<collection>/<id> (or /new): the edit page, built from the collection's schema.
export default async function EditPage({ params }: { params: Promise<{ collection: string; id: string }> }) {
  const { collection, id } = await params;
  if (!schemaIndex.collections.some((c) => c.slug === collection)) notFound();
  return <CollectionEdit slug={collection} id={id} />;
}
