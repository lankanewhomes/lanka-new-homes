// Custom line-icon set for the project detail hero stats — a distinct
// NewHomesSrilanka icon language instead of generic lucide-react icons.
// Consistent style: 24x24 viewBox, 1.6 stroke, round caps/joins, no fill.

type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.6,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function StatusHouseIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M3.5 11.5 12 4l8.5 7.5" />
      <path d="M5.5 10v9a1 1 0 0 0 1 1H10v-5.5h4V20h3.5a1 1 0 0 0 1-1v-9" />
      <path d="M15 7.5V5h3v5" />
    </svg>
  );
}

export function ConstructionIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 20h16" />
      <path d="M6 20V9l6-4 6 4v11" />
      <path d="M9.5 20v-6h5v6" />
      <path d="M4.5 12.5h15" />
    </svg>
  );
}

export function PriceTagIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v9" />
      <path d="M14.7 9.7c0-1-1.1-1.7-2.7-1.7-1.7 0-2.7.8-2.7 1.9 0 2.6 5.4 1.3 5.4 3.9 0 1.1-1.1 1.9-2.7 1.9-1.6 0-2.7-.7-2.7-1.7" />
    </svg>
  );
}

export function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 21s7-6.4 7-11.5a7 7 0 1 0-14 0C5 14.6 12 21 12 21Z" />
      <circle cx="12" cy="9.5" r="2.4" />
    </svg>
  );
}

export function ApartmentIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="5" y="3.5" width="14" height="17" rx="1" />
      <path d="M8.5 7.5h1.2M14.3 7.5h1.2M8.5 11h1.2M14.3 11h1.2M8.5 14.5h1.2M14.3 14.5h1.2" />
      <path d="M10 20.5v-3.7h4v3.7" />
    </svg>
  );
}

export function FloorsIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 3.5 21 8l-9 4.5L3 8Z" />
      <path d="M3 12l9 4.5 9-4.5" />
      <path d="M3 16l9 4.5 9-4.5" />
    </svg>
  );
}

export function BlueprintIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="1" />
      <path d="M3.5 13.5h7v-7" />
      <path d="M8 13.5v3.5h9v-9h-3.5" />
    </svg>
  );
}

export function BuildingIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="4" y="6" width="9" height="14" rx="0.8" />
      <rect x="13" y="10" width="7" height="10" rx="0.8" />
      <path d="M6.5 9h1.2M9.8 9h1.2M6.5 12h1.2M9.8 12h1.2M6.5 15h1.2M9.8 15h1.2" />
      <path d="M15.5 13h1.2M15.5 16h1.2" />
    </svg>
  );
}

export function BedIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M3 19v-8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v8" />
      <path d="M3 16h18" />
      <path d="M6 12V9.5a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 12 9.5V12" />
      <path d="M3 19v2M21 19v2" />
    </svg>
  );
}

export function BathIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 12h16v3a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4Z" />
      <path d="M6 12V6.5A2.5 2.5 0 0 1 8.5 4c1 0 1.8.55 2.2 1.35" />
      <path d="M7 19v2M17 19v2" />
    </svg>
  );
}

export function RulerIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="3" y="9" width="18" height="6" rx="1" transform="rotate(0 12 12)" />
      <path d="M6 9v2.2M9 9v2.2M12 9v2.2M15 9v2.2M18 9v2.2" />
    </svg>
  );
}

export function RoadIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M9 3 5 21" />
      <path d="M15 3l4 18" />
      <path d="M12 5.5v2M12 11v2M12 16.5v2" />
    </svg>
  );
}

export function AreaIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 8V4h4M16 4h4v4M20 16v4h-4M8 20H4v-4" />
      <rect x="8.5" y="8.5" width="7" height="7" rx="0.6" />
    </svg>
  );
}

export function BoltIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M13 3 5 13.5h5.5L11 21l8-11h-5.5Z" />
    </svg>
  );
}

export function DropletIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 3.5s6 6.7 6 11a6 6 0 1 1-12 0c0-4.3 6-11 6-11Z" />
    </svg>
  );
}

export function GiftIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <rect x="4" y="9.5" width="16" height="4" rx="0.6" />
      <rect x="5.5" y="13.5" width="13" height="7" rx="0.6" />
      <path d="M12 9.5v11" />
      <path d="M12 9.5c-1-2.4-2.6-4-4.2-4-1.2 0-2 .8-2 1.9 0 1.2 1 2.1 2.4 2.1Z" />
      <path d="M12 9.5c1-2.4 2.6-4 4.2-4 1.2 0 2 .8 2 1.9 0 1.2-1 2.1-2.4 2.1Z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M12 3.5 19 6.5v5c0 5-3 8.3-7 9.5-4-1.2-7-4.5-7-9.5v-5Z" />
      <path d="M9 12l2 2 4-4.3" />
    </svg>
  );
}

export function LandmarkIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4 9.5 12 4l8 5.5" />
      <path d="M5 9.5v9.5M9.3 9.5v9.5M14.7 9.5v9.5M19 9.5v9.5" />
      <path d="M3.5 19h17" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5V12l3.2 2" />
    </svg>
  );
}

export function CarIcon({ className }: IconProps) {
  return (
    <svg className={className} {...base} aria-hidden="true">
      <path d="M4.5 16V11l2-4.5h11l2 4.5v5" />
      <path d="M3.5 16h17v2.5a1 1 0 0 1-1 1h-1.5a1 1 0 0 1-1-1V17h-11v1.5a1 1 0 0 1-1 1H4.5a1 1 0 0 1-1-1Z" />
      <path d="M6.5 11.5h11" />
      <circle cx="7.5" cy="14.5" r="1" />
      <circle cx="16.5" cy="14.5" r="1" />
    </svg>
  );
}
