"""Instagram carousel (1080x1350, 4:5) in the 2026-11-16 design system (see memory reel-design-system): Archivo, logo top-left on every slide, full-bleed photo with the
light grid fade, NO label bar. Slide 1 and the closing slide: title in bold uppercase (two lines) with the city under it in regular weight in the accent colour
(orange project, green land); the closing slide adds the FROM price block. Inner slides: a small Title Case regular accent heading above two Title Case regular lines.
Plain regular URL strip (no "link in bio"), dots + a long arrow. Every line of text comes from the listing record.

  CAROUSEL_CFG=cfg.json python3 scripts/social/carousel_v3.py OUT_DIR
cfg: {"kind": "project"|"land", "media": "/path/p%d.jpg", "title": ["STREET RUSH", "RESIDENCIES"], "city": "Mount Lavinia",
      "slides": [[photo, "Heading", ["Line one", "Line two"]], ...]   (first slide is always the title slide: give just [photo] or [photo, ...] and it is ignored),
      "end": {"photo": 4, "amount": "RS. 18M"}, "link": "www.lankanewhomes.com/projects/<slug>", "fy": {"3": 0.4}, "fx": {"3": 0.7}}  (fx/fy = crop focus per photo)
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from land_cover_v1 import font, fit, width, text_c, cover_fit, logo, INK, WHITE  # noqa
from PIL import Image, ImageDraw

C = json.load(open(os.environ['CAROUSEL_CFG']))
SW, SH, LM = 1080, 1350, 100
LAND = C.get('kind') == 'land'
BG, GRIDC = ((232, 237, 226), (205, 214, 197)) if LAND else ((238, 242, 244), (214, 220, 223))
ACC = (61, 90, 53) if LAND else (249, 153, 88)
ACC_TXT = (61, 90, 53) if LAND else (244, 123, 54)  # brand orange #f47b36 for text on the light fade (the lighter #f99958 is too faint there)
DOT_OFF = (120, 135, 120) if LAND else (120, 135, 128)
MEDIA, SLIDES, END, LINK = C['media'], C['slides'], C['end'], C['link']
BAR_Y, HEAD_Y, LISTED_Y, FOOT_Y = 944, 996, 1195, 1268


def fade_photo(photo, fy=.5, start=700, ramp=300, fade_max=185, fx=.5):
    ph = cover_fit(photo, SW, SH, fx, fy).convert('RGB')
    panel = Image.new('RGB', (SW, SH), BG); pd = ImageDraw.Draw(panel)
    for x in range(0, SW, 216): pd.line([(x, 0), (x, SH)], fill=GRIDC, width=2)
    for y in range(0, SH, 216): pd.line([(0, y), (SW, y)], fill=GRIDC, width=2)
    mask = Image.new('L', (SW, SH), 0); md = ImageDraw.Draw(mask)
    for y in range(SH): md.line([(0, y), (SW, y)], fill=int(fade_max * min(1, max(0.0, (y - start) / ramp)) ** 1.1))
    im = Image.composite(panel, ph, mask).convert('RGBA')
    top = Image.new('RGBA', (SW, 230), (0, 0, 0, 0)); td = ImageDraw.Draw(top)
    for y in range(230): td.line([(0, y), (SW, y)], fill=(6, 12, 6, int(110 * (1 - y / 230))))
    im.alpha_composite(top, (0, 0)); return im.convert('RGB')


def chrome(im, n, total):
    d = ImageDraw.Draw(im); lg = logo(True, 180); im.paste(lg, (LM, 54), lg)
    lsz = fit(LINK, SW - 2 * LM - 48, 34, 400, 0); lf = font(lsz, 400)
    d.rectangle((LM, LISTED_Y - 14, SW - LM, LISTED_Y + lsz + 18), fill=WHITE); d.text((LM + 24, LISTED_Y), LINK, font=lf, fill=INK)
    for i in range(total):
        cx = LM + i * 34; d.ellipse((cx, FOOT_Y + 24, cx + 20, FOOT_Y + 44), fill=ACC if i == n else DOT_OFF)
    if n < total - 1:
        by = FOOT_Y + 18; x1 = SW - LM; ay = by + 16; ax0, ax1 = x1 - 100, x1 - 6
        d.line([(ax0, ay), (ax1, ay)], fill=INK, width=5); d.line([(ax1 - 20, ay - 13), (ax1 + 2, ay)], fill=INK, width=5); d.line([(ax1 - 20, ay + 13), (ax1 + 2, ay)], fill=INK, width=5)
    return d


def title_block(d, dy=0):
    """Bold uppercase title (two lines) with the city under it, regular weight, accent colour."""
    size = min(fit(l, 880, 72, 800) for l in C['title']); y = HEAD_Y - 40 + dy
    for l in C['title']:
        d.text((LM, y), l, font=font(size, 800), fill=INK); y += size + 8
    d.text((LM + 2, y + 2), C['city'], font=font(46, 400), fill=ACC_TXT); return y + 64  # city: regular weight, close under the title (owner 2026-11-17)


def inner(d, heading, lines):
    d.text((LM, BAR_Y + 8), heading, font=font(38, 500), fill=ACC_TXT)
    y = HEAD_Y + 8
    for l in lines: d.text((LM, y), l, font=font(56, 400), fill=INK); y += 64


def photo(i, fy=.5): return Image.open(C['media'] % i).convert('RGB'), fy


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True); total = len(SLIDES) + 1; FY = {int(k): v for k, v in C.get('fy', {}).items()}; FX = {int(k): v for k, v in C.get('fx', {}).items()}
    for n, s in enumerate(SLIDES):
        pi = s[0]; ph = Image.open(MEDIA % pi).convert('RGB')
        im = fade_photo(ph, FY.get(pi, .5), start=740 if n else 780, ramp=220, fx=FX.get(pi, .5)); d = chrome(im, n, total)
        if n == 0: title_block(d, dy=-36)
        else: inner(d, s[1], s[2])
        im.save(f'{out}/slide-{n + 1:02d}.png')
    im = fade_photo(Image.open(MEDIA % END['photo']).convert('RGB'), FY.get(END['photo'], .5), start=640, ramp=240, fx=FX.get(END['photo'], .5)); d = chrome(im, total - 1, total)
    y = title_block(d, dy=-185); PH = 124; ff = font(46, 800); fw = width('FROM', ff, 4) + 56; pf = font(46, 800); pw = width(END['amount'], pf) + 56; py = int(y + 24)
    d.rectangle((LM, py, LM + fw, py + PH), fill=INK)
    for gx in range(LM + 40, int(LM + fw), 40): d.line([(gx, py), (gx, py + PH)], fill=(52, 62, 78), width=2)
    for gy in range(py + 31, py + PH, 31): d.line([(LM, gy), (int(LM + fw), gy)], fill=(52, 62, 78), width=2)
    text_c(d, LM + fw / 2, py + (PH - 46) // 2 - 4, 'FROM', ff, WHITE, spacing=4)
    d.rectangle((LM + fw, py, LM + fw + pw, py + PH), fill=WHITE); d.text((LM + fw + 28, py + (PH - 46) // 2 - 4), END['amount'], font=pf, fill=INK)
    im.save(f'{out}/slide-{total:02d}.png'); print('wrote', total, 'slides')
