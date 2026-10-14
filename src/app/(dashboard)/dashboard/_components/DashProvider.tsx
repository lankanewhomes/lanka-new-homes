"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { schemaLoaders } from "../_mock/schema/loaders";
import { blankRow, generateGlobal, generateRows } from "../_mock/generate";
import { MOCK_DEVELOPER, type AnySchema, type CollectionSchema, type GlobalSchema, type Role, type Row } from "../_mock/types";

// All state of the preview lives here, in memory (useState/useReducer). Nothing is fetched or saved anywhere:
// reloading the page resets the mock data. Swapping to Payload later means replacing ensure/saveRow/deleteRows
// with Local API calls; the components already talk only to this context.


type Toast = { id: number; kind: "ok" | "info" | "warn"; text: string };

type DashContext = {
  role: Role;
  setRole: (r: Role) => void;
  theme: "light" | "dark";
  toggleTheme: () => void;
  schemaOf: (slug: string) => AnySchema | undefined;
  rowsOf: (slug: string) => Row[] | undefined;
  globalOf: (slug: string) => Row | undefined;
  ensure: (slug: string) => Promise<void>;
  saveRow: (slug: string, row: Row) => Row;
  deleteRows: (slug: string, ids: (number | string)[]) => void;
  duplicateRow: (slug: string, id: number | string) => Row | undefined;
  saveGlobal: (slug: string, row: Row) => void;
  newRow: (slug: string) => Row | undefined;
  toast: (text: string, kind?: Toast["kind"]) => void;
  /** Rows visible to the current role (a developer sees only their own company's records). */
  scoped: (slug: string) => Row[] | undefined;
  versionTick: number;
};

const Ctx = createContext<DashContext | null>(null);

export function useDash(): DashContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDash must be used inside <DashProvider>");
  return c;
}

const DEV = MOCK_DEVELOPER.id;
const relValue = (v: unknown): unknown => (v && typeof v === "object" && "value" in (v as object) ? (v as { value: unknown }).value : v);

/** What a Developer login may see, following the Payload access rules (see docs/PAYLOAD-SCHEMA.md). */
export function ownerOf(slug: string, row: Row, projectDeveloper: (projectId: unknown) => unknown): boolean {
  switch (slug) {
    case "developers": return row.id === DEV;
    case "projects": return row.developer === DEV;
    case "lands": return relValue(row.seller) === DEV;
    case "leads":
    case "analytics": return projectDeveloper(row.project) === DEV;
    case "reviews": return row.developer === DEV;
    case "subscriptions":
    case "addon-requests": return row.developer === DEV;
    case "payments": return relValue(row.payer) === DEV;
    case "team-members": return relValue(row.company) === DEV;
    case "hero-slides": return row.advertiser === DEV;
    case "plan-waitlist": return true;
    default: return true;
  }
}

/** A localStorage-backed value that is safe for server rendering (the server always sees `fallback`). */
function useStored<T extends string>(key: string, fallback: T, valid: readonly T[]): [T, (v: T) => void] {
  const subscribe = useCallback((cb: () => void) => {
    window.addEventListener("storage", cb);
    window.addEventListener(`dash:${key}`, cb);
    return () => { window.removeEventListener("storage", cb); window.removeEventListener(`dash:${key}`, cb); };
  }, [key]);
  const read = useCallback((): T => {
    try { const v = localStorage.getItem(key) as T | null; return v && valid.includes(v) ? v : fallback; } catch { return fallback; }
  }, [key, fallback, valid]);
  const value = useSyncExternalStore(subscribe, read, () => fallback);
  const write = useCallback((v: T) => {
    try { localStorage.setItem(key, v); } catch {}
    window.dispatchEvent(new Event(`dash:${key}`));
  }, [key]);
  return [value, write];
}
const ROLES = ["admin", "developer"] as const;
const THEMES = ["light", "dark"] as const;

export function DashProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useStored<Role>("dash-role", "admin", ROLES);
  const [theme, setThemeValue] = useStored<"light" | "dark">("dash-theme", "light", THEMES);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [versionTick, bump] = useReducer((x: number) => x + 1, 0);
  const schemas = useRef<Record<string, AnySchema>>({});
  const data = useRef<Record<string, Row[]>>({});
  const globals = useRef<Record<string, Row>>({});
  const pending = useRef<Record<string, Promise<void>>>({});
  const nextToast = useRef(1);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  const toast = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = nextToast.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);

  const ensure = useCallback((slug: string) => {
    if (slug in data.current || slug in globals.current) return Promise.resolve();
    pending.current[slug] ??= (async () => {
      const loader = schemaLoaders[slug];
      if (!loader) return;
      const schema = (await loader()).default as AnySchema;
      schemas.current = { ...schemas.current, [slug]: schema };
      if (schema.kind === "global") globals.current = { ...globals.current, [slug.replace(/^g-/, "")]: generateGlobal(schema.fields, slug) };
      else data.current = { ...data.current, [slug]: generateRows(schema as CollectionSchema) };
      bump();
    })();
    return pending.current[slug];
  }, []);

  const projectDeveloper = useCallback((projectId: unknown) => data.current.projects?.find((p) => p.id === projectId)?.developer, []);

  const value = useMemo<DashContext>(() => {
    const rowsOf = (slug: string) => data.current[slug];
    return {
      role, setRole, theme, toggleTheme: () => setThemeValue(theme === "dark" ? "light" : "dark"),
      schemaOf: (slug) => schemas.current[slug],
      rowsOf,
      globalOf: (slug) => globals.current[slug],
      ensure,
      saveRow: (slug, row) => {
        const list = data.current[slug] ?? [];
        const now = new Date().toISOString();
        if (row.id === "new") {
          const created = { ...row, id: Math.max(0, ...list.map((r) => Number(r.id) || 0)) + 1, createdAt: now, updatedAt: now };
          data.current = { ...data.current, [slug]: [created, ...list] };
          bump();
          return created;
        }
        const saved = { ...row, updatedAt: now };
        data.current = { ...data.current, [slug]: list.map((r) => (r.id === row.id ? saved : r)) };
        bump();
        return saved;
      },
      deleteRows: (slug, ids) => {
        data.current = { ...data.current, [slug]: (data.current[slug] ?? []).filter((r) => !ids.includes(r.id)) };
        bump();
      },
      duplicateRow: (slug, id) => {
        const list = data.current[slug];
        const src = list?.find((r) => r.id === id);
        if (!list || !src) return undefined;
        const copy: Row = { ...structuredClone(src), id: Math.max(0, ...list.map((r) => Number(r.id) || 0)) + 1 };
        if (typeof copy.slug === "string") copy.slug = `${copy.slug}-copy`;
        data.current = { ...data.current, [slug]: [copy, ...list] };
        bump();
        return copy;
      },
      saveGlobal: (slug, row) => {
        globals.current = { ...globals.current, [slug]: row };
        bump();
      },
      newRow: (slug) => {
        const s = schemas.current[slug];
        return s ? blankRow(s.fields, slug) : undefined;
      },
      toast,
      scoped: (slug) => {
        const rows = data.current[slug];
        if (!rows || role === "admin") return rows;
        return rows.filter((r) => ownerOf(slug, r, projectDeveloper));
      },
      versionTick,
    };
  }, [role, setRole, theme, setThemeValue, toast, ensure, projectDeveloper, versionTick]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="d-toast pointer-events-auto flex min-w-64 max-w-sm items-start gap-2 rounded-lg border border-line bg-panel px-3 py-2.5 text-sm shadow-card">
            {t.kind === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : t.kind === "warn" ? <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-accent" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-muted hover:text-fg"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Ensures a collection's schema + mock rows are loaded; `ready` flips when they are. */
export function useCollection(slug: string) {
  const d = useDash();
  const [, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    d.ensure(slug).then(() => alive && setN((n) => n + 1));
    return () => { alive = false; };
  }, [d, slug]);
  const schema = d.schemaOf(slug) as CollectionSchema | undefined;
  const all = d.rowsOf(slug);
  return { schema, all, rows: d.scoped(slug), ready: Boolean(schema && all) };
}

export function useGlobal(slug: string) {
  const d = useDash();
  const [, setN] = useState(0);
  useEffect(() => {
    let alive = true;
    d.ensure(`g-${slug}`).then(() => alive && setN((n) => n + 1));
    return () => { alive = false; };
  }, [d, slug]);
  return { schema: d.schemaOf(`g-${slug}`) as GlobalSchema | undefined, row: d.globalOf(slug) };
}
