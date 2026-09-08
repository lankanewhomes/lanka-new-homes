import type { OfficeHoursEntry } from "@/types";

export const formatLkr = (amount: number) =>
  `Rs. ${new Intl.NumberFormat("en-LK").format(amount)}`;

export const compactLkr = (amount: number) => {
  if (amount >= 1000000) {
    const value = amount / 1000000;
    return `Rs. ${value % 1 === 0 ? value.toFixed(0) : value.toFixed(1)}M`;
  }
  return formatLkr(amount);
};

const DAY_ABBREVIATION: Record<string, string> = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

function formatClockTime(value?: string) {
  if (!value) return "";
  const [hoursStr, minutesStr] = value.split(":");
  const hours = Number(hoursStr);
  if (Number.isNaN(hours)) return value;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHour}:${minutesStr ?? "00"} ${period}`;
}

// Shared by any profile with hours of operation (developers, and the
// CompanyProfile-shaped partner directories) — not client-only, since
// server-rendered directory pages need it too.
export function formatOfficeHours(officeHours: OfficeHoursEntry[] | undefined) {
  if (!officeHours || officeHours.length === 0) return [];

  const dayOrder: OfficeHoursEntry["day"][] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const byDay = new Map(officeHours.map((entry) => [entry.day, entry]));
  const ordered = dayOrder.map((day) => byDay.get(day)).filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  const lineFor = (entry: (typeof ordered)[number]) => (entry.open && entry.from && entry.to ? `${formatClockTime(entry.from)} - ${formatClockTime(entry.to)}` : "Closed");

  const groups: { days: string[]; text: string }[] = [];
  for (const entry of ordered) {
    const text = lineFor(entry);
    const last = groups[groups.length - 1];
    if (last && last.text === text) {
      last.days.push(entry.day);
    } else {
      groups.push({ days: [entry.day], text });
    }
  }

  return groups.map((group) => ({
    label: group.days.length > 1 ? `${DAY_ABBREVIATION[group.days[0]]} - ${DAY_ABBREVIATION[group.days[group.days.length - 1]]}` : DAY_ABBREVIATION[group.days[0]],
    value: group.text,
  }));
}

/** "45 min", "3 h 10 min", "2 d 4 h" — response times on dashboards. */
export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined || !Number.isFinite(minutes)) return "—";
  if (minutes < 60) return `${minutes} min`;
  if (minutes < 60 * 24) {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m ? `${h} h ${m} min` : `${h} h`;
  }
  const d = Math.floor(minutes / (60 * 24));
  const h = Math.floor((minutes % (60 * 24)) / 60);
  return h ? `${d} d ${h} h` : `${d} d`;
}
