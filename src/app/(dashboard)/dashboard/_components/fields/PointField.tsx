"use client";

import { FieldShell, inputCls, isReadOnly, type FieldProps } from "./shared";

// Sri Lanka outline (rough, lng/lat) for the mock map picker. Real maps (MapLibre, as on the public site) replace this later.
const OUTLINE: [number, number][] = [[79.84, 9.8], [80.2, 9.8], [80.5, 9.5], [80.9, 9.2], [81.2, 8.6], [81.6, 7.9], [81.85, 7.3], [81.7, 6.6], [81.4, 6.2], [80.9, 5.95], [80.3, 5.95], [79.9, 6.4], [79.8, 7.0], [79.85, 7.6], [79.9, 8.3], [79.8, 8.9], [79.9, 9.4]];
const B = { lngMin: 79.5, lngMax: 82.0, latMin: 5.8, latMax: 10.0 };
const W = 250;
const H = 420;
const px = (lng: number) => ((lng - B.lngMin) / (B.lngMax - B.lngMin)) * W;
const py = (lat: number) => ((B.latMax - lat) / (B.latMax - B.latMin)) * H;

/** Payload point ([lng, lat]) and any group holding lat/lng: click the map or type the numbers. */
export function PointField({ field, value, onChange, path, ctx, readOnly }: FieldProps<[number, number] | null>) {
  const ro = isReadOnly(field, ctx, readOnly);
  const [lng, lat] = value ?? [null, null];
  const place = (e: React.MouseEvent<SVGSVGElement>) => {
    if (ro) return;
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * W;
    const y = ((e.clientY - r.top) / r.height) * H;
    onChange([Math.round((B.lngMin + (x / W) * (B.lngMax - B.lngMin)) * 1e5) / 1e5, Math.round((B.latMax - (y / H) * (B.latMax - B.latMin)) * 1e5) / 1e5]);
  };
  const num = (v: string) => (v === "" ? null : Number(v));
  return (
    <FieldShell field={field} ctx={ctx} path={path}>
      <div className="flex flex-col gap-4 sm:flex-row">
        <svg viewBox={`0 0 ${W} ${H}`} onClick={place} role="img" aria-label="Map of Sri Lanka, click to place the pin" className={`h-64 w-auto shrink-0 rounded-lg border border-line bg-subtle ${ro ? "" : "cursor-crosshair"}`}>
          {[6, 7, 8, 9].map((l) => <line key={l} x1={0} x2={W} y1={py(l)} y2={py(l)} stroke="var(--d-line)" strokeWidth={0.6} />)}
          {[80, 81].map((l) => <line key={l} y1={0} y2={H} x1={px(l)} x2={px(l)} stroke="var(--d-line)" strokeWidth={0.6} />)}
          <polygon points={OUTLINE.map(([a, b]) => `${px(a)},${py(b)}`).join(" ")} fill="var(--d-panel)" stroke="var(--d-muted)" strokeWidth={1.2} strokeLinejoin="round" />
          <circle cx={px(79.86)} cy={py(6.93)} r={2.2} fill="var(--d-muted)" /><text x={px(79.86) + 5} y={py(6.93) + 3} fontSize={9} fill="var(--d-muted)">Colombo</text>
          {typeof lng === "number" && typeof lat === "number" ? (
            <g transform={`translate(${px(lng)},${py(lat)})`}><circle r={9} fill="var(--d-accent)" opacity={0.2} /><circle r={4.5} fill="var(--d-accent)" stroke="#fff" strokeWidth={1.5} /></g>
          ) : null}
        </svg>
        <div className="grid flex-1 content-start gap-3">
          <div><label className="mb-1 block text-xs text-muted">Latitude</label><input type="number" step="0.00001" disabled={ro} value={lat ?? ""} onChange={(e) => onChange([lng ?? 79.86, num(e.target.value) ?? 0])} className={inputCls} /></div>
          <div><label className="mb-1 block text-xs text-muted">Longitude</label><input type="number" step="0.00001" disabled={ro} value={lng ?? ""} onChange={(e) => onChange([num(e.target.value) ?? 0, lat ?? 6.93])} className={inputCls} /></div>
          <p className="text-xs text-muted">Click the map to drop the pin. This is a rough outline for the preview.</p>
        </div>
      </div>
    </FieldShell>
  );
}
