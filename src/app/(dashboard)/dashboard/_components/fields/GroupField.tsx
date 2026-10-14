"use client";

import { FieldsRenderer } from "../FieldsRenderer";
import { PointField } from "./PointField";
import type { FieldProps } from "./shared";

type Obj = Record<string, unknown>;
const isCoordinates = (names: (string | undefined)[]) => names.includes("lat") && names.includes("lng");

/** Payload group: a bordered card with the group's fields. A group holding lat + lng gets a map picker. */
export function GroupField({ field, value, onChange, path, ctx, readOnly }: FieldProps<Obj>) {
  const kids = field.fields ?? [];
  const coords = isCoordinates(kids.map((k) => k.name));
  return (
    <section className="rounded-lg border border-line bg-panel">
      <header className="border-b border-line px-4 py-2.5">
        <h3 className="text-sm font-semibold">{field.label ?? field.name}</h3>
        {field.description ? <p className="mt-0.5 text-xs text-muted">{field.description}</p> : null}
      </header>
      <div className="space-y-4 p-4">
        {coords ? (
          <PointField
            field={{ ...field, type: "point", label: "Pin on the map" }}
            value={typeof value.lng === "number" && typeof value.lat === "number" ? [value.lng, value.lat] : null}
            onChange={(p) => onChange({ ...value, lng: p?.[0] ?? null, lat: p?.[1] ?? null })}
            path={path}
            ctx={ctx}
            readOnly={readOnly}
          />
        ) : null}
        <FieldsRenderer fields={coords ? kids.filter((k) => k.name !== "lat" && k.name !== "lng") : kids} data={value ?? {}} onChange={onChange} path={path} ctx={ctx} readOnly={readOnly} />
      </div>
    </section>
  );
}
