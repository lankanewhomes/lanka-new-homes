"use client";

import type { ReactNode } from "react";
import type { Row, SchemaField } from "../_mock/types";
import { ArrayField } from "./fields/ArrayField";
import { BlocksField } from "./fields/BlocksField";
import { CheckboxField } from "./fields/CheckboxField";
import { DateField } from "./fields/DateField";
import { GroupField } from "./fields/GroupField";
import { JoinField } from "./fields/JoinField";
import { JsonField } from "./fields/JsonField";
import { NumberField } from "./fields/NumberField";
import { RadioField } from "./fields/RadioField";
import { RelationshipField } from "./fields/RelationshipField";
import { RichTextField } from "./fields/RichTextField";
import { SelectField } from "./fields/SelectField";
import { TabsField } from "./fields/TabsField";
import { TextField } from "./fields/TextField";
import { UiField } from "./fields/UiField";
import { UploadField } from "./fields/UploadField";
import { PointField } from "./fields/PointField";
import { conditionPasses, isMediaField, type FieldCtx } from "./fields/shared";

// Walks a list of schema fields and renders the right component for each Payload type. Layout nodes (tabs, row, collapsible)
// are handled here; admin conditions are evaluated per field against the whole record and the field's siblings.

type Obj = Record<string, unknown>;

const span = (f: SchemaField) => (f.width === "50%" ? "md:col-span-6" : f.width === "33%" ? "md:col-span-4" : f.width === "25%" ? "md:col-span-3" : "md:col-span-12");

export function FieldsRenderer({ fields, data, onChange, path, ctx, readOnly }: {
  fields: SchemaField[];
  data: Obj;
  onChange: (next: Obj) => void;
  path: (string | number)[];
  ctx: FieldCtx;
  readOnly?: boolean;
}) {
  const here: FieldCtx = { ...ctx, sibling: data };
  const set = (name: string, value: unknown) => onChange({ ...data, [name]: value });
  const out: ReactNode[] = [];
  fields.forEach((f, idx) => {
    const key = `${f.name ?? f.type}-${idx}`;
    if (f.hidden) return;
    if (f.type === "tabs") {
      out.push(<div key={key} className="md:col-span-12"><TabsField field={f} data={data} onChange={onChange} path={path} ctx={here} readOnly={readOnly} /></div>);
      return;
    }
    if (f.type === "row") {
      out.push(<div key={key} className="md:col-span-12"><FieldsRenderer fields={f.fields ?? []} data={data} onChange={onChange} path={path} ctx={ctx} readOnly={readOnly} /></div>);
      return;
    }
    if (f.type === "collapsible") {
      out.push(
        <details key={key} open={!f.collapsed} className="rounded-lg border border-line bg-panel md:col-span-12">
          <summary className="cursor-pointer select-none px-4 py-2.5 text-sm font-medium">{f.label ?? "More"}</summary>
          <div className="border-t border-line p-4"><FieldsRenderer fields={f.fields ?? []} data={data} onChange={onChange} path={path} ctx={ctx} readOnly={readOnly} /></div>
        </details>,
      );
      return;
    }
    if (!f.name) return;
    if (f.type === "ui" && /_header$/.test(f.name)) return; // the page hero replaces the /cms header panel
    if (!conditionPasses(f.condition, here)) return;
    const p = [...path, f.name];
    const value = data[f.name];
    const props = { field: f, path: p, ctx: here, readOnly };
    let node: ReactNode;
    switch (f.type) {
      case "text":
        node = isMediaField(f) ? <UploadField {...props} value={value as string | null} onChange={(v) => set(f.name!, v)} /> : <TextField {...props} value={value as string | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "textarea":
      case "email":
        node = <TextField {...props} value={value as string | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "number":
        node = <NumberField {...props} value={value as number | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "checkbox":
        node = <CheckboxField {...props} value={value as boolean | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "date":
        node = <DateField {...props} value={value as string | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "select":
        node = <SelectField {...props} value={value as never} onChange={(v) => set(f.name!, v)} />;
        break;
      case "radio":
        node = <RadioField {...props} value={value as never} onChange={(v) => set(f.name!, v)} />;
        break;
      case "relationship":
        node = <RelationshipField {...props} value={value as never} onChange={(v) => set(f.name!, v)} />;
        break;
      case "upload":
        node = <UploadField {...props} value={value as never} onChange={(v) => set(f.name!, v)} />;
        break;
      case "array":
        node = <ArrayField {...props} value={(value as Row[]) ?? []} onChange={(v) => set(f.name!, v)} />;
        break;
      case "group":
        node = <GroupField {...props} value={(value as Obj) ?? {}} onChange={(v) => set(f.name!, v)} />;
        break;
      case "blocks":
        node = <BlocksField {...props} value={(value as Row[]) ?? []} onChange={(v) => set(f.name!, v)} />;
        break;
      case "richText":
        node = <RichTextField {...props} value={value as string | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "point":
        node = <PointField {...props} value={value as [number, number] | null} onChange={(v) => set(f.name!, v)} />;
        break;
      case "join":
        node = <JoinField {...props} value={null} onChange={() => undefined} />;
        break;
      case "ui":
        node = <UiField {...props} value={null} onChange={() => undefined} />;
        break;
      default:
        node = <JsonField {...props} value={value} onChange={(v) => set(f.name!, v)} />;
    }
    out.push(<div key={key} className={`${span(f)} min-w-0`}>{node}</div>);
  });
  return <div className="grid grid-cols-1 gap-x-4 gap-y-4 md:grid-cols-12">{out}</div>;
}
