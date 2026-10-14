import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "../../../../../payload.config";

// Who is signed in, and (for a developer) which companies, projects and lands they may touch. Computed on the server for every
// dashboard page, so the browser never decides its own access: the client only uses this to scope lists and build the menu,
// and Payload's own access rules still enforce everything on each request.

export type Session = {
  id: number | string;
  email: string;
  name: string;
  role: "admin" | "developer";
  developerIds: number[];
  /** Projects the user can manage: their company's plus any assigned to them as a team member. */
  projectIds: number[];
  landIds: number[];
  teamProjectIds: number[];
  teamLandIds: number[];
};

const ids = (list: unknown[] | null | undefined): number[] =>
  (list ?? []).map((v) => Number(v && typeof v === "object" ? (v as { id: unknown }).id : v)).filter((n) => Number.isFinite(n));

export async function getSession(): Promise<Session | null> {
  const payload = await getPayload({ config });
  const { user } = await payload.auth({ headers: await headers() });
  const u = user as { id: number | string; email: string; role?: string; full_name?: string } | null;
  if (!u || (u.role !== "admin" && u.role !== "developer")) return null;
  const base = { id: u.id, email: u.email, name: u.full_name || u.email };
  if (u.role === "admin") return { ...base, role: "admin", developerIds: [], projectIds: [], landIds: [], teamProjectIds: [], teamLandIds: [] };

  const [devs, team] = await Promise.all([
    payload.find({ collection: "developers", where: { user: { equals: u.id } }, limit: 50, depth: 0, overrideAccess: true }),
    payload.find({ collection: "team-members", where: { user: { equals: u.id } }, limit: 200, depth: 0, overrideAccess: true }),
  ]);
  const developerIds = devs.docs.map((d) => Number(d.id));
  const teamProjectIds = [...new Set(team.docs.flatMap((t) => ids((t as { listings?: unknown[] }).listings)))];
  const teamLandIds = [...new Set(team.docs.flatMap((t) => ids((t as { lands?: unknown[] }).lands)))];
  const own = developerIds.length
    ? await payload.find({ collection: "projects", where: { developer: { in: developerIds } }, limit: 1000, depth: 0, overrideAccess: true, pagination: false, select: { name: true } })
    : { docs: [] };
  const ownLands = developerIds.length
    ? await payload.find({ collection: "lands", where: { and: [{ "seller.relationTo": { equals: "developers" } }, { "seller.value": { in: developerIds } }] }, limit: 1000, depth: 0, overrideAccess: true, pagination: false, select: { title: true } })
    : { docs: [] };
  return {
    ...base,
    role: "developer",
    developerIds,
    teamProjectIds,
    teamLandIds,
    projectIds: [...new Set([...own.docs.map((d) => Number(d.id)), ...teamProjectIds])],
    landIds: [...new Set([...ownLands.docs.map((d) => Number(d.id)), ...teamLandIds])],
  };
}
