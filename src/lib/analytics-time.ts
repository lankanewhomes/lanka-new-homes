// One clock for every analytics number: Sri Lanka time, the same day GA4 uses (owner, 2026-10-31: "match GA4's day, have the
// Sri Lanka time"). Sri Lanka has no daylight saving, so the offset is a constant. A "day" key is YYYY-MM-DD in that clock.

export const ANALYTICS_TZ = "Asia/Colombo";
export const ANALYTICS_TZ_LABEL = "Sri Lanka time";
const OFFSET = "+05:30";
const DAY_MS = 86400000;

const dayFormat = new Intl.DateTimeFormat("en-CA", { timeZone: ANALYTICS_TZ, year: "numeric", month: "2-digit", day: "2-digit" });

/** The Sri Lanka calendar day (YYYY-MM-DD) that an instant falls on. */
export const dayKey = (at: Date | string | number = Date.now()): string => dayFormat.format(new Date(at));

/** The first instant of a Sri Lanka day, as an ISO string. */
export const dayStartIso = (key: string): string => new Date(`${key}T00:00:00.000${OFFSET}`).toISOString();

/** The last instant of a Sri Lanka day, as an ISO string. */
export const dayEndIso = (key: string): string => new Date(`${key}T23:59:59.999${OFFSET}`).toISOString();

/** A day key moved by whole days. */
export const addDays = (key: string, days: number): string => new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS).toISOString().slice(0, 10);

/** "9:41 pm" in Sri Lanka time. */
export const timeOf = (iso: string): string => new Date(iso).toLocaleTimeString("en-GB", { timeZone: ANALYTICS_TZ, hour: "numeric", minute: "2-digit", hour12: true }).replace(/\s/g, " ").toLowerCase();

/** "31 Oct" for a day key. */
export const shortDay = (key: string): string => new Date(`${key}T00:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", day: "numeric", month: "short" });
