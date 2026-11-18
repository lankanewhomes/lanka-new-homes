"""Small frame-by-frame reel engine (Pillow + ffmpeg) for the LankaNewHomes interactive reels.

1080x1920, 30 fps. House rules built in: sharp photo window over a blurred copy (grid lines on the blurred top and bottom
bands), white logo top-left inside the safe area, orange accent with dark ink for projects, green with white for land,
no developer names, link only on the end card with a small black LINK IN BIO button.
"""
import math, subprocess
from PIL import Image, ImageDraw, ImageFont, ImageFilter

REPO = "/Volumes/MyStorage/LNH/lankanewhomes"
FFMPEG = f"{REPO}/.venv-social/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1"
ARCHIVO = f"{REPO}/scripts/social/assets/fonts/Archivo-VF.ttf"
LOGO_WHITE = f"{REPO}/public/brand/lankanewhomes-logo-white.png"

W, H, FPS = 1080, 1920, 30
WHITE, INK = (255, 255, 255), (31, 31, 31)
ORANGE, GREEN = (249, 153, 88), (61, 90, 53)
BAND_TOP, BAND_BOTTOM = 320, 1600


# ---------- easing ----------
def clamp(t):
    return max(0.0, min(1.0, t))


def ease_out(t):
    return 1 - (1 - clamp(t)) ** 3


def ease_in(t):
    return clamp(t) ** 3


def ease(t):
    t = clamp(t)
    return 4 * t ** 3 if t < 0.5 else 1 - (-2 * t + 2) ** 3 / 2


def back_out(t):
    t = clamp(t)
    return 1 + 2.70158 * (t - 1) ** 3 + 1.70158 * (t - 1) ** 2


# ---------- drawing helpers ----------
_fonts = {}


def font(size, weight=800, width=100):
    key = (size, weight, width)
    if key not in _fonts:
        f = ImageFont.truetype(ARCHIVO, size)
        f.set_variation_by_axes([weight, width])
        _fonts[key] = f
    return _fonts[key]


def put(frame, layer, x, y, alpha=1.0):
    """alpha_composite that accepts positions partly off the frame."""
    if alpha <= 0.004:
        return
    x, y = int(round(x)), int(round(y))
    x0, y0 = max(0, x), max(0, y)
    x1, y1 = min(frame.width, x + layer.width), min(frame.height, y + layer.height)
    if x1 <= x0 or y1 <= y0:
        return
    if (x0, y0, x1, y1) != (x, y, x + layer.width, y + layer.height):
        layer = layer.crop((x0 - x, y0 - y, x1 - x, y1 - y))
    if alpha < 0.996:
        layer = layer.copy()
        layer.putalpha(layer.getchannel("A").point(lambda v: int(v * alpha)))
    frame.alpha_composite(layer, (x0, y0))


def dim(frame, alpha, color=(8, 12, 16)):
    if alpha > 0:
        frame.alpha_composite(Image.new("RGBA", frame.size, color + (int(255 * alpha),)))


_text_cache = {}


def text_img(text, size, color=WHITE, weight=800, width=100, box=None, box_pad=(34, 18), shadow=True, tracking=0):
    """One line of text as an RGBA image. `box` = fill colour of a label bar behind it."""
    key = (text, size, color, weight, width, box, box_pad, shadow, tracking)
    if key in _text_cache:
        return _text_cache[key]
    f = font(size, weight, width)
    ascent, descent = f.getmetrics()
    tw = int(sum(f.getlength(ch) + tracking for ch in text)) if tracking else int(f.getlength(text))
    if box:
        px, py = box_pad
        img = Image.new("RGBA", (tw + px * 2, ascent + descent + py * 2), box + (255,))
        ox, oy = px, py
    else:
        m = 40
        img = Image.new("RGBA", (tw + m * 2, ascent + descent + m * 2), (0, 0, 0, 0))
        ox, oy = m, m
    d = ImageDraw.Draw(img)

    def draw_text(target, fill):
        if tracking:
            x = ox
            for ch in text:
                target.text((x, oy), ch, font=f, fill=fill)
                x += f.getlength(ch) + tracking
        else:
            target.text((ox, oy), text, font=f, fill=fill)

    if shadow and not box:
        sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
        draw_text(ImageDraw.Draw(sh), (0, 0, 0, 215))
        sh = sh.filter(ImageFilter.GaussianBlur(max(5, size // 9)))
        img.alpha_composite(sh)
        img.alpha_composite(sh)
        d = ImageDraw.Draw(img)
    draw_text(d, color + (255,))
    _text_cache[key] = img
    return img


def anim_state(kind, u):
    """(alpha, dx, dy, scale) for an entrance animation at progress u (0..1)."""
    if u <= 0:
        return 0.0, 0, 0, 1.0
    if kind == "pop":
        return clamp(u * 3), 0, 0, 0.55 + 0.45 * back_out(u)
    if kind == "rise":
        return ease_out(u), 0, (1 - ease_out(u)) * 70, 1.0
    if kind == "drop":
        return ease_out(u), 0, -(1 - back_out(u)) * 120, 1.0
    if kind == "left":
        return ease_out(u), -(1 - ease_out(u)) * 260, 0, 1.0
    if kind == "right":
        return ease_out(u), (1 - ease_out(u)) * 260, 0, 1.0
    if kind == "stamp":
        return clamp(u * 2.5), 0, 0, 2.2 - 1.2 * ease_out(u * 1.8)
    if kind == "fade":
        return ease(u), 0, 0, 1.0
    return 1.0, 0, 0, 1.0


def place(frame, layer, cx, cy, t, start=0.0, dur=0.42, kind="rise", until=None, anchor="c"):
    """Draw `layer` centred at (cx, cy) with an entrance at `start`; hidden again after `until`."""
    if t < start or (until is not None and t >= until):
        return
    alpha, dx, dy, scale = anim_state(kind, (t - start) / dur)
    if kind == "stamp":
        scale = max(1.0, scale)
    if scale != 1.0:
        layer = layer.resize((max(2, int(layer.width * scale)), max(2, int(layer.height * scale))), Image.BICUBIC)
    x = cx - layer.width / 2 if anchor == "c" else (cx if anchor == "l" else cx - layer.width)
    put(frame, layer, x + dx, cy - layer.height / 2 + dy, alpha)


def say(frame, text, cx, cy, size, t, start=0.0, kind="rise", dur=0.42, until=None, anchor="c", **style):
    place(frame, text_img(text, size, **style), cx, cy, t, start, dur, kind, until, anchor)


def typed(frame, text, cx, cy, size, t, start=0.0, cps=22, **style):
    """Typewriter: the line keeps its final position while the letters arrive."""
    if t < start:
        return
    n = min(len(text), int((t - start) * cps) + 1)
    full = text_img(text, size, **style)
    part = text_img(text[:n], size, **style)
    put(frame, part, cx - full.width / 2, cy - full.height / 2)


def ring(frame, cx, cy, r, frac, color=ORANGE, width=16, track=(255, 255, 255, 70)):
    """Countdown ring: `frac` of the circle is drawn (1 = full)."""
    s = 2
    img = Image.new("RGBA", ((r + width) * 2 * s, (r + width) * 2 * s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    box = [width * s, width * s, (2 * r + width) * s, (2 * r + width) * s]
    d.arc(box, 0, 360, fill=track, width=width * s)
    if frac > 0:
        d.arc(box, -90, -90 + 360 * frac, fill=color + (255,), width=width * s)
    img = img.resize((img.width // s, img.height // s), Image.LANCZOS)
    put(frame, img, cx - img.width / 2, cy - img.height / 2)


def bar(frame, x, y, w, h, frac, color=ORANGE, track=(255, 255, 255, 80)):
    d = ImageDraw.Draw(frame, "RGBA")
    d.rectangle([x, y, x + w, y + h], fill=track)
    if frac > 0:
        d.rectangle([x, y, x + int(w * clamp(frac)), y + h], fill=color + (255,))


def money(n):
    return f"{int(n):,}"


# ---------- photos ----------
class Photo:
    """A listing photo shown sharp in a window over a blurred, darkened copy of itself."""

    def __init__(self, path, focus=(0.5, 0.5), full=False, max_window=BAND_BOTTOM - BAND_TOP):
        src = Image.open(path).convert("RGB")
        self.focus = focus
        sw, sh = src.size
        cover = max(W / sw, H / sh)
        bg = src.resize((int(sw * cover) + 1, int(sh * cover) + 1), Image.BILINEAR)
        left = int(min(max(focus[0] * bg.width - W / 2, 0), bg.width - W))
        top = int(min(max(focus[1] * bg.height - H / 2, 0), bg.height - H))
        bg = bg.crop((left, top, left + W, top + H))
        if full:
            self.window = (0, 0, W, H)
            self.bg = None
        else:
            self.bg = Image.blend(bg.filter(ImageFilter.GaussianBlur(34)), Image.new("RGB", (W, H), (10, 14, 18)), 0.42).convert("RGBA")
            scale = max(W / sw, min(max_window / sh, 1.35))
            wh = int(min(max_window, sh * scale))
            y0 = (BAND_TOP + BAND_BOTTOM) // 2 - wh // 2
            self.window = (0, y0, W, y0 + wh)
        ww, wh = self.window[2] - self.window[0], self.window[3] - self.window[1]
        # a copy a little larger than the window, so the slow zoom has room
        k = max(ww / sw, wh / sh) * 1.12
        self.base = src.resize((int(sw * k) + 1, int(sh * k) + 1), Image.LANCZOS)

    def frame(self, progress, zoom_in=True, drift=(0.0, 0.0)):
        """Full 1080x1920 RGBA frame. `progress` 0..1 drives the slow zoom and drift."""
        ww, wh = self.window[2] - self.window[0], self.window[3] - self.window[1]
        # crop size in base pixels: 1.0 = exactly the window, 1.12 = everything the base holds
        z = (1.12 - 0.10 * progress) if zoom_in else (1.02 + 0.10 * progress)
        bw, bh = self.base.size
        cw, ch = ww * z, wh * z
        fit = min(1.0, bw / cw, bh / ch)
        cw, ch = cw * fit, ch * fit
        cx = self.focus[0] * bw + drift[0] * (progress - 0.5) * bw
        cy = self.focus[1] * bh + drift[1] * (progress - 0.5) * bh
        cx = min(max(cx, cw / 2), bw - cw / 2)
        cy = min(max(cy, ch / 2), bh - ch / 2)
        win = self.base.resize((ww, wh), Image.BILINEAR, box=(cx - cw / 2, cy - ch / 2, cx + cw / 2, cy + ch / 2))
        out = self.bg.copy() if self.bg is not None else Image.new("RGBA", (W, H), (0, 0, 0, 255))
        out.paste(win, (self.window[0], self.window[1]))
        return out


# ---------- overlay (grid bands + logo), drawn over every frame ----------
def build_overlay():
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    lines = Image.new("L", (W, H), 0)
    d = ImageDraw.Draw(lines)
    for x in range(0, W + 1, 72):
        d.line([(x, 0), (x, BAND_TOP)], fill=255, width=2)
        d.line([(x, BAND_BOTTOM), (x, H)], fill=255, width=2)
    for y in range(0, BAND_TOP + 1, 72):
        d.line([(0, y), (W, y)], fill=255, width=2)
    for y in range(BAND_BOTTOM, H + 1, 72):
        d.line([(0, y), (W, y)], fill=255, width=2)
    fade = Image.new("L", (W, H), 0)
    fp = fade.load()
    for y in range(BAND_TOP):
        v = int(150 * (1 - y / BAND_TOP) ** 0.8)
        for x in range(W):
            fp[x, y] = v
    for y in range(BAND_BOTTOM, H):
        v = int(150 * ((y - BAND_BOTTOM) / (H - BAND_BOTTOM)) ** 0.8)
        for x in range(W):
            fp[x, y] = v
    alpha = Image.composite(fade, Image.new("L", (W, H), 0), lines)
    ov.paste(Image.new("RGBA", (W, H), (255, 255, 255, 255)), (0, 0), alpha)
    logo = Image.open(LOGO_WHITE).convert("RGBA")
    logo = logo.resize((210, int(210 * logo.height / logo.width)), Image.LANCZOS)  # design system: logo x 100, y 262, 210 px wide (same as the map and bomb reels)
    shade = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(shade).ellipse([100 - 70, 262 - 50, 100 + 300, 262 + 150], fill=(0, 0, 0, 105))
    shade = shade.filter(ImageFilter.GaussianBlur(48))
    ov.alpha_composite(shade)
    ov.alpha_composite(logo, (100, 262))
    return ov


# ---------- end card ----------
def end_card(photo, title, link, question, accent=ORANGE, sub=None):
    """Listing name + link strip + small LINK IN BIO button + a question that asks for a comment."""
    def draw(t, dur):
        f = photo.frame(clamp(t / dur))
        dim(f, 0.5)
        y = 760
        for i, line in enumerate(question):
            say(f, line, W / 2, y + i * 96, 80, t, 0.1 + i * 0.12, "pop", width=80, weight=900)
        y2 = y + len(question) * 96 + 70
        say(f, title, W / 2, y2, 50, t, 0.55, "rise", box=accent, color=INK if accent == ORANGE else WHITE, weight=800)
        if sub:
            say(f, sub, W / 2, y2 + 84, 36, t, 0.7, "rise", weight=600)
        say(f, link, W / 2, y2 + (176 if sub else 104), 30, t, 0.85, "rise", box=WHITE, color=INK, weight=600, box_pad=(26, 14))
        say(f, "LINK IN BIO", W / 2, y2 + (262 if sub else 190), 25, t, 1.05, "rise", box=INK, color=WHITE, weight=700, box_pad=(22, 12))
        return f
    return draw


# ---------- engine ----------
def render(scenes, out, transition="push", tr=0.26, still=None):
    """scenes: [(duration, draw(t, duration) -> RGBA frame)]. Writes an mp4 (silent audio track) or one still frame."""
    overlay = build_overlay()
    starts, total = [], 0.0
    for dur, _ in scenes:
        starts.append(total)
        total += dur
    frames = int(round(total * FPS))

    def at(t):
        i = max(k for k, s in enumerate(starts) if t >= s - 1e-9)
        dur, draw = scenes[i]
        local = t - starts[i]
        cur = draw(local, dur)
        if i > 0 and local < tr and transition != "cut":
            pdur, pdraw = scenes[i - 1]
            prev = pdraw(pdur + local, pdur)
            e = ease(local / tr)
            if transition == "fade":
                cur = Image.blend(prev, cur, e)
            elif transition == "flash":
                cur = Image.blend(cur, Image.new("RGBA", (W, H), (255, 255, 255, 255)), 0.75 * (1 - e) ** 2)
            elif transition in ("push", "pushup"):
                canvas = Image.new("RGBA", (W, H), (0, 0, 0, 255))
                if transition == "push":
                    put(canvas, prev, -W * e, 0)
                    put(canvas, cur, W * (1 - e), 0)
                else:
                    put(canvas, prev, 0, -H * e)
                    put(canvas, cur, 0, H * (1 - e))
                cur = canvas
            elif transition == "zoom":
                z = 1 + 0.5 * e
                big = prev.resize((int(W * z), int(H * z)), Image.BILINEAR)
                big = big.crop(((big.width - W) // 2, (big.height - H) // 2, (big.width - W) // 2 + W, (big.height - H) // 2 + H))
                cur = Image.blend(big, cur, e)
        cur.alpha_composite(overlay)
        return cur.convert("RGB")

    if still is not None:
        at(still).save(out, quality=90)
        return
    proc = subprocess.Popen(
        [FFMPEG, "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(FPS), "-i", "-",
         "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100", "-shortest",
         "-c:v", "libx264", "-crf", "14", "-preset", "medium", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
         "-movflags", "+faststart", out], stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    for n in range(frames):
        proc.stdin.write(at(n / FPS).tobytes())
    proc.stdin.close()
    proc.wait()
    print(f"wrote {out}: {total:.1f}s, {frames} frames")
