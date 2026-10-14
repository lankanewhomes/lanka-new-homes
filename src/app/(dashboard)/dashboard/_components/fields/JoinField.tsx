"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDash } from "../DashProvider";
import type { CollectionSchema } from "../../_mock/types";
import { FieldShell, type FieldProps } from "./shared";

/** Payload join: the records of another collection that point back at this one (read-only). */
export function JoinField({ field, path, ctx }: FieldProps<null>) {
  const d = useDash();
  const [, setN] = useState(0);
  const target = field.collection ?? "";
  useEffect(() => {
    let alive = true;
    d.ensure(target).then(() => alive && setN((n) => n + 1));
    return () => { alive = false; };
  }, [d, target]);
  const schema = d.schemaOf(target) as CollectionSchema | undefined;
  const title = schema?.useAsTitle;
  const rows = (d.rowsOf(target) ?? []).filter((r) => {
    const v = r[field.on ?? ""];
    const id = typeof v === "object" && v && "value" in v ? (v as { value: unknown }).value : v;
    return id === ctx.root.id;
  });
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="rounded-md border border-line bg-subtle px-3 py-2 text-sm">
        {rows.length === 0 ? <span className="text-muted">None linked yet.</span> : (
          <ul className="flex flex-wrap gap-1.5">
            {rows.slice(0, 12).map((r) => <li key={String(r.id)}><Link href={`/dashboard/${target}/${r.id}`} className="rounded bg-panel px-2 py-0.5 text-xs hover:text-accent">{String((title ? r[title] : undefined) || `#${r.id}`)}</Link></li>)}
            {rows.length > 12 ? <li className="text-xs text-muted">+{rows.length - 12} more</li> : null}
          </ul>
        )}
      </div>
    </FieldShell>
  );
}
