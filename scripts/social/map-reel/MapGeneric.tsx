import React from 'react'
import { AbsoluteFill, Easing, Img, staticFile, useCurrentFrame } from 'remotion'
import { DISPLAY, useFonts } from './fonts'

// Generic "minutes from" map reel (design system 2026-11-16): dark OSM basemap, glowing pin, dashed OSRM routes with "N MINS" UNDER each place name, white-bordered
// listing card cycling through photos, voiced callouts, end card = bordered photo + bold uppercase title + city (regular, accent) + FROM price block + plain URL.
export type Geo = { w: number; h: number; project: number[]; routes: Record<string, { min: number; km: number; pts: number[][]; dest: number[] }> }
export type MapProps = {
  geo: Geo; base: string; accent: string; title: string[]; cardTitle: string; cardCity: string; city: string
  routes: { key: string; label: string }[]; photos: string[]; callouts: [string, string][]; callDur: number[]; endPhoto: string; price: string; url: string
}
const HERO = 72, RLEN = 72, TAIL = 200
const E = 170 // end card: info block sits low in the safe zone (owner 2026-11-17), clear of the platform buttons
export const timeline = (p: MapProps) => {
  const starts = p.callDur.reduce<number[]>((a, d, i) => [...a, i ? a[i - 1] + p.callDur[i - 1] : HERO + 4], [])
  const callEnd = starts[starts.length - 1] + p.callDur[p.callDur.length - 1]
  const R0 = callEnd + 14, END = R0 + p.routes.length * RLEN
  return { starts, callEnd, R0, END, total: END + TAIL }
}
const clamp = (v: number) => Math.min(1, Math.max(0, v))
const len = (pts: number[][]) => pts.reduce((a, p, i) => (i ? a + Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]) : 0), 0)
const toD = (pts: number[][]) => pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
const at = (pts: number[][], t: number) => { const L = len(pts); let d = L * t; for (let i = 1; i < pts.length; i++) { const seg = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (d <= seg) { const u = d / seg; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u] } d -= seg } return pts[pts.length - 1] }
const bounds = (pts: number[][]) => { const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]); return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) } }

const Label: React.FC<{ x: number; y: number; children: React.ReactNode; size?: number; color?: string; o?: number; dy?: number; sc?: number; weight?: number }> = ({ x, y, children, size = 58, color = '#fff', o = 1, dy = 0, sc = 1, weight = 800 }) => (
  <div style={{ position: 'absolute', left: x, top: y + dy, transform: `translate(-50%, -100%) scale(${sc})`, transformOrigin: 'center bottom', fontFamily: DISPLAY, fontWeight: weight, fontSize: size, letterSpacing: weight === 800 ? 1 : 0, lineHeight: 1.02, color, textTransform: weight === 800 ? 'uppercase' : 'none', whiteSpace: 'nowrap', textAlign: 'center', opacity: o, textShadow: '0 4px 24px rgba(0,0,0,0.9), 0 0 6px rgba(0,0,0,0.9)' }}>{children}</div>
)

export const MapGeneric: React.FC<MapProps> = (p) => {
  useFonts()
  const f = useCurrentFrame()
  const { geo } = p
  const P = geo.project
  const T = timeline(p)
  const N = p.routes.length
  const R = geo.routes
  const camFor = (key: string) => { const r = R[key]; const b = bounds([...r.pts, P]); const bw = Math.max(1, b.x1 - b.x0), bh = Math.max(1, b.y1 - b.y0); const s = Math.min(700 / bw, 880 / bh, 2.0); return { cx: (b.x0 + b.x1) / 2, cy: (b.y0 + b.y1) / 2 + 60, s } }
  const KEYS = [
    { f: 0, cx: P[0], cy: P[1] - 500, s: 0.34 }, { f: 60, cx: P[0], cy: P[1], s: 1.5 }, { f: T.R0 - 10, cx: P[0], cy: P[1], s: 1.35 },
    ...p.routes.flatMap((r, i) => { const c = camFor(r.key); return [{ f: T.R0 + i * RLEN + 10, ...c }, { f: T.R0 + (i + 1) * RLEN - 8, ...c }] }),
    { f: T.END + 30, cx: P[0], cy: P[1], s: 0.5 },
  ]
  const cam = (fr: number) => {
    let k = 0; while (k < KEYS.length - 2 && fr > KEYS[k + 1].f) k++
    const a = KEYS[k], b = KEYS[k + 1]; const t = Easing.inOut(Easing.cubic)(clamp((fr - a.f) / (b.f - a.f)))
    const sc = a.s * Math.pow(b.s / a.s, t); const cx0 = a.cx + (b.cx - a.cx) * t, cy0 = a.cy + (b.cy - a.cy) * t
    const hx = 540 / sc, hy = 960 / sc
    return { cx: Math.min(geo.w - hx, Math.max(hx, cx0)), cy: Math.min(geo.h - hy, Math.max(hy, cy0)), s: sc }
  }
  const c = cam(f)
  const scr = (pt: number[]) => [540 + (pt[0] - c.cx) * c.s, 960 + (pt[1] - c.cy) * c.s]
  const pinS = scr(P)
  const endT = clamp((f - T.END) / 14)
  const heroO = clamp((f - HERO + 4) / 12) * (1 - clamp((f - (T.R0 - 14)) / 10))
  const PSLIDE = Math.max(30, Math.round((T.callEnd - HERO - 4) / p.photos.length))
  const ACC = p.accent
  const ci = Math.max(0, T.starts.filter((s) => f >= s).length - 1)
  const pop = clamp((f - T.starts[ci]) / 5)
  const big = (t: string) => (t.length > 11 ? 80 : 90)
  return (
    <AbsoluteFill style={{ background: '#1b1e24', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', left: 0, top: 0, width: geo.w, height: geo.h, transformOrigin: '0 0', transform: `translate(${540 - c.cx * c.s}px, ${960 - c.cy * c.s}px) scale(${c.s})`, filter: 'brightness(1.5) contrast(1.05)' }}>
        <Img src={staticFile(p.base)} style={{ position: 'absolute', left: 0, top: 0, width: geo.w, height: geo.h }} />
        <svg width={geo.w} height={geo.h} style={{ position: 'absolute', left: 0, top: 0, overflow: 'visible' }}>
          <defs>{p.routes.map((rt, i) => { const L = len(R[rt.key].pts); const t = clamp((f - (T.R0 + i * RLEN + 6)) / 22); return (
            <mask id={`m${i}`} key={i}><path d={toD(R[rt.key].pts)} fill="none" stroke="#fff" strokeWidth={30 / c.s} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={L} strokeDashoffset={L * (1 - Easing.inOut(Easing.quad)(t))} /></mask>) })}</defs>
          {p.routes.map((rt, i) => (f >= T.R0 + i * RLEN + 6 ? <g key={rt.key} mask={`url(#m${i})`} opacity={i === Math.floor((f - T.R0) / RLEN) || f >= T.END ? 1 : 0.35}><path d={toD(R[rt.key].pts)} fill="none" stroke="#07080a" strokeWidth={16 / c.s} strokeLinecap="round" strokeLinejoin="round" /><path d={toD(R[rt.key].pts)} fill="none" stroke="#fff" strokeWidth={8 / c.s} strokeDasharray={`${22 / c.s} ${16 / c.s}`} strokeLinecap="round" strokeLinejoin="round" /></g> : null))}
        </svg>
      </div>
      {[0, 1].map((k) => { const t = ((f + k * 22) % 45) / 45; return <div key={k} style={{ position: 'absolute', left: pinS[0], top: pinS[1], width: 40 + t * 220, height: 40 + t * 220, borderRadius: '50%', border: `${6 - t * 4}px solid ${ACC}`, transform: 'translate(-50%,-50%)', opacity: (1 - t) * clamp((f - 6) / 10) }} /> })}
      <div style={{ position: 'absolute', left: pinS[0], top: pinS[1], width: 34, height: 34, borderRadius: '50%', background: ACC, transform: 'translate(-50%,-50%)', boxShadow: `0 0 50px 14px ${ACC}aa`, opacity: clamp((f - 4) / 8) }} />
      {p.routes.map((rt, i) => { const t0 = T.R0 + i * RLEN; const r = R[rt.key]; const d0 = scr(r.dest); const nm = rt.label; const hw = (nm.length > 18 ? 52 : 62) * 0.36 * nm.length; const d = [Math.min(1080 - 40 - hw, Math.max(40 + hw, d0[0])), Math.min(1500, Math.max(d0[1], 470))]; const reach = clamp((f - (t0 + 26)) / 6); const out = i < N - 1 ? 1 - clamp((f - (t0 + RLEN - 10)) / 8) : 1; const mT = clamp((f - (t0 + 22)) / 8)
        return f >= t0 + 6 && f < T.END + 14 ? (<React.Fragment key={rt.key}>
          <div style={{ position: 'absolute', left: Math.min(1040, Math.max(40, d0[0])), top: d[1], width: 30, height: 30, borderRadius: '50%', background: '#fff', transform: `translate(-50%,-50%) scale(${reach})`, boxShadow: '0 0 40px 10px rgba(255,255,255,0.7)', opacity: out }} />
          <Label x={d[0]} y={d[1]} dy={-34} size={nm.length > 18 ? 52 : 62} o={reach * out}>{nm}</Label>
          <Label x={d[0]} y={d[1]} dy={96} size={68} color={ACC} o={mT * out}>{r.min} {r.min === 1 ? 'MIN' : 'MINS'}</Label>
        </React.Fragment>) : null })}
      {f < HERO ? <>
        {p.title.map((t, k) => <Label key={t} x={540} y={1250 + k * 92} size={86} o={clamp((f - 12 - k * 2) / 8) * (1 - clamp((f - 58) / 10))}>{t}</Label>)}
        <Label x={540} y={1250 + (p.title.length - 1) * 92 + 56} size={46} weight={400} color={ACC} o={clamp((f - 18) / 8) * (1 - clamp((f - 58) / 10))}>{p.city}</Label>
      </> : null}
      {heroO > 0 ? <>
        <div style={{ position: 'absolute', left: 90, top: 400, width: 900, background: '#fff', padding: 14, opacity: heroO, transform: `translateY(${(1 - heroO) * 40}px)`, boxShadow: '0 30px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.9)' }}>
          <div style={{ position: 'relative', width: 872, height: 700, overflow: 'hidden', background: '#ddd' }}>
            {p.photos.map((src, i) => { const st = HERO + 4 + i * PSLIDE; const o = i === 0 ? (f < st + PSLIDE ? 1 : 0) : clamp((f - st) / 3) * (f < st + PSLIDE || i === p.photos.length - 1 ? 1 : 0); return <Img key={i} src={staticFile(src)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: o, transform: `scale(${1 + Math.max(0, f - st) * 0.0009})` }} /> })}
          </div>
          <div style={{ padding: '14px 6px 6px', fontFamily: DISPLAY, color: '#303030' }}>
            <div style={{ fontWeight: 400, fontSize: 46, lineHeight: '56px', color: '#1a1a1a' }}>{p.cardTitle}</div>
            <div style={{ fontWeight: 400, fontSize: 34, lineHeight: '50px', marginTop: -6, color: '#303030' }}>{p.cardCity}</div>
          </div>
        </div>
        <Label x={540} y={1348} size={big(p.callouts[ci][0])} weight={400} o={heroO * clamp(pop * 2)} sc={0.85 + 0.15 * pop}>{p.callouts[ci][0]}</Label>
        <Label x={540} y={1436} size={big(p.callouts[ci][1])} weight={400} color={ACC} o={heroO * clamp(pop * 2)} sc={0.85 + 0.15 * pop}>{p.callouts[ci][1]}</Label>
      </> : null}
      {f >= T.END ? (() => { const e = f - T.END; const n = p.title.length; const urlTop = 1350, priceTop = urlTop - 30 - 150, cityTop = priceTop - 18 - 56, titleTop = cityTop - 8 - n * 84
        const sweep = clamp((e - 4) / 26); const fade = (a: number) => clamp((e - a) / 10)
        return <AbsoluteFill>
        <AbsoluteFill style={{ opacity: clamp(e / 10), overflow: 'hidden' }}>
          <Img src={staticFile(p.endPhoto)} style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.04 + e * 0.0008})`, filter: `blur(${Math.max(0, 16 - e * 1.3)}px) saturate(1.1) contrast(1.06)` }} />
        </AbsoluteFill>
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(5,8,12,0.55) 0%, rgba(5,8,12,0) 22%, rgba(5,8,12,0) 34%, rgba(5,8,12,0.6) 56%, rgba(5,8,12,0.92) 86%)' }} />
        <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)' }} />
        <div style={{ position: 'absolute', top: 0, bottom: 0, left: -400 + sweep * 1900, width: 260, transform: 'skewX(-18deg)', background: 'linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.22), rgba(255,255,255,0))', opacity: sweep > 0 && sweep < 1 ? 1 : 0 }} />
        {p.title.map((t, k) => <div key={t} style={{ position: 'absolute', left: 0, width: 1080, top: titleTop + k * 84, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 800, fontSize: 72, lineHeight: '84px', color: '#fff', textTransform: 'uppercase', textShadow: '0 4px 30px rgba(0,0,0,0.7)', opacity: fade(6 + k * 2), transform: `scale(${0.9 + 0.1 * fade(6 + k * 2)})`, whiteSpace: 'nowrap' }}>{t}</div>)}
        <div style={{ position: 'absolute', left: 0, width: 1080, top: cityTop, textAlign: 'center', fontFamily: DISPLAY, fontWeight: 400, fontSize: 46, lineHeight: '56px', color: ACC, textShadow: '0 3px 20px rgba(0,0,0,0.8)', opacity: fade(12) }}>{p.city}</div>
        <div style={{ position: 'absolute', left: 0, width: 1080, top: priceTop, display: 'flex', justifyContent: 'center', opacity: fade(18), transform: `translateY(${(1 - fade(18)) * 24}px)` }}>
          <div style={{ height: 150, display: 'flex', alignItems: 'center', padding: '0 26px', backgroundColor: '#0b1220', backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.28) 0 2px, transparent 2px 50px), repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 2px, transparent 2px 50px)', color: '#fff', fontFamily: DISPLAY, fontSize: 52, fontWeight: 500, letterSpacing: 4 }}>FROM</div>
          <div style={{ height: 150, display: 'flex', alignItems: 'center', padding: '0 26px', background: '#fff', color: '#0b1220', fontFamily: DISPLAY, fontSize: 52, fontWeight: 500, whiteSpace: 'nowrap' }}>{p.price}</div>
        </div>
        <div style={{ position: 'absolute', left: 0, width: 1080, top: urlTop, textAlign: 'center', opacity: fade(28) }}><span style={{ display: 'inline-block', fontFamily: DISPLAY, background: '#fff', color: '#0b1220', fontSize: 27, fontWeight: 500, padding: '18px 22px' }}>{p.url}</span></div>
      </AbsoluteFill> })() : null}
      <Img src={staticFile('media/logo-white.png')} style={{ position: 'absolute', left: 100, top: 262, width: 210, filter: 'drop-shadow(0 2px 10px rgba(0,0,0,0.55))' }} />
    </AbsoluteFill>
  )
}
