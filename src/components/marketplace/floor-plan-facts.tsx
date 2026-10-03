"use client";

import type { ComponentType } from "react";
import { Bath, BedDouble, Building2, Car, Clock3, Compass, DoorOpen, Eye, HousePlus, KeyRound, LayoutGrid, Ruler, Sofa, Square } from "lucide-react";
import type { FloorPlan, Project } from "@/types";
import { formatLkr } from "@/lib/format";
import { floorRangeLabel } from "@/lib/floor-plan-title";
import { FactSheetTable } from "@/components/marketplace/components";
import { useListingT } from "@/lib/i18n/use-listing-t";

// Floor-plan page facts and chips, per the owner's spec of 2026-09-08
// (docs/design.md "Floor plan page facts & chips"). Everything shown is a
// field the developer filled in on that plan — rows/chips with no value
// simply drop out; nothing is derived.

const hasText = (value: unknown): value is string => typeof value === "string" && value.trim() !== "" && value.trim() !== "-";
const hasNumber = (value: unknown): value is number => typeof value === "number" && Number.isFinite(value) && value > 0;
const sqft = (value: number) => `${value.toLocaleString("en-US")} SqFt`;
// "Yes"/"No" selects: "No" is worth stating only in the fact sheet, never as
// a chip; custom text ("Wet & dry pantry") is shown as-is.
const yesNoValue = (value: unknown) => (hasText(value) ? value : undefined);

// ---------------------------------------------------------------- Fact sheet

type FactRow = { label: string; value: React.ReactNode };

// Owner, 2026-09-29: "downloads shouldnt be there., deposit, floor finish,
// pantry" — dropped from the fact sheet (both breakpoints). Pantry and
// Floor finish still show in the Key Features list further down the page
// (floorPlanFeatureGroup in components.tsx) — that's a separate section
// the owner wasn't referring to.
const FLOOR_PLAN_FACTS_DESKTOP = [
  "Plan type", "Beds", "Baths", "Units in plan", "Units available", "Availability", "Ensuite baths", "Powder room", "Total SqFt", "Interior SqFt", "Balcony", "Balcony SqFt", "Terraces", "Terrace SqFt", "Land extent",
  "Ceiling height", "Floor range", "Aspect", "View", "Price LKR", "Per SqFt", "Maintenance / mo", "Parking", "Parking type", "Visitor parking", "EV charging", "Carpark levels",
  "Storage", "Utility area", "Maid's room", "Handover condition", "Furnishing", "AC provision", "Hot water",
  "Available floors",
];

const FLOOR_PLAN_FACTS_MOBILE = [
  "Units in plan", "Units available", "Availability", "Total SqFt", "Interior SqFt", "Balcony", "Balcony SqFt", "Terraces", "Land extent", "Per SqFt", "Maintenance / mo", "Floor range", "View", "Ceiling height", "Parking", "Visitor parking", "EV charging", "Carpark levels",
  "Storage", "Utility area", "Maid's room", "Handover condition", "Furnishing", "Available floors",
];

// Developer's per-floor tracker (FloorPlan.floorAvailability) → "2, 28 of 28
// floors" or "None — all sold". Only rendered when the developer publishes it.
function availableFloorsValue(plan: FloorPlan): string | undefined {
  const floors = plan.floorAvailability ?? [];
  if (!floors.length) return undefined;
  const open = floors.filter((f) => f.available).map((f) => f.floor);
  return open.length ? `${open.join(", ")} (of ${floors.length} floors)` : `None — all ${floors.length} floors sold`;
}

export type ProjectBuildingFacts = { visitorParking?: string; evCharging?: boolean; carparkLevels?: number };

function floorPlanFactRows(plan: FloorPlan, balcony?: string, building?: ProjectBuildingFacts): Map<string, FactRow> {
  const rows = new Map<string, FactRow>();
  const add = (label: string, value: React.ReactNode | undefined) => {
    if (value === undefined || value === null || value === "") return;
    rows.set(label, { label, value });
  };

  add("Plan type", hasText(plan.planType) ? plan.planType : undefined);
  add("Beds", hasNumber(plan.bedrooms) ? plan.bedrooms : undefined);
  add("Baths", hasNumber(plan.bathrooms) ? plan.bathrooms : undefined);
  add("Ensuite baths", hasNumber(plan.ensuiteBaths) ? plan.ensuiteBaths : undefined);
  add("Powder room", hasNumber(plan.powderRooms) ? plan.powderRooms : undefined);
  add("Total SqFt", hasNumber(plan.floorAreaSqFt) ? sqft(plan.floorAreaSqFt) : undefined);
  add("Interior SqFt", hasNumber(plan.interiorSizeSqFt) ? sqft(plan.interiorSizeSqFt) : undefined);
  // Not a plan field: the project's "Balcony: Private balcony" Key Features item (src/lib/balcony-features.ts).
  add("Balcony", hasText(balcony) ? balcony : undefined);
  add("Balcony SqFt", hasNumber(plan.balconySizeSqFt) ? sqft(plan.balconySizeSqFt) : undefined);
  // Counted outdoor spaces, labelled with the developer's own word (Terraces / Balconies / Decks / Verandahs).
  add("Terraces", hasNumber(plan.terraces) ? (hasText(plan.terraceType) ? `${plan.terraces} (${plan.terraceType.toLowerCase()})` : plan.terraces) : undefined);
  if (hasText(plan.outdoorSpace) && rows.has("Terraces")) rows.set("Terraces", { ...rows.get("Terraces")!, label: plan.outdoorSpace });
  add("Terrace SqFt", hasNumber(plan.terraceSqFt) ? sqft(plan.terraceSqFt) : undefined);
  add("Land extent", hasNumber(plan.landPerches) ? `${plan.landPerches} perches` : undefined);
  add("Ceiling height", hasText(plan.ceilingHeight) ? plan.ceilingHeight : undefined);
  add("Floor range", hasText(plan.floorRange) ? plan.floorRange : undefined);
  add("Aspect", hasText(plan.aspect) ? plan.aspect : undefined);
  add("View", hasText(plan.view) ? plan.view : undefined);
  add("Price LKR", hasNumber(plan.startingPriceLkr) ? `From ${formatLkr(plan.startingPriceLkr)}` : undefined);
  add("Per SqFt", hasNumber(plan.pricePerSqFtLkr) ? `${formatLkr(plan.pricePerSqFtLkr)} / SqFt` : undefined);
  add("Maintenance / mo", hasNumber(plan.maintenancePerMonthLkr) ? `${formatLkr(plan.maintenancePerMonthLkr)} / month` : undefined);
  // No count but the listing has parking (type or note) -> "Available" (owner, 2026-10-01).
  add("Parking", hasNumber(plan.parkingSpaces) ? plan.parkingSpaces : hasText(plan.parkingType) ? "Available" : undefined);
  add("Parking type", hasText(plan.parkingType) ? plan.parkingType : undefined);
  // Building-wide facts (owner, 2026-10-03: show them on the plan page too; Architect stays listing-only).
  add("Visitor parking", hasText(building?.visitorParking) ? building?.visitorParking : undefined);
  add("EV charging", building?.evCharging ? "Yes" : undefined);
  add("Carpark levels", hasNumber(building?.carparkLevels) ? building?.carparkLevels : undefined);
  add("Storage", yesNoValue(plan.storage));
  add("Utility area", yesNoValue(plan.utilityArea));
  add("Maid's room", yesNoValue(plan.maidsRoom));
  add("Handover condition", hasText(plan.handoverCondition) ? plan.handoverCondition : undefined);
  add("Furnishing", hasText(plan.furnishing) ? plan.furnishing : undefined);
  add("AC provision", hasText(plan.acProvision) ? plan.acProvision : undefined);
  add("Hot water", hasText(plan.hotWater) ? plan.hotWater : undefined);
  add("Units in plan", hasNumber(plan.unitsInPlan) ? plan.unitsInPlan : undefined);
  add("Units available", hasNumber(plan.unitsAvailable) ? plan.unitsAvailable : undefined);
  add("Availability", hasText(plan.availability) ? plan.availability : undefined);
  add("Available floors", availableFloorsValue(plan));
  return rows;
}

export function FloorPlanFactSheet({ floorPlan, balcony, building }: { floorPlan: FloorPlan; balcony?: string; building?: ProjectBuildingFacts }) {
  const rows = floorPlanFactRows(floorPlan, balcony, building);
  const pick = (order: string[]) => order.map((label) => rows.get(label)).filter((row): row is FactRow => Boolean(row));
  const desktopRows = pick(FLOOR_PLAN_FACTS_DESKTOP);
  const mobileRows = pick(FLOOR_PLAN_FACTS_MOBILE);
  if (!desktopRows.length && !mobileRows.length) return null;

  return (
    <section className="project-narrative-shell" aria-label="Floor plan details">
      <FactSheetTable rows={desktopRows} className="project-fact-sheet project-fact-sheet-desktop" />
      <FactSheetTable rows={mobileRows} className="project-fact-sheet project-fact-sheet-mobile" />
    </section>
  );
}

// -------------------------------------------------------------------- Chips

type FloorPlanChipKey =
  | "planType" | "beds" | "baths" | "totalSqFt" | "view" | "aspect" | "furnishing" | "quickMoveIn" | "availability"
  | "handoverCondition" | "parking" | "maidsRoom" | "corner" | "floor";

// Desktop — max 9
const FLOOR_PLAN_CHIPS_DESKTOP: FloorPlanChipKey[] = ["planType", "beds", "baths", "totalSqFt", "view", "aspect", "furnishing", "quickMoveIn", "availability"];
// Mobile — max 7. Aspect drops off: "Sea" tells a buyer more than
// "North-West", and view already carries it where there's no room for both.
const FLOOR_PLAN_CHIPS_MOBILE: FloorPlanChipKey[] = ["planType", "beds", "baths", "totalSqFt", "view", "quickMoveIn", "availability"];
// Fill-ins, in order, when a primary chip has no data on this plan.
const FLOOR_PLAN_CHIPS_OVERFLOW: FloorPlanChipKey[] = ["floor", "handoverCondition", "parking", "maidsRoom", "corner"];

const CHIP_ICON: Record<FloorPlanChipKey, ComponentType<{ className?: string }>> = {
  planType: LayoutGrid,
  beds: BedDouble,
  baths: Bath,
  totalSqFt: Ruler,
  view: Eye,
  aspect: Compass,
  furnishing: Sofa,
  quickMoveIn: Clock3,
  availability: HousePlus,
  handoverCondition: KeyRound,
  parking: Car,
  maidsRoom: DoorOpen,
  corner: Square,
  floor: Building2,
};

type Chip = { key: FloorPlanChipKey; value: string; label: string };

function resolveChip(plan: FloorPlan, key: FloorPlanChipKey, compact: boolean): Chip | null {
  const chip = (value: string | undefined, label: string) => (value ? { key, value, label } : null);
  switch (key) {
    case "planType":
      return chip(hasText(plan.planType) ? plan.planType : undefined, "Plan type");
    case "beds":
      return chip(hasNumber(plan.bedrooms) ? `${plan.bedrooms}` : undefined, "Beds");
    case "baths":
      return chip(hasNumber(plan.bathrooms) ? `${plan.bathrooms} Bath` : undefined, "Baths");
    case "totalSqFt":
      return chip(hasNumber(plan.floorAreaSqFt) ? sqft(plan.floorAreaSqFt) : undefined, "Total SqFt");
    case "view":
      // "Sea View" on desktop, just "Sea" where space is tight.
      return chip(hasText(plan.view) ? (compact ? plan.view.replace(/\s*view$/i, "") : plan.view) : undefined, "View");
    case "aspect":
      return chip(hasText(plan.aspect) ? plan.aspect : undefined, "Aspect");
    case "furnishing":
      return chip(hasText(plan.furnishing) ? plan.furnishing : undefined, "Furnishing");
    case "quickMoveIn":
      return chip(plan.quickMoveIn ? (compact ? "Quick MI" : "Quick move-in") : undefined, "Move-in");
    case "availability":
      return chip(hasText(plan.availability) ? plan.availability : undefined, "Availability");
    case "handoverCondition":
      return chip(hasText(plan.handoverCondition) ? plan.handoverCondition : undefined, "Handover");
    case "parking":
      return chip(hasNumber(plan.parkingSpaces) ? `${plan.parkingSpaces}` : hasText(plan.parkingType) ? "Available" : undefined, "Parking");
    case "maidsRoom": {
      // "Yes" → the chip says what it is; custom text is shown as written; "No" is not a selling point.
      const value = hasText(plan.maidsRoom) && !/^no$/i.test(plan.maidsRoom.trim()) ? (/^yes$/i.test(plan.maidsRoom.trim()) ? "Maid's room" : plan.maidsRoom) : undefined;
      return chip(value, "Layout");
    }
    case "corner":
      return chip(plan.cornerUnit ? "Corner unit" : undefined, "Unit");
    case "floor":
      return chip(floorRangeLabel(plan.floorRange), "Floor");
  }
}

function buildChips(plan: FloorPlan, primary: FloorPlanChipKey[], max: number, compact: boolean): Chip[] {
  return [...primary, ...FLOOR_PLAN_CHIPS_OVERFLOW]
    .map((key) => resolveChip(plan, key, compact))
    .filter((chip): chip is Chip => Boolean(chip))
    .slice(0, max);
}

function ChipRow({ chips, className }: { chips: Chip[]; className: string }) {
  const { t, tPrice } = useListingT();
  if (!chips.length) return null;
  return (
    <div className={`listing-hero-stats-chips ${className}`} role="list" aria-label="Floor plan summary stats">
      {chips.map((chip) => {
        const Icon = CHIP_ICON[chip.key];
        return (
          <div key={chip.key} role="listitem" className="listing-hero-stat-chip">
            <Icon className="listing-hero-stat-chip-icon" aria-hidden="true" />
            <div className="listing-hero-stat-chip-content">
              <span className="listing-hero-stat-chip-value">{tPrice(t(chip.value))}</span>
              <span className="listing-hero-stat-chip-label">{t(chip.label)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Two rows are rendered — desktop (8) and mobile (6) differ in both set and
// wording — and CSS shows one per breakpoint (≤980px), like the fact sheet.
export function FloorPlanStatsChips({ floorPlan }: { floorPlan: FloorPlan; project?: Project }) {
  const desktop = buildChips(floorPlan, FLOOR_PLAN_CHIPS_DESKTOP, 9, false);
  const mobile = buildChips(floorPlan, FLOOR_PLAN_CHIPS_MOBILE, 7, true);
  if (!desktop.length && !mobile.length) return null;
  return (
    <>
      <ChipRow chips={desktop} className="stats-chips-desktop-only" />
      <ChipRow chips={mobile} className="stats-chips-mobile-only" />
    </>
  );
}
