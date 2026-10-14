import { notFound } from "next/navigation";
import { CollectionList } from "../../_components/CollectionList";
import { schemaIndex } from "../../_mock/schema-index";

type Props = { params: Promise<{ collection: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

// /dashboard/<collection>: the list page. Filters from the /cms sidebar links (?where[status][equals]=new) are honoured.
export default async function ListPage({ params, searchParams }: Props) {
  const { collection } = await params;
  if (!schemaIndex.collections.some((c) => c.slug === collection)) notFound();
  const sp = await searchParams;
  const hit = Object.entries(sp).find(([k]) => /^where\[[^\]]+\]\[equals\]$/.test(k));
  const initial = hit ? { field: hit[0].match(/^where\[([^\]]+)\]/)![1], value: String(hit[1]) } : null;
  return <CollectionList slug={collection} initialFilter={initial} />;
}
