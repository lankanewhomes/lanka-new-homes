"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { CheckCircle2, Info, TriangleAlert, X } from "lucide-react";
import { schemaLoaders } from "../_mock/schema/loaders";
import { apiFind, type Where } from "../_data/api";
import { scopeWhere } from "../_data/scope";
import type { Session } from "../_data/session";
import type { AnySchema, CollectionSchema, GlobalSchema, Role } from "../_mock/types";

// Session, theme, toasts and two small caches (schemas, record titles). Records themselves are never cached here: lists and forms
// load straight from Payload's REST API (../_data/api.ts), so what you see is always what is in the database.

type Toast = { id: number; kind: "ok" | "info" | "warn"; text: string };

type DashContext = {
  session: Session;
  role: Role;
  theme: "light" | "dark";
  toggleTheme: () => void;
  toast: (text: string, kind?: Toast["kind"]) => void;
  schemaOf: (slug: string) => AnySchema | undefined;
  ensureSchema: (slug: string) => Promise<AnySchema | undefined>;
  /** Where-clause that limits a collection to what this login may see (null = everything). */
  scope: (slug: string) => Where | null;
  /** Human title of a record in another collection (from a previous ensureLabels call), or a "#id" fallback. */
  labelOf: (collection: string, id: unknown) => string;
  ensureLabels: (collection: string, ids: unknown[]) => Promise<void>;
};

const Ctx = createContext<DashContext | null>(null);

export function useDash(): DashContext {
  const c = useContext(Ctx);
  if (!c) throw new Error("useDash must be used inside <DashProvider>");
  return c;
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
const THEMES = ["light", "dark"] as const;

export function DashProvider({ session, children }: { session: Session; children: ReactNode }) {
  const [theme, setThemeValue] = useStored<"light" | "dark">("dash-theme", "light", THEMES);
  const [toasts, setToasts] = useState<{ id: number; kind: "ok" | "info" | "warn"; text: string }[]>([]);
  const [tick, bump] = useReducer((x: number) => x + 1, 0);
  const schemas = useRef<Record<string, AnySchema>>({});
  const loading = useRef<Record<string, Promise<AnySchema | undefined>>>({});
  const titles = useRef<Map<string, string>>(new Map());
  const nextToast = useRef(1);

  useEffect(() => { document.documentElement.classList.toggle("dark", theme === "dark"); }, [theme]);

  const toast = useCallback((text: string, kind: Toast["kind"] = "ok") => {
    const id = nextToast.current++;
    setToasts((t) => [...t, { id, kind, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const ensureSchema = useCallback((slug: string) => {
    if (schemas.current[slug]) return Promise.resolve(schemas.current[slug]);
    loading.current[slug] ??= (async () => {
      const loader = schemaLoaders[slug];
      if (!loader) return undefined;
      const schema = (await loader()).default as AnySchema;
      schemas.current = { ...schemas.current, [slug]: schema };
      bump();
      return schema;
    })();
    return loading.current[slug];
  }, []);

  const ensureLabels = useCallback(async (collection: string, ids: unknown[]) => {
    const missing = [...new Set(ids.filter((v) => v !== null && v !== undefined && v !== "").map(String))].filter((id) => !titles.current.has(`${collection}:${id}`));
    if (!missing.length) return;
    const schema = (await ensureSchema(collection)) as CollectionSchema | undefined;
    const field = schema?.useAsTitle && schema.useAsTitle !== "id" ? schema.useAsTitle : null;
    const fallback = (id: string) => `${schema?.singular ?? collection} #${id}`;
    if (!field) { missing.forEach((id) => titles.current.set(`${collection}:${id}`, fallback(id))); bump(); return; }
    try {
      for (let i = 0; i < missing.length; i += 100) {
        const batch = missing.slice(i, i + 100);
        const page = await apiFind(collection, { limit: batch.length, where: { id: { in: batch } }, select: { [field]: true } });
        const found = new Map(page.docs.map((d) => [String(d.id), String(d[field] ?? "")]));
        batch.forEach((id) => titles.current.set(`${collection}:${id}`, found.get(id) || fallback(id)));
      }
    } catch {
      missing.forEach((id) => titles.current.set(`${collection}:${id}`, fallback(id)));
    }
    bump();
  }, [ensureSchema]);

  const value = useMemo<DashContext>(() => ({
    session,
    role: session.role,
    theme,
    toggleTheme: () => setThemeValue(theme === "dark" ? "light" : "dark"),
    toast,
    schemaOf: (slug) => schemas.current[slug],
    ensureSchema,
    scope: (slug) => scopeWhere(slug, session),
    labelOf: (collection, id) => titles.current.get(`${collection}:${String(id)}`) ?? `#${String(id)}`,
    ensureLabels,
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `tick` makes consumers re-render when a schema or title arrives
  }), [session, theme, setThemeValue, toast, ensureSchema, ensureLabels, tick]);

  return (
    <Ctx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div key={t.id} className="d-toast pointer-events-auto flex min-w-64 max-w-sm items-start gap-2 border border-line bg-panel px-3 py-2.5 text-sm">
            {t.kind === "ok" ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-ok" /> : t.kind === "warn" ? <TriangleAlert size={16} className="mt-0.5 shrink-0 text-warn" /> : <Info size={16} className="mt-0.5 shrink-0 text-brand" />}
            <span className="flex-1">{t.text}</span>
            <button type="button" aria-label="Dismiss" onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="text-muted hover:text-fg"><X size={14} /></button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

/** Loads a collection's schema (the exported Payload field list). */
export function useSchema(slug: string): CollectionSchema | undefined {
  const d = useDash();
  useEffect(() => { d.ensureSchema(slug); }, [d, slug]);
  return d.schemaOf(slug) as CollectionSchema | undefined;
}

export function useGlobalSchema(slug: string): GlobalSchema | undefined {
  const d = useDash();
  useEffect(() => { d.ensureSchema(`g-${slug}`); }, [d, slug]);
  return d.schemaOf(`g-${slug}`) as GlobalSchema | undefined;
}
