"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDash } from "../DashProvider";
import { apiFind, type Doc } from "../../_data/api";
import type { CollectionSchema } from "../../_mock/types";
import { FieldShell, type FieldProps } from "./shared";

/** Payload join: the records of another collection that point back at this one (read-only). */
export function JoinField({ field, path, ctx }: FieldProps<null>) {
  const d = useDash();
  const target = field.collection ?? "";
  const [rows, setRows] = useState<Doc[] | null>(null);
  const [title, setTitle] = useState<string | null>(null);
  const id = ctx.root.id;
  useEffect(() => {
    if (id === "new" || id === undefined) return;
    let alive = true;
    (async () => {
      const schema = (await d.ensureSchema(target)) as CollectionSchema | undefined;
      const t = schema?.useAsTitle && schema.useAsTitle !== "id" ? schema.useAsTitle : null;
      try {
        const page = await apiFind(target, { limit: 12, where: { [field.on ?? ""]: { equals: id } }, ...(t ? { select: { [t]: true } } : {}) });
        if (alive) { setTitle(t); setRows(page.docs); }
      } catch {
        if (alive) setRows([]);
      }
    })();
    return () => { alive = false; };
  }, [d, target, field.on, id]);
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="border border-line bg-subtle px-3 py-2 text-sm">
        {rows === null ? <span className="text-muted">{id === "new" ? "Available once saved." : "Loading…"}</span> : rows.length === 0 ? <span className="text-muted">None linked yet.</span> : (
          <ul className="flex flex-wrap gap-1.5">
            {rows.map((r) => <li key={String(r.id)}><Link href={`/dashboard/${target}/${r.id}`} className="bg-panel px-2 py-0.5 text-xs hover:underline">{String((title ? r[title] : undefined) || `#${r.id}`)}</Link></li>)}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
