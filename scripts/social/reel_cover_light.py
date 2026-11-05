"""Reel cover (1080x1920), owner-approved 2026-11-04 (Bayfonte Marina cover 1). Same look as the light carousel: full-bleed photo with a see-through
light fade from the middle down (max alpha 150, grid in the faded part), logo and content 100 px in from the left (platform UI crops the edge),
label bar (light, 22 px), bold black two-line title, tall FROM tab + price box (150 px), white link strip (light). Land: sage fade/grid,
green label bar with white text, no orange.

  python3 scripts/social/reel_cover_light.py project|land PHOTO.jpg OUT.png "LABEL" "LINE 1" "LINE 2" "RS. 54M" "www.lankanewhomes.com/projects/<slug>"
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from PIL import Image, ImageDraw
import land_cover_v1 as L

kind, photo, out, label, l1, l2, amount, link = sys.argv[1:9]
W, H, M = 1080, 1920, 100
INK, WHITE = (11, 18, 32), (255, 255, 255)
land = kind == 'land'
BG, GRID = ((232, 237, 226), (205, 214, 197)) if land else ((238, 242, 244), (214, 220, 223))
BAR, BARTXT = ((61, 90, 53), WHITE) if land else ((249, 153, 88), INK)

im = L.cover_fit(Image.open(photo).convert('RGB'), W, H, .5, .5)
panel = Image.new('RGB', (W, H), BG); pd = ImageDraw.Draw(panel)
for x in range(0, W, 216): pd.line([(x, 0), (x, H)], fill=GRID, width=2)
for y in range(0, H, 216): pd.line([(0, y), (W, y)], fill=GRID, width=2)
mask = Image.new('L', (W, H), 0); md = ImageDraw.Draw(mask)
for y in range(H): md.line([(0, y), (W, y)], fill=int(150 * min(1, max(0, (y - 780) / 380))))
im = Image.composite(panel, im, mask).convert('RGBA')
top = Image.new('RGBA', (W, 640), (0, 0, 0, 0)); td = ImageDraw.Draw(top)  # soft dark top so the white logo reads (full width, not a patch)
for y in range(640): td.line([(0, y), (W, y)], fill=(0, 0, 0, int(150 * (1 - y / 640))))
im.alpha_composite(top, (0, 0)); im.alpha_composite(L.logo(True, 200), (M, 300))
d = ImageDraw.Draw(im)
lf = L.font(22, 400); lw = L.width(label, lf, 3)
d.rectangle((M, 1010, M + lw + 36, 1010 + 44), fill=BAR); L.text_c(d, M + (lw + 36) / 2, 1019, label, lf, BARTXT, spacing=3)
y = 1010 + 44 + 26
for t in (l1, l2): d.text((M, y), t, font=L.font(72, 800), fill=INK); y += 84
ff = L.font(52, 500); fw = L.width('FROM', ff, 4) + 52; pw = L.width(amount, ff) + 52; py = y + 30
d.rectangle((M, py, M + fw, py + 150), fill=INK); L.text_c(d, M + fw / 2, py + 46, 'FROM', ff, WHITE, spacing=4)
d.rectangle((M + fw, py, M + fw + pw, py + 150), fill=WHITE); d.text((M + fw + 26, py + 46), amount, font=ff, fill=INK)
sz = L.fit(link, W - 2 * M - 56, 25, 300, 0); f = L.font(sz, 300); ly = py + 150 + 56  # owner 2026-11-05: smaller link text on covers (25 px, was 32)
d.rectangle((M, ly - 14, M + L.width(link, f) + 56, ly + sz + 18), fill=WHITE); d.text((M + 28, ly), link, font=f, fill=INK)
im.convert('RGB').save(out); print('wrote', out)
