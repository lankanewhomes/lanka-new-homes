import type { Config } from "@/payload-types";

// Types for the mock dashboard. The record types come straight from the generated payload-types.ts, so a mock record for a
// known collection is checked against the real Payload document shape. The schema types describe the JSON exported by
// scripts/export-dashboard-schema.ts (one file per collection in ./schema).

export type CollectionSlug = keyof Config["collections"];
export type GlobalSlug = keyof Config["globals"];
export type DocOf<S extends CollectionSlug> = Config["collections"][S];

/** A mock record. `id` is always present; everything else follows the collection's fields. */
export type Row = { id: number | string; [key: string]: unknown };

export type Role = "admin" | "developer";

export type SelectOption = { label: string; value: string | number };

export type SchemaField = {
  name?: string;
  label?: string;
  type: string;
  required?: boolean;
  hasMany?: boolean;
  options?: SelectOption[];
  relationTo?: string[];
  collection?: string;
  on?: string;
  defaultValue?: unknown;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  unique?: boolean;
  description?: string;
  readOnly?: boolean;
  hidden?: boolean;
  position?: string;
  width?: string;
  condition?: string | null;
  custom?: string;
  updateAccess?: string;
  adminOnlyEdit?: boolean;
  dateOnly?: boolean;
  rowLabel?: string;
  collapsed?: boolean;
  fields?: SchemaField[];
  tabs?: { label: string; name: string | null; condition?: string | null; fields: SchemaField[] }[];
  blocks?: { slug: string; label: string; fields: SchemaField[] }[];
};

export type CollectionSchema = {
  kind: "collection";
  slug: string;
  label: string;
  singular: string;
  group: string | null;
  useAsTitle: string | null;
  defaultColumns: string[];
  searchable: string[];
  description: string | null;
  auth: boolean;
  upload: boolean;
  drafts: boolean;
  scopedForDeveloper: boolean;
  visible: { admin: boolean; developer: boolean };
  access: { read: string; create: string; update: string; delete: string };
  fields: SchemaField[];
};

export type GlobalSchema = {
  kind: "global";
  slug: string;
  label: string;
  access: { read: string; update: string };
  fields: SchemaField[];
};

export type AnySchema = CollectionSchema | GlobalSchema;

export type NavItem = { slug: string; kind: "collection" | "global" | "view"; roles: string[] | null; label: string; filter: string | null };
export type NavSection = { label: string; items: NavItem[] };
export type SchemaIndex = {
  generatedAt: string;
  sections: NavSection[];
  collections: Pick<CollectionSchema, "slug" | "label" | "singular" | "group" | "visible" | "scopedForDeveloper" | "access" | "useAsTitle" | "defaultColumns">[];
  globals: { slug: string; label: string }[];
};

/** The developer the "Developer" role pretends to be. */
export const MOCK_DEVELOPER = { id: 1, name: "Prime Lands", email: "info@primelands.lk" } as const;
