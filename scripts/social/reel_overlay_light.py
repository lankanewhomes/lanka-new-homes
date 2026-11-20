"""Reel overlay (1080x1920 RGBA) applied over the Remotion render with ffmpeg: logo top-left (100 px in) plus the white grid lines on the TOP and BOTTOM bands.
Owner 2026-11-09: "I want the reel to look like this" (the posted Bayfonte Marina reel, instagram.com/reel/DfVSRx5IIW2): thin grid lines, top band 0-320 px fading down,
bottom band from 1600 px fading up to the edge. This is exactly that look (the 175-opacity / 1180 px version I tried first was too heavy).

  python3 scripts/social/reel_overlay_light.py OUT.png [LOGO.png]
  ffmpeg -i raw.mp4 -i OUT.png -filter_complex "[0:v][1:v]overlay=0:0:format=auto,format=yuv420p" -c:v libx264 -crf 18 final.mp4
"""
import sys
from PIL import Image, ImageDraw, ImageFilter, ImageChops
out = sys.argv[1]; logo = sys.argv[2] if len(sys.argv) > 2 else 'public/brand/logo-white.png'
W, H, STEP, LA = 1080, 1920, 72, 150  # grid spacing, max line opacity (of 255): the approved Bayfonte reel look
g = Image.new('RGBA', (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(g)
for x in range(0, W, STEP): d.line([(x, 0), (x, H)], fill=(255, 255, 255, 255), width=3)
for y in range(0, H, STEP): d.line([(0, y), (W, y)], fill=(255, 255, 255, 255), width=3)
mask = Image.new('L', (W, H), 0); md = ImageDraw.Draw(mask)
for y in range(H):
    if y < 320: a = int(LA * (1 - y / 320))
    elif y >= 1600: a = int(LA * (y - 1600) / 320)
    else: a = 0
    md.line([(0, y), (W, y)], fill=a)
g.putalpha(ImageChops.multiply(g.getchannel('A'), mask))
ov = g
LX = 100
# no dark patch behind the logo (owner 2026-11-09: "dont add bg behind the logo")
lg = Image.open(logo).convert('RGBA'); lg = lg.resize((210, int(lg.height * 210 / lg.width)))
ov.alpha_composite(lg, (LX, 262)); ov.save(out); print('wrote', out)
