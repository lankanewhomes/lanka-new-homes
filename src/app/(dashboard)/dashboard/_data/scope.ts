import type { Where } from "./api";
import type { Session } from "./session";

// The records a Developer login sees in each collection (an admin sees everything). This mirrors the access rules documented in
// docs/PAYLOAD-SCHEMA.md; Payload enforces them again on the server, this only narrows the lists (public-read collections such as
// Projects would otherwise list every developer's records).

const NONE = -1;
const inList = (list: number[]) => ({ in: list.length ? list : [NONE] });

export function scopeWhere(slug: string, s: Session): Where | null {
  if (s.role === "admin") return null;
  switch (slug) {
    case "developers": return { id: inList(s.developerIds) };
    case "projects": return { or: [{ developer: inList(s.developerIds) }, { id: inList(s.teamProjectIds) }] };
    case "lands": return { or: [{ and: [{ "seller.relationTo": { equals: "developers" } }, { "seller.value": inList(s.developerIds) }] }, { id: inList(s.teamLandIds) }] };
    case "leads":
    case "analytics":
    case "social-posts": return { project: inList(s.projectIds) };
    case "reviews":
    case "subscriptions":
    case "addon-requests": return { developer: inList(s.developerIds) };
    case "payments": return { "payer.value": inList(s.developerIds) };
    case "team-members": return { "company.value": inList(s.developerIds) };
    case "hero-slides": return { advertiser: inList(s.developerIds) };
    default: return null;
  }
}

/** Combine the role scope with other conditions. */
export function allOf(...parts: (Where | null | undefined)[]): Where | null {
  const list = parts.filter((p): p is Where => Boolean(p) && Object.keys(p as Where).length > 0);
  return list.length === 0 ? null : list.length === 1 ? list[0] : { and: list };
}
