#!/usr/bin/env python3
"""Render social assets for one listing from its OWN photos and drawings:
a 9:16 story reel (blueprint -> 3D site hologram -> aerial reveal -> parallax
walkthrough -> branded end card) and 4:5 carousel cards for Instagram/Facebook.

Driven by a spec JSON written by scripts/social/generate.ts:
  python3 render_social.py --spec spec.json --out outdir [--no-depth] [--skip-reel] [--skip-cards]

Nothing here invents content: every line of text comes from the spec, every
pixel from the listing's real images. Depth-based parallax needs torch +
transformers (see requirements.txt); without them the walkthrough falls back
to plain Ken Burns moves. ffmpeg is resolved from $FFMPEG_PATH, PATH, or an
installed ffmpeg-static package.
"""
import argparse, json, math, os, shutil, subprocess, sys
import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageEnhance, ImageFilter, ImageFont, ImageOps
from scipy import ndimage

W, H, FPS = 1080, 1920, 30
CARD_W, CARD_H = 1080, 1350
HERE = os.path.dirname(os.path.abspath(__file__))
FONT_PATH = os.path.join(HERE, "assets", "fonts", "Archivo-VF.ttf")
ORANGE, DARK, WHITE, MUTED, CYAN = (244, 123, 54), (22, 22, 26), (255, 255, 255), (214, 214, 220), (0, 232, 255)

# ------------------------------------------------------------------ basics
_fonts = {}
def font(size, weight="Regular"):
    key = (size, weight)
    if key not in _fonts:
        f = ImageFont.truetype(FONT_PATH, size)
        try: f.set_variation_by_name(weight)
        except Exception: pass
        _fonts[key] = f
    return _fonts[key]

def ease(t): return 1 - (1 - t) ** 3
def ease_io(t): return t * t * (3 - 2 * t)
def clamp(x, a=0.0, b=1.0): return max(a, min(b, x))

_vignette = None
def vignette():
    global _vignette
    if _vignette is None:
        small = Image.new("L", (W // 8, H // 8), 0); cx, cy = small.width / 2, small.height / 2
        for yy in range(small.height):
            for xx in range(small.width):
                r = math.hypot((xx - cx) / cx, (yy - cy) / cy)
                small.putpixel((xx, yy), int(255 * clamp((r - 0.55) / 0.9) ** 1.6 * 0.55))
        _vignette = Image.merge("RGBA", (Image.new("L", small.size, 0),) * 3 + (small,)).resize((W, H), Image.BILINEAR).filter(ImageFilter.GaussianBlur(12))
    return _vignette

def grade(im):
    """Editorial look: slightly desaturated, a touch of contrast and warmth, soft vignette."""
    im = ImageEnhance.Color(im).enhance(0.92); im = ImageEnhance.Contrast(im).enhance(1.06)
    r, g, b = im.split()
    r = r.point(lambda v: min(255, int(v * 1.02 + 3))); b = b.point(lambda v: max(0, int(v * 0.985)))
    out = Image.merge("RGB", (r, g, b)).convert("RGBA"); out.alpha_composite(vignette()); return out

def bottom_shade(frame, height=520, strength=110):
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(shade)
    for i in range(0, height, 4): sd.rectangle((0, H - height + i, W, H - height + i + 4), fill=(0, 0, 0, int(strength * (i / height) ** 1.5)))
    frame.alpha_composite(shade)

def find_coeffs(dst, src):
    A = []
    for (x, y), (u, v) in zip(dst, src):
        A.append([x, y, 1, 0, 0, 0, -u * x, -u * y]); A.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    return np.linalg.lstsq(np.asarray(A, float), np.asarray(src, float).reshape(8), rcond=None)[0]

# ------------------------------------------------------------------ depth (optional)
def compute_depth_maps(paths, cache_dir):
    """Depth Anything V2 (small) per photo -> grayscale PNG next to a cache dir. Returns {path: depth_path}."""
    try:
        import torch
        from transformers import pipeline
    except Exception as e:
        print(f"[depth] torch/transformers unavailable ({e.__class__.__name__}) — rendering without parallax", flush=True)
        return {}
    os.makedirs(cache_dir, exist_ok=True)
    device = "mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu")
    pipe = pipeline("depth-estimation", model="depth-anything/Depth-Anything-V2-Small-hf", device=device)
    out = {}
    for p in paths:
        dp = os.path.join(cache_dir, os.path.splitext(os.path.basename(p))[0] + "_depth.png")
        if not os.path.exists(dp):
            im = Image.open(p).convert("RGB")
            d = np.array(pipe(im)["depth"], dtype=np.float32); d = (d - d.min()) / (d.max() - d.min() + 1e-6)
            Image.fromarray((d * 255).astype(np.uint8)).resize(im.size).save(dp)
        out[p] = dp
    print(f"[depth] {len(out)} depth maps ready ({device})", flush=True)
    return out

class CamPIL:
    """Zoom/pan camera over one photo (no parallax)."""
    def __init__(self, path, depth=None):
        self.im = Image.open(path).convert("RGB"); self.w, self.h = self.im.size; self.base = max(W / self.w, H / self.h)
    def frame(self, zoom=1.05, cx=0.5, cy=0.5, amp_x=0.0, amp_y=0.0):
        s = self.base * zoom; sw, sh = math.ceil(self.w * s), math.ceil(self.h * s)
        im = self.im.resize((sw, sh), Image.LANCZOS)
        x = int(min(max(cx * sw - W / 2, 0), sw - W)); y = int(min(max(cy * sh - H / 2, 0), sh - H))
        return im.crop((x, y, x + W, y + H)).filter(ImageFilter.UnsharpMask(radius=2.0, percent=70, threshold=2))

class CamDepth:
    """Backward-warped 2.5D camera: pixels shift by depth as the camera moves."""
    def __init__(self, path, depth):
        import torch
        self.torch = torch; self.dev = torch.device("mps" if torch.backends.mps.is_available() else ("cuda" if torch.cuda.is_available() else "cpu"))
        im = Image.open(path).convert("RGB"); self.w, self.h = im.size
        self.img = (torch.from_numpy(np.ascontiguousarray(np.asarray(im))).float().permute(2, 0, 1)[None] / 255).to(self.dev)
        dp = Image.open(depth).convert("L").resize(im.size).filter(ImageFilter.GaussianBlur(1.5))
        self.dep = (torch.from_numpy(np.ascontiguousarray(np.asarray(dp))).float()[None, None] / 255).to(self.dev)
        ys, xs = torch.meshgrid(torch.arange(H, device=self.dev, dtype=torch.float32), torch.arange(W, device=self.dev, dtype=torch.float32), indexing="ij")
        self.xs, self.ys = xs, ys; self.base = max(W / self.w, H / self.h)
    def frame(self, zoom=1.05, cx=0.5, cy=0.5, amp_x=0.0, amp_y=0.0):
        torch = self.torch; F = torch.nn.functional
        scale = self.base * zoom; hw = (W / 2) / scale / self.w; hh = (H / 2) / scale / self.h
        cx = min(max(cx, hw + 0.002), 1 - hw - 0.002); cy = min(max(cy, hh + 0.002), 1 - hh - 0.002)
        sx = cx * self.w + (self.xs - W / 2) / scale; sy = cy * self.h + (self.ys - H / 2) / scale
        if amp_x or amp_y:
            grid = torch.stack([sx / (self.w - 1) * 2 - 1, sy / (self.h - 1) * 2 - 1], -1)[None]
            d = F.grid_sample(self.dep, grid, mode="bilinear", padding_mode="border", align_corners=True)[0, 0]
            sx = sx + (d - 0.5) * amp_x / scale; sy = sy + (d - 0.5) * amp_y / scale
        grid = torch.stack([sx / (self.w - 1) * 2 - 1, sy / (self.h - 1) * 2 - 1], -1)[None]
        out = F.grid_sample(self.img, grid, mode="bilinear", padding_mode="border", align_corners=True)[0]
        arr = (out.clamp(0, 1) * 255).permute(1, 2, 0).to(torch.uint8).cpu().numpy()
        return Image.fromarray(arr).filter(ImageFilter.UnsharpMask(radius=2.0, percent=70, threshold=2))

# ------------------------------------------------------------------ tiny 3D
class Camera:
    def __init__(self, eye, target, fov_deg=42.0, up=(0, 0, 1)):
        self.eye = np.asarray(eye, float); f = np.asarray(target, float) - self.eye; f /= np.linalg.norm(f)
        r = np.cross(f, np.asarray(up, float)); r /= np.linalg.norm(r); u = np.cross(r, f)
        self.R = np.stack([r, u, f]); self.fl = (H / 2) / math.tan(math.radians(fov_deg) / 2)
    def project(self, pts):
        p = (np.asarray(pts, float) - self.eye) @ self.R.T; z = np.maximum(p[:, 2], 1e-3)
        return np.stack([W / 2 + self.fl * p[:, 0] / z, H / 2 - self.fl * p[:, 1] / z], 1)

def orbit_cam(cx, cy, el_deg, az_deg, dist, fov, target_dy=0.0):
    """Plan px (x, y) live in world as (x, -y, z); camera on the near side looking toward +Y."""
    el, az = math.radians(el_deg), math.radians(az_deg)
    eye = (cx + dist * math.cos(el) * math.sin(az), -cy - dist * math.cos(el) * math.cos(az), dist * math.sin(el))
    return Camera(eye, (cx, -cy + target_dy, 0), fov)

def quad(x0, y0, x1, y1, z): return [(x0, -y0, z), (x1, -y0, z), (x1, -y1, z), (x0, -y1, z)]

def plane_to_frame(tex, corners_world, cam):
    dst = cam.project(corners_world)
    coeffs = find_coeffs([tuple(p) for p in dst], [(0, 0), (tex.width, 0), (tex.width, tex.height), (0, tex.height)])
    return tex.transform((W, H), Image.PERSPECTIVE, coeffs, Image.BICUBIC)

def glow_lines(segments, color, width=2, blur=9, alpha=255):
    line = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(line)
    for a, b in segments: d.line([tuple(a), tuple(b)], fill=color + (alpha,), width=width)
    glow = line.filter(ImageFilter.GaussianBlur(blur)); glow.putalpha(glow.getchannel("A").point(lambda v: min(255, int(v * 2.2))))
    return line, glow

def scanlines(frame, alpha=30):
    sl = Image.new("RGBA", (W, H), (0, 0, 0, 0)); sd = ImageDraw.Draw(sl)
    for y in range(0, H, 4): sd.line([(0, y), (W, y)], fill=(0, 0, 0, alpha))
    frame.alpha_composite(sl)

def caption(frame, small, big, small_color, big_color, a, box_color=None):
    layer = Image.new("RGBA", (W, H), (0, 0, 0, 0)); ld = ImageDraw.Draw(layer)
    fs = font(26, "SemiBold"); sw = ld.textlength(small, font=fs); ld.text(((W - sw) / 2, 1620), small, font=fs, fill=small_color + (int(255 * a),))
    f = font(30, "Medium"); tw = ld.textlength(big, font=f)
    if box_color: ld.rounded_rectangle(((W - tw) / 2 - 28, 1668, (W + tw) / 2 + 28, 1740), 8, fill=box_color + (int(200 * a),))
    ld.text(((W - tw) / 2, 1687), big, font=f, fill=big_color + (int(255 * a),))
    frame.alpha_composite(layer)

# ------------------------------------------------------------------ scene: blueprint (walls rise)
def _widest_gap(occ, lo, hi, min_gap):
    """Centre of the widest run of empty columns/rows within [lo, hi) of `occ`, if it is at least min_gap long."""
    best, run_start, i = None, None, lo
    for i in range(lo, hi):
        if occ[i] == 0:
            if run_start is None: run_start = i
        elif run_start is not None:
            if i - run_start >= min_gap and (best is None or i - run_start > best[1] - best[0]): best = (run_start, i)
            run_start = None
    if run_start is not None and hi - run_start >= min_gap and (best is None or hi - run_start > best[1] - best[0]): best = (run_start, hi)
    return None if best is None else (best[0] + best[1]) // 2

def plan_crop_box(im):
    """Bounding box of the ground-floor drawing. Take the leftmost large ink blob; if it still spans two
    floors side by side, cut at the widest vertical gap; drop a title band above the drawing; tighten."""
    g = np.asarray(ImageOps.autocontrast(im.convert("L"))); content = g < 235
    small = ndimage.binary_closing(content[::4, ::4], structure=np.ones((3, 3)), iterations=1)
    lab, n = ndimage.label(small)
    if n == 0: return (0, 0, im.width, im.height)
    sizes = ndimage.sum(small, lab, range(1, n + 1)); big = [i + 1 for i, s in enumerate(sizes) if s > 0.04 * small.size] or [int(np.argmax(sizes)) + 1]
    boxes = []
    for i in big:
        ys, xs = np.nonzero(lab == i); boxes.append((xs.min() * 4, ys.min() * 4, xs.max() * 4 + 4, ys.max() * 4 + 4))
    x0, y0, x1, y1 = sorted(boxes, key=lambda b: b[0])[0]
    sub = content[y0:y1, x0:x1]
    cut = _widest_gap(sub.sum(0), int(sub.shape[1] * 0.25), int(sub.shape[1] * 0.75), 30)   # two floors side by side
    if cut is not None: x1 = x0 + cut; sub = content[y0:y1, x0:x1]
    band = _widest_gap(sub.sum(1), 0, int(sub.shape[0] * 0.35), 12)                          # title above the plan
    if band is not None: y0 = y0 + band; sub = content[y0:y1, x0:x1]
    ys, xs = np.nonzero(sub)
    if len(xs): x0, y0, x1, y1 = x0 + xs.min(), y0 + ys.min(), x0 + xs.max() + 1, y0 + ys.max() + 1
    pad = 14
    return (max(0, x0 - pad), max(0, y0 - pad), min(im.width, x1 + pad), min(im.height, y1 + pad))

def blueprint_assets(path, crop=None):
    src = Image.open(path).convert("RGB"); box = tuple(crop) if crop else plan_crop_box(src)
    fp = ImageOps.autocontrast(src.convert("L"))
    ink = ImageChops.lighter(fp.point(lambda v: 255 if v < 110 else 0), fp.point(lambda v: 150 if 110 <= v < 205 else 0))
    glow = ink.filter(ImageFilter.GaussianBlur(7))
    paper = Image.new("RGB", fp.size, (10, 46, 112)); d = ImageDraw.Draw(paper)
    for x in range(0, fp.width, 40): d.line([(x, 0), (x, fp.height)], fill=(17, 58, 132))
    for y in range(0, fp.height, 40): d.line([(0, y), (fp.width, y)], fill=(17, 58, 132))
    paper = Image.composite(Image.new("RGB", fp.size, (120, 200, 255)), paper, glow.point(lambda v: int(v * 0.55)))
    paper = Image.composite(Image.new("RGB", fp.size, (236, 246, 255)), paper, ink).crop(box).convert("RGBA")
    # walls = thick, darker strokes (v < 0.7); thin lines, text and pastel room fills drop out
    hsv = np.asarray(src.crop(box).convert("HSV")).astype(float) / 255
    walls = ndimage.binary_opening(hsv[..., 2] < 0.70, iterations=1)
    lab, n = ndimage.label(walls)
    if n:
        sizes = ndimage.sum(walls, lab, range(1, n + 1)); walls &= np.isin(lab, [i + 1 for i, s in enumerate(sizes) if s >= 150])
    mask = Image.fromarray((walls * 255).astype(np.uint8))
    wall_tex = Image.new("RGBA", paper.size, (0, 0, 0, 0)); wall_tex.paste((190, 236, 255, 255), mask=mask)
    top_tex = Image.new("RGBA", paper.size, (0, 0, 0, 0)); top_tex.paste((240, 252, 255, 255), mask=mask)
    print(f"[blueprint] crop={box} wall px={int(walls.sum())}", flush=True)
    return paper, wall_tex, top_tex, paper.size, bool(walls.sum() > 200)

def render_blueprint(t, dur, assets, cap):
    paper, wall_tex, top_tex, (tw, th), has_walls = assets
    cx, cy = tw / 2, th / 2
    tilt = 88 - 42 * ease_io(clamp((t - 0.6) / 2.4)); az = -12 + 30 * ease_io(clamp(t / dur)); dist = max(tw, th) * 1.65 - max(tw, th) * 0.19 * ease_io(clamp(t / dur))
    cam = orbit_cam(cx, cy, tilt, az, dist, 40, target_dy=-th * 0.015)
    frame = Image.new("RGBA", (W, H), (6, 24, 62, 255)); frame.alpha_composite(plane_to_frame(paper, quad(0, 0, tw, th, 0), cam))
    hgt = max(tw, th) * 0.095 * ease(clamp((t - 0.9) / 1.6))
    if has_walls and hgt > 0.5:
        side = wall_tex.copy(); side.putalpha(side.getchannel("A").point(lambda v: int(v * 0.30)))
        for k in range(1, 14): frame.alpha_composite(plane_to_frame(side, quad(0, 0, tw, th, hgt * k / 14), cam))
        top = plane_to_frame(top_tex, quad(0, 0, tw, th, hgt), cam)
        gl = top.filter(ImageFilter.GaussianBlur(7)); gl.putalpha(gl.getchannel("A").point(lambda v: min(255, int(v * 1.8))))
        frame.alpha_composite(gl); frame.alpha_composite(top)
    frame.alpha_composite(vignette())
    caption(frame, "THE PLAN", cap, (120, 200, 255), (200, 232, 255), clamp((t - 1.0) / 0.6), box_color=(4, 22, 60))
    return frame.convert("RGB")

# ------------------------------------------------------------------ scene: site (lots extrude)
def site_crop_box(im):
    """The site = bounding box of the largest grey (road) network; legends outside it drop away."""
    hsv = np.asarray(im.convert("HSV")).astype(float) / 255; s, v = hsv[..., 1], hsv[..., 2]
    road = ((s < 0.15) & (v > 0.28) & (v < 0.78))[::2, ::2]
    lab, n = ndimage.label(road)
    if n:
        sizes = ndimage.sum(road, lab, range(1, n + 1)); i = int(np.argmax(sizes)) + 1
        if sizes[i - 1] > 0.005 * road.size:
            ys, xs = np.nonzero(lab == i); pad = 8
            return (max(0, xs.min() * 2 - pad), max(0, ys.min() * 2 - pad), min(im.width, xs.max() * 2 + pad), min(im.height, ys.max() * 2 + pad))
    g = np.asarray(im.convert("L")); ys, xs = np.nonzero(g < 235)
    return (xs.min(), ys.min(), xs.max() + 1, ys.max() + 1) if len(xs) else (0, 0, im.width, im.height)

def site_assets(path, crop=None):
    src = Image.open(path).convert("RGB"); box = tuple(crop) if crop else site_crop_box(src); rgb = src.crop(box)
    big = rgb.resize((rgb.width * 3, rgb.height * 3), Image.LANCZOS)
    hsv = np.asarray(big.convert("HSV")).astype(float) / 255; hh, ss, vv = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    lots = ndimage.binary_erosion((ss > 0.10) & (vv > 0.45) & ~((hh > 0.19) & (hh < 0.72)), iterations=1)  # skip greens (gardens) and blues (pools)
    lab, n = ndimage.label(lots); boxes = []
    for i in range(1, n + 1):
        ys, xs = np.nonzero(lab == i)
        if not (300 <= len(xs) <= 9000): continue
        P = np.stack([xs, ys], 1).astype(float) / 3.0; c = P.mean(0)
        _, _, vt = np.linalg.svd(P - c, full_matrices=False); q = (P - c) @ vt.T
        e0, e1, f0, f1 = q[:, 0].min(), q[:, 0].max(), q[:, 1].min(), q[:, 1].max()
        boxes.append((np.asarray([c + e0 * vt[0] + f0 * vt[1], c + e1 * vt[0] + f0 * vt[1], c + e1 * vt[0] + f1 * vt[1], c + e0 * vt[0] + f1 * vt[1]]), c))
    boxes.sort(key=lambda b: (b[1][1], b[1][0]))
    # ground texture: glowing edges + faint fills of the plan on a grid, in a square plan-space canvas
    bp = ImageOps.autocontrast(rgb.convert("L"))
    edges = bp.filter(ImageFilter.FIND_EDGES).point(lambda v: 255 if v > 28 else 0).filter(ImageFilter.MaxFilter(3)); body = bp.point(lambda v: 255 if v < 244 else 0)
    S = 1400; scale = 1080 / bp.width; pw, ph = int(bp.width * scale), int(bp.height * scale); ox, oy = (S - pw) // 2, (S - ph) // 2
    e = edges.resize((pw, ph), Image.LANCZOS); b = body.resize((pw, ph), Image.LANCZOS)
    tex = Image.new("RGBA", (S, S), (0, 0, 0, 0)); gd = ImageDraw.Draw(tex)
    for k in range(0, S + 1, 70): gd.line([(k, 0), (k, S)], fill=CYAN + (34,)); gd.line([(0, k), (S, k)], fill=CYAN + (34,))
    fill = Image.new("RGBA", (S, S), (0, 0, 0, 0)); fill.paste(Image.new("RGBA", (pw, ph), CYAN + (36,)), (ox, oy), b); tex.alpha_composite(fill)
    glow = Image.new("RGBA", (S, S), (0, 0, 0, 0)); glow.paste(Image.new("RGBA", (pw, ph), CYAN + (255,)), (ox, oy), e.filter(ImageFilter.GaussianBlur(10)).point(lambda v: min(255, v * 2))); tex.alpha_composite(glow)
    line = Image.new("RGBA", (S, S), (0, 0, 0, 0)); line.paste(Image.new("RGBA", (pw, ph), (190, 250, 255, 255)), (ox, oy), e); tex.alpha_composite(line)
    tex.putalpha(tex.getchannel("A").point(lambda v: int(v * 0.72)))
    print(f"[site] crop={box} lots={len(boxes)}", flush=True)
    return boxes, tex, (S, scale, ox, oy), rgb.size

def render_site(t, dur, assets, cap):
    boxes, tex, (S, scale, ox, oy), (bw, bh) = assets; cx, cy = bw / 2, bh / 2
    el = 62 - 17 * ease_io(clamp(t / dur)); az = -26 + 46 * ease_io(clamp(t / dur)); dist = bw * 2.2 - bw * 0.5 * ease_io(clamp(t / dur))
    cam = orbit_cam(cx, cy, el, az, dist, 44, target_dy=bh * 0.013)
    frame = Image.new("RGBA", (W, H), (7, 10, 20, 255))
    x0, y0 = -ox / scale, -oy / scale; x1, y1 = x0 + S / scale, y0 + S / scale
    build = clamp(t / 1.2); tex_now = tex
    if build < 1:
        m = Image.new("L", tex.size, 0); ImageDraw.Draw(m).rectangle((0, 0, S, int(S * ease(build))), fill=255)
        tex_now = tex.copy(); tex_now.putalpha(Image.fromarray(np.minimum(np.asarray(tex.getchannel("A")), np.asarray(m))))
    frame.alpha_composite(plane_to_frame(tex_now, quad(x0, y0, x1, y1, 0), cam))
    n = len(boxes); eye = np.asarray(cam.eye); live = []
    for i, (corners, c) in enumerate(boxes):
        t0 = 1.0 + 1.6 * (i / max(1, n - 1)); hgt = bw * 0.045 * ease(clamp((t - t0) / 0.7))
        if hgt > 0.3: live.append((np.linalg.norm(np.array([c[0], -c[1], 0]) - eye), corners, hgt))
    if live:
        live.sort(key=lambda b: -b[0]); fills = Image.new("RGBA", (W, H), (0, 0, 0, 0)); fd = ImageDraw.Draw(fills); segs_v, segs_top = [], []
        for _, corners, hgt in live:
            wc = np.c_[corners[:, 0], -corners[:, 1]]; base = cam.project(np.c_[wc, np.zeros(4)]); top = cam.project(np.c_[wc, np.full(4, hgt)])
            for k in range(4): fd.polygon([tuple(base[k]), tuple(base[(k + 1) % 4]), tuple(top[(k + 1) % 4]), tuple(top[k])], fill=CYAN + (34,))
            fd.polygon([tuple(p) for p in top], fill=(120, 245, 255, 105))
            for k in range(4): segs_v.append((tuple(base[k]), tuple(top[k]))); segs_top.append((tuple(top[k]), tuple(top[(k + 1) % 4])))
        frame.alpha_composite(fills)
        lv, gv = glow_lines(segs_v, CYAN, 1, 5, 150); lt, gt = glow_lines(segs_top, (215, 252, 255), 2, 8, 255)
        frame.alpha_composite(gv); frame.alpha_composite(gt); frame.alpha_composite(lv); frame.alpha_composite(lt)
    scanlines(frame); frame.alpha_composite(vignette())
    caption(frame, "THE SITE", cap, CYAN, (200, 240, 255), clamp((t - 1.0) / 0.6))
    return frame.convert("RGB")

# ------------------------------------------------------------------ photos + titles
def title3d(frame, text, style, t_in, t_out, t):
    a = clamp((t - t_in) / 0.9) * clamp((t_out - t) / 0.7)
    if a <= 0: return
    k = 1 - ease(clamp((t - t_in) / 1.1))
    if style == "caps": f, y, text = font(46, "Medium"), 930, "  ".join(text)
    elif style == "light": f, y = font(60, "Light"), 1560
    else: f, y = font(40, "SemiBold"), 1690
    tmp = Image.new("RGBA", (W, 160), (0, 0, 0, 0)); d = ImageDraw.Draw(tmp); tw = d.textlength(text, font=f)
    if tw > W - 80:  # long line: shrink to fit
        f = font(int(f.size * (W - 80) / tw), "Light" if style == "light" else "Medium"); tw = d.textlength(text, font=f)
    x = (W - tw) / 2
    d.text((x + 2, 43), text, font=f, fill=(0, 0, 0, int(150 * a))); d.text((x, 40), text, font=f, fill=WHITE + (int(255 * a),))
    sq = 0.55 * k
    dst = [(W * 0.5 * sq, 40 * sq), (W - W * 0.02 * k, -30 * k), (W - W * 0.02 * k, 160 + 30 * k), (W * 0.5 * sq, 160 - 40 * sq)]
    frame.alpha_composite(tmp.transform((W, 160), Image.PERSPECTIVE, find_coeffs(dst, [(0, 0), (W, 0), (W, 160), (0, 160)]), Image.BICUBIC), (0, y - 40))
    if style == "caps": ImageDraw.Draw(frame).rounded_rectangle(((W - 90) / 2, y + 78, (W + 90) / 2, y + 82), 2, fill=ORANGE + (int(255 * a),))

MOVES = {
    "rise":    lambda e: (1.18 - 0.18 * e, 0.5, 0.60 - 0.10 * e, 18 * (2 * e - 1), 46 * (1 - e) - 10),
    "orbit_r": lambda e: (1.05 + 0.06 * e, 0.45 + 0.10 * e, 0.5, 78 * (2 * e - 1), 10 * (2 * e - 1)),
    "orbit_l": lambda e: (1.05 + 0.06 * e, 0.55 - 0.10 * e, 0.5, -78 * (2 * e - 1), -10 * (2 * e - 1)),
    "push":    lambda e: (1.02 + 0.11 * e, 0.5, 0.5, 34 * (2 * e - 1), -16 * e),
    "pull":    lambda e: (1.12 - 0.09 * e, 0.5, 0.5, -30 * (2 * e - 1), 12 * e),
}

def render_photo(cam, t, dur, move, txt):
    z, cx, cy, ax, ay = MOVES[move](ease_io(t / dur)); frame = grade(cam.frame(z, cx, cy, ax, ay))
    if txt and txt[1] in ("light", "url"): bottom_shade(frame)
    if txt: title3d(frame, txt[0], txt[1], txt[2], txt[3], t)
    return frame.convert("RGB")

def render_end(t, spec):
    frame = Image.new("RGBA", (W, H), DARK + (255,)); d = ImageDraw.Draw(frame)
    a1, a2, a3 = ease(clamp((t - 0.2) / 0.8)), ease(clamp((t - 0.9) / 0.8)), ease(clamp((t - 1.5) / 0.8))
    wm = font(96, "Bold")
    for i, line in enumerate(["Lanka", "NewHomes"]):
        tw = d.textlength(line, font=wm); d.text(((W - tw) / 2, 760 + i * 100 + int((1 - a1) * 20)), line, font=wm, fill=WHITE + (int(255 * a1),))
    d.rounded_rectangle(((W - int(120 * a2)) / 2, 985, (W + int(120 * a2)) / 2, 990), 2, fill=ORANGE + (255,))
    for text, f, y, a, color in ((spec.get("ctaLine", "Explore the project  →"), font(40, "Light"), 1040, a2, (220, 220, 226)),
                                  (spec.get("brand", "LankaNewHomes.com"), font(46, "SemiBold"), 1110, a3, WHITE),
                                  (spec.get("siteLine", "New homes · Apartments · Land — across Sri Lanka"), font(28, "Regular"), 1200, a3, (150, 150, 158))):
        tw = d.textlength(text, font=f); d.text(((W - tw) / 2, y + int((1 - a) * 16)), text, font=f, fill=color + (int(255 * a),))
    return frame.convert("RGB")

# ------------------------------------------------------------------ reel timeline
def build_reel(spec, out, use_depth):
    photos = spec["photos"]; aerial_i = spec.get("aerial")
    aerial = photos[aerial_i] if aerial_i is not None and 0 <= aerial_i < len(photos) else photos[0]
    walk = [p for p in photos if p is not aerial][:7]
    depth = compute_depth_maps([aerial["path"]] + [p["path"] for p in walk], os.path.join(out, "depth")) if use_depth else {}
    def cam_for(p): return CamDepth(p["path"], depth[p["path"]]) if p["path"] in depth else CamPIL(p["path"])
    seq = []
    if spec.get("floorPlan"): seq.append(("blueprint", 4.2))
    if spec.get("blockPlan"): seq.append(("site", 4.4))
    seq.append(("photo", 3.8, aerial, "rise", (spec.get("topLine", "NEW HOMES IN SRI LANKA"), "caps", 0.8, 3.5)))
    moves = ["orbit_r", "orbit_l", "push", "orbit_r", "orbit_l", "push", "pull"]
    for i, p in enumerate(walk):
        txt = None
        if i == 1: txt = (spec.get("subLine", "Discover New Developer Projects"), "light", 0.4, 2.8)
        if i == len(walk) - 2 and len(walk) >= 3: txt = (spec.get("brand", "LankaNewHomes.com"), "url", 0.4, 2.9)
        seq.append(("photo", 3.0 if txt else 2.7, p, moves[i % len(moves)], txt))
    seq.append(("end", 3.6))
    frames_dir = os.path.join(out, "frames"); shutil.rmtree(frames_dir, ignore_errors=True); os.makedirs(frames_dir)
    n = 0
    def emit(img):
        nonlocal n; img.save(os.path.join(frames_dir, f"f_{n:05d}.jpg"), quality=93); n += 1
    bp = blueprint_assets(spec["floorPlan"]["path"], spec["floorPlan"].get("crop")) if spec.get("floorPlan") else None
    site = site_assets(spec["blockPlan"]["path"], spec["blockPlan"].get("crop")) if spec.get("blockPlan") else None
    prev_tail, prev_kind = [], None; poster = None
    for i, item in enumerate(seq):
        kind, dur = item[0], item[1]; nf = int(dur * FPS)
        if kind == "blueprint": frames = [render_blueprint(k / FPS, dur, bp, spec["floorPlan"].get("caption", "")) for k in range(nf)]
        elif kind == "site": frames = [render_site(k / FPS, dur, site, spec["blockPlan"].get("caption", "")) for k in range(nf)]
        elif kind == "end": frames = [render_end(k / FPS, spec) for k in range(nf)]
        else:
            cam = cam_for(item[2]); frames = [render_photo(cam, k / FPS, dur, item[3], item[4]) for k in range(nf)]
            if item[2] is aerial: poster = frames[int(1.6 * FPS)]
        xf_in = int((1.0 if prev_kind == "site" and kind == "photo" else 0.5) * FPS) if prev_tail else 0
        for k in range(xf_in): emit(Image.blend(prev_tail[k], frames[k], ease_io((k + 1) / (xf_in + 1))))
        nxt = seq[i + 1][0] if i + 1 < len(seq) else None
        tail = int((1.0 if kind == "site" and nxt == "photo" else 0.5) * FPS) if nxt else 0
        for f in frames[xf_in:nf - tail]: emit(f)
        prev_tail = frames[nf - tail:] if tail else []; prev_kind = kind
        print(f"[reel] {i + 1}/{len(seq)} {kind}", flush=True)
    (poster or frames[0]).save(os.path.join(out, "poster.jpg"), quality=92)
    mp4 = os.path.join(out, "reel.mp4")
    subprocess.check_call([ffmpeg(), "-y", "-loglevel", "error", "-framerate", str(FPS), "-i", os.path.join(frames_dir, "f_%05d.jpg"),
                           "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "3500k", "-bufsize", "7000k", "-pix_fmt", "yuv420p", "-movflags", "+faststart", mp4])
    shutil.rmtree(frames_dir, ignore_errors=True)
    print(f"[reel] {n / FPS:.1f}s -> {mp4} ({os.path.getsize(mp4) // 1024} KB)", flush=True)
    return mp4, n / FPS

def ffmpeg():
    for cand in (os.environ.get("FFMPEG_PATH"), shutil.which("ffmpeg")):
        if cand and os.path.exists(cand): return cand
    try:
        p = subprocess.check_output(["node", "-e", "console.log(require('ffmpeg-static'))"], stderr=subprocess.DEVNULL).decode().strip()
        if p and os.path.exists(p): return p
    except Exception: pass
    sys.exit("ffmpeg not found — set FFMPEG_PATH, `brew install ffmpeg`, or `npm i --no-save ffmpeg-static`")

# ------------------------------------------------------------------ carousel cards (4:5)
def cover(img, w, h):
    s = max(w / img.width, h / img.height); im = img.resize((math.ceil(img.width * s), math.ceil(img.height * s)), Image.LANCZOS)
    x, y = (im.width - w) // 2, (im.height - h) // 2; return im.crop((x, y, x + w, y + h))

def card_base(photo):
    src = Image.open(photo).convert("RGB")
    bg = cover(src, CARD_W, CARD_H).filter(ImageFilter.GaussianBlur(40)); bg = Image.blend(bg, Image.new("RGB", (CARD_W, CARD_H), (12, 12, 16)), 0.5)
    frame = bg.convert("RGBA"); cw = 1000; ch = int(cw * min(src.height / src.width, 0.8)); cx, cy = (CARD_W - cw) // 2, (CARD_H - ch) // 2 - 70
    shadow = Image.new("RGBA", (CARD_W, CARD_H), (0, 0, 0, 0)); ImageDraw.Draw(shadow).rounded_rectangle((cx, cy + 18, cx + cw, cy + ch + 18), 28, fill=(0, 0, 0, 150))
    frame.alpha_composite(shadow.filter(ImageFilter.GaussianBlur(28)))
    m = Image.new("L", (cw, ch), 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, cw - 1, ch - 1), 28, fill=255)
    frame.paste(cover(src, cw, ch), (cx, cy), m)
    return frame, cy + ch

def chrome(d, status, brand):
    pf = font(28, "Bold"); tw = d.textlength(status, font=pf)
    d.rounded_rectangle((60, 60, 60 + tw + 44, 118), 29, fill=ORANGE + (255,)); d.text((82, 73), status, font=pf, fill=WHITE + (255,))
    sf = font(28, "SemiBold"); sw = d.textlength(brand, font=sf); d.text((CARD_W - 60 - sw, 74), brand, font=sf, fill=WHITE + (255,))

def build_cards(spec, out):
    photos = spec["photos"][:8]; status = (spec.get("status") or "NOW SELLING").upper(); brand = spec.get("brandDomain", "lankanewhomes.com"); paths = []
    for i, p in enumerate(photos):
        frame, below = card_base(p["path"]); d = ImageDraw.Draw(frame); chrome(d, status, brand); y = below + 56
        if i == 0:
            hf = font(64 if len(spec["name"]) <= 22 else 50, "Bold"); d.text((60, y), spec["name"], font=hf, fill=WHITE + (255,)); y += hf.size + 12
            d.rounded_rectangle((60, y + 8, 132, y + 14), 3, fill=ORANGE + (255,)); y += 30
            city = spec.get("city") if spec.get("city") and spec["city"].lower() not in spec["name"].lower() else None
            sub = " · ".join(x for x in [city, spec.get("developer") and f"by {spec['developer']}"] if x)
            d.text((60, y), sub, font=font(34, "Regular"), fill=MUTED + (255,)); y += 52
            if spec.get("typeLine"): d.text((60, y), spec["typeLine"], font=font(34, "SemiBold"), fill=WHITE + (255,)); y += 48
            if spec.get("priceLine"): d.text((60, y), spec["priceLine"], font=font(40, "Bold"), fill=ORANGE + (255,))
        else:
            label = (p.get("label") or "").strip()
            if label and not label.lower().startswith("photo"):
                d.text((60, y), label, font=font(40, "SemiBold"), fill=WHITE + (255,)); y += 56
            d.text((60, y), spec["name"], font=font(30, "Regular"), fill=MUTED + (255,))
        path = os.path.join(out, f"card-{i + 1:02d}.jpg"); frame.convert("RGB").save(path, quality=92); paths.append(path)
    # closing CTA card
    frame = Image.new("RGB", (CARD_W, CARD_H), DARK); d = ImageDraw.Draw(frame); wm = font(110, "Bold")
    d.text((60, 470), "Lanka", font=wm, fill=WHITE); d.text((60, 590), "NewHomes", font=wm, fill=WHITE); d.rounded_rectangle((60, 740, 180, 748), 4, fill=ORANGE)
    d.text((60, 790), "Floor plans · Pricing · Brochure", font=font(38, "Regular"), fill=MUTED)
    d.text((60, 850), spec["name"] + (f" — {spec['city']}" if spec.get("city") and spec["city"].lower() not in spec["name"].lower() else ""), font=font(38, "SemiBold"), fill=WHITE)
    cf = font(36, "Bold"); cta = spec.get("ctaCard", "Tap the link in bio"); tw = d.textlength(cta, font=cf)
    d.rounded_rectangle((60, 960, 60 + tw + 80, 1052), 46, fill=ORANGE); d.text((100, 983), cta, font=cf, fill=WHITE)
    d.text((60, 1110), spec.get("url", brand), font=font(28, "Regular"), fill=MUTED)
    path = os.path.join(out, f"card-{len(photos) + 1:02d}.jpg"); frame.save(path, quality=92); paths.append(path)
    print(f"[cards] {len(paths)} cards", flush=True)
    return paths

# ------------------------------------------------------------------ main
def main():
    ap = argparse.ArgumentParser(); ap.add_argument("--spec", required=True); ap.add_argument("--out", required=True)
    ap.add_argument("--no-depth", action="store_true"); ap.add_argument("--skip-reel", action="store_true"); ap.add_argument("--skip-cards", action="store_true")
    args = ap.parse_args()
    spec = json.load(open(args.spec)); os.makedirs(args.out, exist_ok=True)
    if not spec.get("photos"): sys.exit("spec has no photos")
    manifest = {"reel": None, "poster": None, "cards": [], "durationSec": None}
    if not args.skip_cards: manifest["cards"] = build_cards(spec, args.out)
    if not args.skip_reel:
        manifest["reel"], manifest["durationSec"] = build_reel(spec, args.out, use_depth=not args.no_depth); manifest["poster"] = os.path.join(args.out, "poster.jpg")
    json.dump(manifest, open(os.path.join(args.out, "manifest.json"), "w"), indent=1)
    print(json.dumps(manifest))

if __name__ == "__main__":
    main()
