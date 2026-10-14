// Browser-side client for Payload's own REST API (/payload-api). Every request carries the signed-in user's cookie, so Payload's
// access rules, hooks and Supabase sync behave exactly as they do in /cms: the dashboard has no data logic of its own.

export type Where = Record<string, unknown>;
export type Doc = { id: number | string; [key: string]: unknown };
export type Page<T = Doc> = { docs: T[]; totalDocs: number; totalPages: number; page: number; limit: number };

export class ApiError extends Error {
  status: number;
  /** Field-level problems from Payload, keyed by field path ("name", "contact.email"). */
  fieldErrors: Record<string, string>;
  constructor(message: string, status: number, fieldErrors: Record<string, string> = {}) {
    super(message);
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

const BASE = "/payload-api";

/** Flattens nested objects/arrays into Payload's bracket query syntax (where[a][b]=1, select[x]=true). */
export function toQuery(input: Record<string, unknown>): string {
  const parts: string[] = [];
  const walk = (key: string, value: unknown) => {
    if (value === undefined) return;
    if (value !== null && typeof value === "object") {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) walk(`${key}[${k}]`, v);
    } else parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
  };
  for (const [k, v] of Object.entries(input)) walk(k, v);
  return parts.join("&");
}

type FindOptions = { page?: number; limit?: number; sort?: string; where?: Where | null; depth?: number; select?: Record<string, unknown> };

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { credentials: "include", ...init, headers: { ...(init?.body ? { "Content-Type": "application/json" } : {}), ...(init?.headers ?? {}) } });
  } catch {
    throw new ApiError("Could not reach the server. Check your connection and try again.", 0);
  }
  const text = await res.text();
  let json: unknown = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* not JSON */ }
  if (!res.ok) {
    const body = (json ?? {}) as { errors?: { message?: string; data?: { errors?: { path?: string; message?: string }[] } }[]; message?: string };
    const fieldErrors: Record<string, string> = {};
    for (const e of body.errors ?? []) for (const f of e.data?.errors ?? []) if (f.path && f.message) fieldErrors[f.path] = f.message;
    const first = body.errors?.[0];
    const msg = Object.keys(fieldErrors).length ? "Some fields need attention." : (first?.message ?? body.message ?? (res.status === 401 || res.status === 403 ? "You do not have access to this." : `Request failed (${res.status}).`));
    throw new ApiError(msg, res.status, fieldErrors);
  }
  return json as T;
}

export function apiFind(slug: string, o: FindOptions = {}): Promise<Page> {
  const q = toQuery({ page: o.page, limit: o.limit ?? 10, sort: o.sort, depth: o.depth ?? 0, where: o.where ?? undefined, select: o.select });
  return request<Page>(`/${slug}?${q}`);
}

export async function apiGet(slug: string, id: number | string, depth = 0): Promise<Doc> {
  return request<Doc>(`/${slug}/${id}?depth=${depth}`);
}

export async function apiCount(slug: string, where?: Where | null): Promise<number> {
  const q = toQuery({ where: where ?? undefined });
  return (await request<{ totalDocs: number }>(`/${slug}/count${q ? `?${q}` : ""}`)).totalDocs;
}

export async function apiCreate(slug: string, data: Record<string, unknown>): Promise<Doc> {
  return (await request<{ doc: Doc }>(`/${slug}`, { method: "POST", body: JSON.stringify(data) })).doc;
}

export async function apiUpdate(slug: string, id: number | string, data: Record<string, unknown>): Promise<Doc> {
  return (await request<{ doc: Doc }>(`/${slug}/${id}`, { method: "PATCH", body: JSON.stringify(data) })).doc;
}

export async function apiDelete(slug: string, id: number | string): Promise<void> {
  await request(`/${slug}/${id}`, { method: "DELETE" });
}

export function apiGlobal(slug: string): Promise<Doc> {
  return request<Doc>(`/globals/${slug}?depth=0`);
}

export async function apiUpdateGlobal(slug: string, data: Record<string, unknown>): Promise<Doc> {
  const res = await request<{ result?: Doc } & Doc>(`/globals/${slug}`, { method: "POST", body: JSON.stringify(data) });
  return res.result ?? res;
}

export function apiGetJson<T>(path: string): Promise<T> {
  return request<T>(path);
}

export async function apiLogin(email: string, password: string): Promise<{ id: number | string; role?: string; email: string }> {
  const res = await request<{ user: { id: number | string; role?: string; email: string } }>("/users/login", { method: "POST", body: JSON.stringify({ email, password }) });
  return res.user;
}

export async function apiLogout(): Promise<void> {
  try { await request("/users/logout", { method: "POST" }); } catch { /* already signed out */ }
}
