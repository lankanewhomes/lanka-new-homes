import { supabaseAdmin } from "@/lib/supabase";
import type { Unit } from "@/types";

type UnitRow = {
  id: string;
  project_slug: string;
  unit_number: string;
  floor: number;
  apartment_type: string;
  bedrooms: number;
  area_sq_ft: number;
  price_lkr: number;
  price_usd: number | null;
  status: Unit["status"];
  source_url: string | null;
};

function rowToUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    projectSlug: row.project_slug,
    unitNumber: row.unit_number,
    floor: row.floor,
    apartmentType: row.apartment_type,
    bedrooms: row.bedrooms,
    areaSqFt: row.area_sq_ft,
    priceLkr: row.price_lkr,
    priceUsd: row.price_usd ?? undefined,
    status: row.status,
    sourceUrl: row.source_url ?? undefined,
  };
}

function unitToRow(unit: Unit) {
  return {
    id: unit.id,
    project_slug: unit.projectSlug,
    unit_number: unit.unitNumber,
    floor: unit.floor,
    apartment_type: unit.apartmentType,
    bedrooms: unit.bedrooms,
    area_sq_ft: unit.areaSqFt,
    price_lkr: unit.priceLkr,
    price_usd: unit.priceUsd ?? null,
    status: unit.status,
    source_url: unit.sourceUrl ?? null,
  };
}

export async function getUnitById(projectSlug: string, unitId: string): Promise<Unit | undefined> {
  const { data, error } = await supabaseAdmin
    .from("units")
    .select("*")
    .eq("project_slug", projectSlug)
    .eq("id", unitId)
    .maybeSingle();
  if (error) throw new Error(`Failed to load unit ${unitId}: ${error.message}`);
  return data ? rowToUnit(data as UnitRow) : undefined;
}

export async function getUnitsByProjectSlug(projectSlug: string): Promise<Unit[]> {
  const { data, error } = await supabaseAdmin
    .from("units")
    .select("*")
    .eq("project_slug", projectSlug)
    .order("floor", { ascending: false });
  if (error) throw new Error(`Failed to load units for ${projectSlug}: ${error.message}`);
  return (data ?? []).map((row) => rowToUnit(row as UnitRow));
}

/** Replaces every unit row for a project with the given set — matches how
 * floorPlans/amenities/nearby arrays are edited (whole-array replace on
 * save), since the admin UI has no per-row persistence of its own. */
export async function replaceUnitsForProject(projectSlug: string, units: Unit[]): Promise<Unit[]> {
  const { error: deleteError } = await supabaseAdmin.from("units").delete().eq("project_slug", projectSlug);
  if (deleteError) throw new Error(`Failed to clear units for ${projectSlug}: ${deleteError.message}`);

  if (units.length === 0) return [];

  const rows = units.map((unit) => unitToRow({ ...unit, projectSlug }));
  const { error: insertError } = await supabaseAdmin.from("units").insert(rows);
  if (insertError) throw new Error(`Failed to insert units for ${projectSlug}: ${insertError.message}`);

  return getUnitsByProjectSlug(projectSlug);
}
