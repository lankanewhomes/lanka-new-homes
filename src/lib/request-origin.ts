// Where a request came from, for the lead trail: country / region / city
// from Vercel's geo headers (set by the edge, can't be spoofed by the
// client; blank on localhost) plus the device class from the user agent.
// Used for the buyer's origin on a lead (/api/leads) and for each reply tap
// (/api/leads/reply), so an admin can see e.g. a buyer in Dubai and a
// developer replying from Colombo.

import { classifyDeviceType } from "@/lib/analytics-event";

export type RequestOrigin = {
  country: string;
  region: string;
  city: string;
  device: string;
};

const decode = (value: string | null): string => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export function requestOrigin(request: Request): RequestOrigin {
  const h = request.headers;
  return {
    country: decode(h.get("x-vercel-ip-country")).toUpperCase(),
    region: decode(h.get("x-vercel-ip-country-region")),
    city: decode(h.get("x-vercel-ip-city")),
    device: classifyDeviceType(h.get("user-agent")),
  };
}

/** "Dubai, AE · mobile" — blanks drop out; "" when nothing is known. */
export function formatOrigin(origin: Partial<RequestOrigin> | null | undefined): string {
  if (!origin) return "";
  const place = [origin.city, origin.country].filter(Boolean).join(", ");
  const device = origin.device && origin.device !== "unknown" ? origin.device : "";
  return [place, device].filter(Boolean).join(" · ");
}
