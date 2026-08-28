import {
  Bath,
  BedDouble,
  Building2,
  Calendar,
  FileText,
  Footprints,
  HardHat,
  LayoutGrid,
  ParkingCircle,
  PawPrint,
  Ruler,
  Shield,
  DollarSign,
  Warehouse,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import type { FactIconKey } from "@/types";

// Whitelist — the only icons an admin can pick for a Property Facts row.
// Frontend and admin picker both read from this single map, so adding a new
// choice means adding one line here (plus the FactIconKey union in types).
export const ICON_MAP: Record<FactIconKey, LucideIcon> = {
  "building-2": Building2,
  wrench: Wrench,
  "layout-grid": LayoutGrid,
  footprints: Footprints,
  "bed-double": BedDouble,
  bath: Bath,
  ruler: Ruler,
  "parking-circle": ParkingCircle,
  "file-text": FileText,
  "hard-hat": HardHat,
  "dollar-sign": DollarSign,
  calendar: Calendar,
  shield: Shield,
  warehouse: Warehouse,
  "paw-print": PawPrint,
};

export const ICON_OPTIONS = Object.keys(ICON_MAP) as FactIconKey[];

export const ICON_LABELS: Record<FactIconKey, string> = {
  "building-2": "Building",
  wrench: "Wrench",
  "layout-grid": "Grid",
  footprints: "Footprints",
  "bed-double": "Bed",
  bath: "Bath",
  ruler: "Ruler",
  "parking-circle": "Parking",
  "file-text": "Document",
  "hard-hat": "Construction",
  "dollar-sign": "Dollar",
  calendar: "Calendar",
  shield: "Shield",
  warehouse: "Warehouse",
  "paw-print": "Pet friendly",
};
