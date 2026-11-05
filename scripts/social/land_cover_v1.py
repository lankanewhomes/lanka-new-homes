"""Instagram/Facebook/TikTok reel cover for a LAND listing: 1080x1920, four layouts.
Every cover carries: LAND FOR SALE headline, location, land size, price, logo.
Headline + location stay in the centre band (y 700-1250) so Instagram's 3:4 / 4:5 profile-grid crop keeps them.

  python3 scripts/social/land_cover_v1.py OUT_DIR PHOTO1 PHOTO2 PHOTO3 PHOTO4 \
      --location "THALAWATHUGODA · COLOMBO" --size "FROM 6.5 PERCHES" --price "FROM LKR 3.3M PER PERCH"
Facts come from the listing record only; nothing is invented.
"""
import argparse, os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

R = os.environ.get('LNH_ROOT', '/Volumes/MyStorage/LNH/lankanewhomes')
FONT = R + '/scripts/social/assets/fonts/Archivo-VF.ttf'
W, H = 1080, 1920
TEAL = (40, 100, 96)  # site teal (New listings grid), #286460: the kicker bar (owner, 2026-11-01: not orange)
ACC, INK, WHITE, MUTED = (249, 153, 88), (11, 18, 32), (255, 255, 255), (107, 99, 85)


def font(sz, w=700):
    f = ImageFont.truetype(FONT, sz)
    f.set_variation_by_axes([w, 100])
    return f


def fit(txt, maxw, sz, w=700, spacing=0):
    while width(txt, font(sz, w), spacing) > maxw and sz > 10:
        sz -= 2
    return sz


def width(txt, f, spacing=0):
    return f.getlength(txt) + spacing * max(0, len(txt) - 1)


def text_c(d, cx, y, txt, f, fill, spacing=0):
    """Centered text with optional letter spacing; y is the top."""
    tw = width(txt, f, spacing)
    x = cx - tw / 2
    if not spacing:
        d.text((x, y), txt, font=f, fill=fill)
        return
    for ch in txt:
        d.text((x, y), ch, font=f, fill=fill)
        x += f.getlength(ch) + spacing


def cover_fit(img, w, h, fx=0.5, fy=0.5):
    s = max(w / img.width, h / img.height)
    img = img.resize((int(img.width * s) + 1, int(img.height * s) + 1), Image.LANCZOS)
    x = int((img.width - w) * fx)
    y = int((img.height - h) * fy)
    return img.crop((x, y, x + w, y + h))


def card_contain(im, photo, top=470, maxw=916, maxh=430, pad=10):
    """Paste the WHOLE photo (no cropping) in a white-bordered card sized to the photo's shape, centred. Returns the card bottom y."""
    sc = min(maxw / photo.width, maxh / photo.height)
    w, h = int(photo.width * sc), int(photo.height * sc)
    x0 = (W - w) // 2
    ImageDraw.Draw(im).rectangle((x0 - pad, top, x0 + w + pad, top + h + 2 * pad), fill=(255, 255, 255))
    im.paste(photo.resize((w, h), Image.LANCZOS), (x0, top + pad))
    return top + h + 2 * pad


def card_fixed(im, photo, top=470, w=860, h=460, pad=10, fy=0.5):
    """Same-size card on every cover: the photo fills the box edge to edge (centre-cropped, no side bars). Returns the card bottom y."""
    x0 = (W - w) // 2
    ImageDraw.Draw(im).rectangle((x0 - pad, top, x0 + w + pad, top + h + 2 * pad), fill=(255, 255, 255))
    im.paste(cover_fit(photo, w, h, .5, fy), (x0, top + pad))
    return top + h + 2 * pad


def logo(white=True, w=200):
    p = R + ('/public/brand/lankanewhomes-logo-white.png' if white else '/public/brand/lankanewhomes-logo.png')
    im = Image.open(p).convert('RGBA')
    return im.resize((w, int(im.height * w / im.width)), Image.LANCZOS)


def scrim(im, top, bottom, a_top, a_mid, a_bot):
    ov = Image.new('RGBA', im.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    for y in range(top, bottom):
        t = (y - top) / (bottom - top)
        a = int(a_top + (a_mid - a_top) * min(1, t * 2) if t < .5 else a_mid + (a_bot - a_mid) * (t - .5) * 2)
        d.line([(0, y), (W, y)], fill=(5, 8, 12, a))
    return Image.alpha_composite(im.convert('RGBA'), ov).convert('RGB')


def headline(d, cy, two_tone=True):
    """LAND / FOR SALE, centred at y=cy (block ~330 px tall)."""
    f1 = font(fit('LAND', 900, 250, 800), 800)
    text_c(d, W / 2, cy - 170, 'LAND', f1, WHITE)
    f2s = fit('FOR SALE', 880, 170, 800)
    f2 = font(f2s, 800)
    tw = width('FOR SALE', f2)
    top = cy + 100
    if two_tone:
        d.rectangle((W / 2 - tw / 2 - 28, top - 6, W / 2 + tw / 2 + 28, top + f2s + 22), fill=ACC)
        text_c(d, W / 2, top, 'FOR SALE', f2, INK)
    else:
        text_c(d, W / 2, top, 'FOR SALE', f2, ACC)


def location(d, y, loc, fill=ACC):
    text_c(d, W / 2, y, loc, font(fit(loc, 900, 60, 700, 8), 700), fill, spacing=8)


def info_stack(d, y, size, price, dark=True):
    """Size line + price pill. Everything below the headline, inside the 4:5 grid crop."""
    if size:
        text_c(d, W / 2, y, size, font(fit(size, 880, 78, 700, 4), 700), WHITE if dark else INK, spacing=4)
    pf = font(fit(price, 840, 56, 700, 2), 700)
    pw = width(price, pf, 2)
    top = y + (120 if size else 20)
    d.rectangle((W / 2 - pw / 2 - 40, top, W / 2 + pw / 2 + 40, top + 112), fill=WHITE if dark else INK)
    text_c(d, W / 2, top + 22, price, pf, INK if dark else WHITE, spacing=2)


def paste_logo(im, white=True, x=72, y=300, w=200):
    L = logo(white, w)
    im.paste(L, (x, y), L)


def v_window(photo, a):
    """A: blurred backdrop + sharp window (same family as the Bay One reel)."""
    bg = cover_fit(photo, W, H).filter(ImageFilter.GaussianBlur(38))
    im = scrim(bg, 0, H, 150, 120, 170)
    im.paste(cover_fit(photo, W, 1320, .5, .55), (0, 300))
    im = scrim(im, 300, 1620, 60, 150, 190)
    d = ImageDraw.Draw(im)
    paste_logo(im)
    headline(d, 850)
    location(d, 1185, a.location)
    info_stack(d, 1295, a.size, a.price)
    return im


def v_fullbleed(photo, a):
    """B: full-bleed photo under a dark scrim, headline white with an accent underline."""
    im = cover_fit(photo, W, H, .45, .5)
    im = scrim(im, 0, H, 150, 175, 215)
    d = ImageDraw.Draw(im)
    paste_logo(im)
    headline(d, 830, two_tone=False)
    d.rectangle((W / 2 - 150, 1098, W / 2 + 150, 1108), fill=ACC)
    location(d, 1140, a.location, WHITE)
    info_stack(d, 1260, a.size, a.price)
    return im


def v_dark(photo, a):
    """C: dark grid background (end-card family) with an inset photo above the headline."""
    im = Image.new('RGB', (W, H), (12, 12, 14))
    d = ImageDraw.Draw(im)
    for x in range(0, W, 72):
        d.line([(x, 0), (x, H)], fill=(34, 34, 40), width=2)
    for y in range(0, H, 72):
        d.line([(0, y), (W, y)], fill=(34, 34, 40), width=2)
    im.paste(cover_fit(photo, 936, 330, .5, .55), (72, 480))
    d.rectangle((72, 480, 72 + 936, 480 + 330), outline=ACC, width=4)
    paste_logo(im, y=272)
    headline(d, 1010)
    location(d, 1340, a.location)
    info_stack(d, 1445, a.size, a.price)
    return im


def v_light(photo, a):
    """D: cream paper (v9 reel family): photo card on top, ink headline, accent bar."""
    im = Image.new('RGB', (W, H), (247, 244, 238))
    d = ImageDraw.Draw(im)
    for x in range(0, W, 108):
        d.line([(x, 0), (x, H)], fill=(226, 221, 208), width=3)
    for y in range(0, H, 108):
        d.line([(0, y), (W, y)], fill=(226, 221, 208), width=3)
    d.rectangle((72, 380, 1008, 380 + 440), fill=WHITE, outline=(226, 221, 208), width=2)
    im.paste(cover_fit(photo, 896, 400, .5, .55), (92, 400))
    paste_logo(im, white=False, y=290)
    d = ImageDraw.Draw(im)
    f1 = font(fit('LAND', 900, 250, 800), 800)
    text_c(d, W / 2, 800, 'LAND', f1, INK)
    f2s = fit('FOR SALE', 880, 170, 800)
    f2 = font(f2s, 800)
    tw = width('FOR SALE', f2)
    d.rectangle((W / 2 - tw / 2 - 28, 1064, W / 2 + tw / 2 + 28, 1064 + f2s + 28), fill=ACC)
    text_c(d, W / 2, 1070, 'FOR SALE', f2, INK)
    text_c(d, W / 2, 1300, a.location, font(fit(a.location, 900, 60, 700, 8), 700), (150, 100, 20), spacing=8)
    info_stack(d, 1405, a.size, a.price, dark=False)
    return im


def black_grid(d, im_size=(W, H)):
    for x in range(0, W, 72):
        d.line([(x, 0), (x, H)], fill=(36, 36, 42), width=2)
    for y in range(0, H, 72):
        d.line([(0, y), (W, y)], fill=(36, 36, 42), width=2)


def v_black(photo, a, ch=340):
    d0 = ch - 340
    """E: cover 4's layout on black: photo card, big LAND / FOR SALE, location, size, price."""
    im = Image.new('RGB', (W, H), (12, 12, 14))
    d = ImageDraw.Draw(im)
    black_grid(d)
    d.rectangle((72, 470, 1008, 470 + ch + 20), fill=(255, 255, 255))
    im.paste(cover_fit(photo, 916, ch, .5, .55), (82, 480))
    paste_logo(im, y=272)
    d = ImageDraw.Draw(im)
    f1 = font(fit('LAND', 900, 250, 800), 800)
    text_c(d, W / 2, 840 + d0, 'LAND', f1, WHITE)
    f2s = fit('FOR SALE', 880, 170, 800)
    f2 = font(f2s, 800)
    tw = width('FOR SALE', f2)
    d.rectangle((W / 2 - tw / 2 - 28, 1104 + d0, W / 2 + tw / 2 + 28, 1104 + d0 + f2s + 28), fill=ACC)
    text_c(d, W / 2, 1110 + d0, 'FOR SALE', f2, INK)
    location(d, 1335 + d0, a.location)
    info_stack(d, 1435 + d0, a.size, a.price)
    return im


def v_blackcard(photo, a):
    """F: the reel's black layout: big photo card with the headline over it, size and price low on the image."""
    im = Image.new('RGB', (W, H), (12, 12, 14))
    d = ImageDraw.Draw(im)
    black_grid(d)
    d.rectangle((72, 452, 944, 1480), fill=(255, 255, 255))
    ph = cover_fit(photo, 852, 1008, .5, .55)
    im.paste(ph, (82, 462))
    im = scrim(im.crop((82, 462, 934, 1470)).resize((852, 1008)).convert('RGB'), 0, 1008, 70, 105, 170)
    full = Image.new('RGB', (W, H), (12, 12, 14))
    fd = ImageDraw.Draw(full)
    black_grid(fd)
    fd.rectangle((72, 452, 944, 1480), fill=(255, 255, 255))
    full.paste(im, (82, 462))
    im = full
    d = ImageDraw.Draw(im)
    paste_logo(im, y=272)
    cx = 508
    f1 = font(fit('LAND', 780, 240, 800), 800)
    text_c(d, cx, 600, 'LAND', f1, WHITE)
    f2s = fit('FOR SALE', 760, 160, 800)
    f2 = font(f2s, 800)
    tw = width('FOR SALE', f2)
    d.rectangle((cx - tw / 2 - 26, 866, cx + tw / 2 + 26, 866 + f2s + 26), fill=ACC)
    text_c(d, cx, 872, 'FOR SALE', f2, INK)
    text_c(d, cx, 1110, a.location, font(fit(a.location, 800, 56, 700, 8), 700), ACC, spacing=8)
    if a.size:
        text_c(d, cx, 1215, a.size, font(fit(a.size, 800, 72, 700, 4), 700), WHITE, spacing=4)
    pf = font(fit(a.price, 760, 52, 700, 2), 700)
    pw = width(a.price, pf, 2)
    py = 1315 if a.size else 1245
    d.rectangle((cx - pw / 2 - 36, py, cx + pw / 2 + 36, py + 100), fill=WHITE)
    text_c(d, cx, py + 20, a.price, pf, INK, spacing=2)
    return im


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('out')
    ap.add_argument('photos', nargs='+')
    ap.add_argument('--location', required=True)
    ap.add_argument('--size', default='', help='optional land-size line; leave empty to omit')
    ap.add_argument('--price', required=True)
    a = ap.parse_args()
    os.makedirs(a.out, exist_ok=True)
    ph = [Image.open(p).convert('RGB') for p in a.photos]
    fns = (v_window, v_fullbleed, v_dark, v_light, v_black, v_blackcard)
    for n, fn in enumerate(fns, 1):
        fn(ph[(n - 1) % len(ph)] if n <= 4 else ph[3 if n == 5 else 0], a).save(f'{a.out}/cover-{n}.png')
        print('wrote', f'{a.out}/cover-{n}.png')
