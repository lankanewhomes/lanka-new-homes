"""LAND version of carousel_project_v2.py (generated from it: sage background, green bars with white text, green arrow). Instagram carousel (1080x1350, 4:5) for a LAND listing (same layout as carousel_land_v1.py, project palette: sky + orange bars with dark text): sage background + grid (same as the land covers), logo top-left on every slide,
one photo card per slide with the headline written ON the photo, green label bar, slide dots, SWIPE box with a drawn arrow (square corners).
Every line of text comes from the listing record (docs/design.md consistency rules: land bar = green, no developer name).

  python3 scripts/social/carousel_land_v1.py OUT_DIR
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from land_cover_v1 import *  # noqa: font, text_c, cover_fit, fit, width, logo, INK, WHITE
from PIL import Image, ImageDraw

SW, SH = 1080, 1350
SAGE, GRIDC = (232, 237, 226), (205, 214, 197)  # site sage (land palette)
GREEN = (61, 90, 53)  # land deep green: bars, dots, arrow (no orange on land)
BROWN = (61, 90, 53)  # land: no orange, accents are the land green
MEDIA = '/private/tmp/claude-501/-Volumes-MyStorage-LNH-lankanewhomes/9334f53c-139a-5ff2-85ec-948ae42a51c1/scratchpad/remotion-antara/public/media/negombo-%02d.jpg'
TITLE = 'OCEAN BREEZE NEGOMBO PHASE 2'
# (photo index, label in the green bar, headline lines, focus y)
SLIDES = [
    (0, 'APARTMENTS  ·  NEGOMBO', ['OCEAN BREEZE', 'NEGOMBO PHASE 2'], .5),
    (1, 'LOCATION', ['ABOUT 50 METERS', 'FROM THE BEACH'], .5),
    (5, 'THE TOWER', ['298 RESIDENCES', 'ACROSS 25 FLOORS'], .5),
    (29, 'APARTMENTS', ['STUDIO TO', '3 BEDROOMS'], .5),
    (35, 'VIEWS', ['SEA-VIEW', 'BALCONIES'], .5),
    (7, 'AMENITIES', ['ROOFTOP', 'SWIMMING POOL'], .5),
    (8, 'AMENITIES', ['FITNESS', 'CENTER'], .5),
    (11, 'AMENITIES', ['CLUBHOUSE', 'LOUNGE'], .5),
]
CARD = (60, 200, 1020, 960)
FX = {}  # horizontal focus per photo (default centre)
# Per-listing config (JSON): {"media": ".../p%d.jpg", "slides": [[photo, "BAR", ["LINE 1", "LINE 2"], fy], ...], "end": {"photo": 4, "bar": "...", "lines": [...], "amount": "RS. 60M"},
#  "link": "Listed on lankanewhomes.com/projects/<slug>", "fx": {"4": .55}, "badge": "NOW SELLING"}   usage: CAROUSEL_CFG=cfg.json python3 carousel_project_v1.py OUT_DIR
END = {'photo': 4, 'bar': 'SEA-VIEW APARTMENTS', 'lines': ['OCEAN BREEZE', 'NEGOMBO PHASE 2'], 'amount': 'RS. 39.4M'}
if os.environ.get('CAROUSEL_CFG'):
    import json as _json
    _c = _json.load(open(os.environ['CAROUSEL_CFG']))
    MEDIA = _c['media']; SLIDES = [tuple(x) for x in _c['slides']]; END = _c['end']; TITLE = ' '.join(END['lines'])
    FX = {int(k): v for k, v in _c.get('fx', {}).items()}


def base():
    im = Image.new('RGB', (SW, SH), SAGE)
    d = ImageDraw.Draw(im)
    for x in range(0, SW, 216):
        d.line([(x, 0), (x, SH)], fill=GRIDC, width=2)
    for y in range(0, SH, 216):
        d.line([(0, y), (SW, y)], fill=GRIDC, width=2)
    lg = logo(False, 180)
    d.rectangle((52, 44, 52 + 180 + 24, 44 + lg.height + 20), fill=SAGE)
    im.paste(lg, (64, 54), lg)
    return im


def photo_card(im, photo, fy):
    x0, y0, x1, y1 = CARD
    d = ImageDraw.Draw(im)
    d.rectangle((x0 - 8, y0 - 8, x1 + 8, y1 + 8), fill=WHITE)
    im.paste(cover_fit(photo, x1 - x0, y1 - y0, .5, fy), (x0, y0))
    ov = Image.new('RGBA', (x1 - x0, 420), (0, 0, 0, 0))
    od = ImageDraw.Draw(ov)
    for i in range(420):
        od.line([(0, i), (x1 - x0, i)], fill=(5, 8, 12, int(215 * (i / 420) ** 1.5)))
    base_im = im.convert('RGBA')
    base_im.alpha_composite(ov, (x0, y1 - 420))
    return base_im.convert('RGB')


def text_on_photo(im, label, lines):
    x0, y0, x1, y1 = CARD
    d = ImageDraw.Draw(im)
    ks = 40
    kf = font(ks, 800)
    kw = width(label, kf, 5)
    size = min(fit(l, 880, 96, 800) for l in lines)
    block = ks + 28 + 20 + len(lines) * (size + 8)
    top = y1 - 44 - block
    d.rectangle((x0 + 36, top, x0 + 36 + kw + 44, top + ks + 28), fill=GREEN)
    text_c(d, x0 + 36 + (kw + 44) / 2, top + 10, label, kf, WHITE, spacing=5)
    y = top + ks + 28 + 20
    for l in lines:
        d.text((x0 + 36, y), l, font=font(size, 800), fill=WHITE)
        y += size + 8


def footer(im, n, total, text=TITLE):
    d = ImageDraw.Draw(im)
    d.text((60, 1010), text, font=font(fit(text, 700, 40, 700), 700), fill=INK)
    d.text((60, 1070), 'Listed on lankanewhomes.com', font=font(30, 500), fill=(95, 103, 112))
    for i in range(total):
        cx = 60 + i * 34
        d.ellipse((cx, 1140, cx + 20, 1160), fill=GREEN if i == n else (190, 198, 188))
    if n < total - 1:
        sf = font(36, 800); tw = width('SWIPE', sf, 4)
        x1 = SW - 60; x0 = x1 - tw - 110
        d.rectangle((x0, 1118, x1, 1182), fill=GREEN)
        text_c(d, x0 + 28 + tw / 2, 1131, 'SWIPE', sf, INK, spacing=4)


FADE_MAX = 150  # max opacity of the light fade (of 255): low so the photo stays visible behind the text (owner: make it more transparent)


def fade_photo(photo, fx=.5, fy=.5, start=430, ramp=330):
    """Full-bleed photo with a light fade from `start` down (so dark text reads), the grid lines drawn into the faded part, and a soft dark top for the white logo."""
    ph = cover_fit(photo, SW, SH, fx, fy).convert('RGB')
    panel = Image.new('RGB', (SW, SH), SAGE)
    pd = ImageDraw.Draw(panel)
    for x in range(0, SW, 216):
        pd.line([(x, 0), (x, SH)], fill=GRIDC, width=2)
    for y in range(0, SH, 216):
        pd.line([(0, y), (SW, y)], fill=GRIDC, width=2)
    mask = Image.new('L', (SW, SH), 0)
    md = ImageDraw.Draw(mask)
    for y in range(SH):
        t = max(0.0, (y - start) / ramp)
        md.line([(0, y), (SW, y)], fill=int(FADE_MAX * min(1, t) ** 1.1))
    im = Image.composite(panel, ph, mask).convert('RGBA')
    top = Image.new('RGBA', (SW, 230), (0, 0, 0, 0)); td = ImageDraw.Draw(top)
    for y in range(230):
        td.line([(0, y), (SW, y)], fill=(6, 12, 6, int(110 * (1 - y / 230))))
    im.alpha_composite(top, (0, 0))
    return im.convert('RGB')


# Shared layout so the text sits on the same lines on every slide.
BAR_Y, HEAD_Y, LISTED_Y, FOOT_Y = 944, 996, 1195, 1268
PRICE_SHIFT = 94  # the closing slide starts this much higher to make room for the price box
BADGE = _c.get('badge') if os.environ.get('CAROUSEL_CFG') else None  # never used (owner: no NOW SELLING badge)
LISTED = _c['link'] if os.environ.get('CAROUSEL_CFG') else 'Listed on lankanewhomes.com/projects/ocean-breeze-negombo-phase-two'


def head_size():
    """One fixed headline size for every slide of every carousel (owner 2026-11-03: 50)."""
    return 50


def chrome(im, n, total, last=False):
    d = ImageDraw.Draw(im)
    lg = logo(True, 180)
    im.paste(lg, (64, 54), lg)
    lsz = fit(LISTED, SW - 128 - 48, 34, 500, 0); lf = font(lsz, 500)  # only the link font may vary; shrinks for long URLs
    d.rectangle((64, LISTED_Y - 14, SW - 64, LISTED_Y + lsz + 18), fill=WHITE)  # white box so the link reads over the photo
    d.text((88, LISTED_Y), LISTED, font=lf, fill=INK)
    for i in range(total):
        cx = 64 + i * 34
        d.ellipse((cx, FOOT_Y + 24, cx + 20, FOOT_Y + 44), fill=GREEN if i == n else (120, 135, 120))
    # bottom-right box, same place on every slide: SWIPE with an arrow, or LINK IN BIO on the last slide
    sf = font(16, 800)  # owner 2026-11-03: LINK IN BIO smaller still (16 on a 32 px box)
    label = 'LINK IN BIO' if last else 'SWIPE'
    tw = width(label, sf, 3)
    x1 = SW - 64; x0 = x1 - (tw + 32 if last else 120)  # SWIPE slides: just a long arrow, no box, in black ink on projects and land (owner 2026-11-03)
    by = FOOT_Y + 18  # centred on the dots row
    if last:
        d.rectangle((x0, by, x1, by + 32), fill=GREEN)
        text_c(d, (x0 + x1) / 2, by + 6, label, sf, WHITE, spacing=3)
    else:
        ay = by + 16; ax0, ax1 = x1 - 100, x1 - 6  # arrow ~94 px long
        d.line([(ax0, ay), (ax1, ay)], fill=INK, width=5)
        d.line([(ax1 - 20, ay - 13), (ax1 + 2, ay)], fill=INK, width=5)
        d.line([(ax1 - 20, ay + 13), (ax1 + 2, ay)], fill=INK, width=5)
    return d


def bar_and_head(d, label, lines, dy=0, badge=None):
    kf = font(fit(label, 908, 18, 800, 3), 800); kw = width(label, kf, 3)  # shrink long labels so the bar stays inside the right margin
    d.rectangle((64, BAR_Y + dy, 64 + kw + 30, BAR_Y + dy + 34), fill=GREEN)
    text_c(d, 64 + (kw + 30) / 2, BAR_Y + dy + 6, label, kf, WHITE, spacing=3)
    size = head_size(); y = HEAD_Y + dy
    for l in lines:
        d.text((64, y), l, font=font(size, 800), fill=INK)
        y += size - 4  # tight line height (owner)
    if badge:  # website "Now Selling" pill: light green fill, green border and text, square corners
        bf = font(34, 800); bw = width(badge, bf, 5)
        d.rectangle((64, y + 4, 64 + bw + 56, y + 4 + 60), fill=(232, 244, 232), outline=(26, 107, 47), width=3)
        text_c(d, 64 + (bw + 56) / 2, y + 4 + 11, badge, bf, (26, 107, 47), spacing=5)
        y += 4 + 60 + 10
    return y


def photo_slide(n, total, photo_idx, label, lines, fx=.5, fy=.5):
    """Slides 1 to 6: full photo, same text lines as the closing slide."""
    im = fade_photo(Image.open(MEDIA % photo_idx).convert('RGB'), fx, fy, start=830, ramp=240)
    d = chrome(im, n, total)
    bar_and_head(d, label, lines, badge=BADGE if n == 0 else None)
    return im


def end_slide(n, total):
    """Closing slide: same bar/headline/listed lines as the others, plus the price box; LINK IN BIO sits bottom-right."""
    im = fade_photo(Image.open(MEDIA % END['photo']).convert('RGB'), .5, .5, start=800, ramp=240)
    d = chrome(im, n, total, last=True)
    y = bar_and_head(d, END['bar'], END['lines'], dy=-PRICE_SHIFT)
    # approved price design (owner, restored 2026-11-02): dark FROM tab with fine grid lines + white price block, same size text, square corners
    ff = font(38, 800); fw = width('FROM', ff, 4) + 56
    amount = END['amount']
    pf = font(38, 800); pw = width(amount, pf) + 56
    py = int(y + 30)
    d.rectangle((64, py, 64 + fw, py + 88), fill=INK)
    for gx in range(64 + 40, int(64 + fw), 40):
        d.line([(gx, py), (gx, py + 88)], fill=(52, 62, 78), width=2)
    for gy in range(py + 29, py + 88, 29):
        d.line([(64, gy), (int(64 + fw), gy)], fill=(52, 62, 78), width=2)
    text_c(d, 64 + fw / 2, py + 24, 'FROM', ff, WHITE, spacing=4)
    d.rectangle((64 + fw, py, 64 + fw + pw, py + 88), fill=WHITE)
    d.text((64 + fw + 28, py + 24), amount, font=pf, fill=INK)
    return im


if __name__ == '__main__':
    out = sys.argv[1]; os.makedirs(out, exist_ok=True)
    total = len(SLIDES) + 1
    for n, (pi, label, lines, fy) in enumerate(SLIDES):
        im = photo_slide(n, total, pi, label, lines, FX.get(pi, .5), .5)
        im.save(f'{out}/slide-{n + 1:02d}.png')
    end_slide(total - 1, total).save(f'{out}/slide-{total:02d}.png')
    print('wrote', total, 'slides')
