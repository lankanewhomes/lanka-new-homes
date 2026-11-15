"""Five interactive reel formats. usage: reels.py <1-5> OUT [--still SECONDS]

1 Higher or lower (price game)      Oceana Wadduwa
2 Guess the city (letters fill in)  Yarl Royal Palace
3 This or that (comment 1 or 2)     The Golf Colombo 08 vs Glenhaven
4 Countdown 3-2-1 (best for last)   Vyan Villas Ella
5 Quick quiz (land, green palette)  The Highway, Kottawa
Every line of text is a fact from the listing record. No developer names, nothing about units sold or left.
"""
import sys
from PIL import Image, ImageDraw
from reelkit import *

P = "photos"


def fit(text, size, maxw=980, **style):
    while size > 30 and text_img(text, size, **style).width - (0 if style.get("box") else 80) > maxw:
        size -= 4
    return size


def big(frame, text, cy, t, start=0.0, kind="pop", size=132, **style):
    style.setdefault("width", 78)
    style.setdefault("weight", 900)
    say(frame, text, W / 2, cy, fit(text, size, **style), t, start, kind, **style)


def label(frame, text, cy, t, start=0.0, kind="rise", size=46, accent=ORANGE, cx=W / 2, **kw):
    say(frame, text, cx, cy, fit(text, size, box=accent), t, start, kind, box=accent, color=INK if accent == ORANGE else WHITE, weight=800, **kw)


# ============================== 1. HIGHER OR LOWER ==============================
def reel_1():
    aerial = Photo(f"{P}/oceana-wadduwa/oceana-wadduwa_skyline-exterior-beach-towers-render.jpg", (0.55, 0.5))
    living = Photo(f"{P}/oceana-wadduwa/oceana-wadduwa_skyline-interior-living-room.jpg", (0.5, 0.55))
    dining = Photo(f"{P}/oceana-wadduwa/oceana-wadduwa_skyline-interior-dining-living.jpg", (0.5, 0.55))
    kitchen = Photo(f"{P}/oceana-wadduwa/oceana-wadduwa_skyline-interior-kitchen.jpg", (0.5, 0.5))
    towers = Photo(f"{P}/oceana-wadduwa/oceana-wadduwa_skyline-exterior-aerial-towers-villas.jpg", (0.5, 0.5))
    GUESS = "HIGHER OR LOWER THAN LKR 50 MILLION?"

    def chip(f, t):
        say(f, GUESS, W / 2, 452, 30, t, 0.0, "fade", box=INK, color=WHITE, weight=700, box_pad=(22, 12))

    def hook(t, dur):
        f = aerial.frame(t / dur)
        dim(f, 0.34)
        big(f, "HIGHER", 760, t, 0.05, "stamp", size=170)
        big(f, "OR LOWER?", 920, t, 0.32, "stamp", size=170)
        label(f, "THAN LKR 50 MILLION", 1080, t, 0.75, "pop", size=58)
        say(f, "A BEACHFRONT APARTMENT IN SRI LANKA", W / 2, 1190, 36, t, 1.1, "rise", weight=700)
        say(f, "ANSWER AT THE END", W / 2, 1500, 34, t, 1.4, "rise", weight=800, tracking=4)
        return f

    def clue(photo, lines, zoom_in=True):
        def draw(t, dur):
            f = photo.frame(t / dur, zoom_in)
            dim(f, 0.16)
            chip(f, t)
            for i, line in enumerate(lines):
                big(f, line, 1290 + i * 118, t, 0.18 + i * 0.16, "left" if i % 2 == 0 else "right", size=104)
            return f
        return draw

    def lock(t, dur):
        f = living.frame(1.0)
        dim(f, 0.62)
        big(f, "LOCK IN YOUR GUESS", 700, t, 0.0, "pop", size=104)
        n = 3 - min(2, int(t / (dur / 3)))
        frac = 1 - (t % (dur / 3)) / (dur / 3)
        ring(f, W // 2, 1010, 150, frac)
        local = t % (dur / 3)
        img = text_img(str(n), 230, weight=900, width=80)
        s = 0.7 + 0.3 * back_out(local / 0.25)
        img = img.resize((int(img.width * s), int(img.height * s)), Image.BICUBIC)
        put(f, img, W / 2 - img.width / 2, 1010 - img.height / 2)
        label(f, "HIGHER", 1290, t, 0.1, "left", size=50, cx=W / 2 - 170)
        say(f, "LOWER", W / 2 + 170, 1290, 50, t, 0.1, "right", box=WHITE, color=INK, weight=800)
        return f

    def reveal(t, dur):
        f = towers.frame(t / dur, False)
        dim(f, 0.42)
        big(f, "LOWER!", 700, t, 0.0, "stamp", size=210)
        say(f, "APARTMENTS START FROM", W / 2, 900, 44, t, 0.45, "rise", weight=800, tracking=3)
        value = 36_000_000 * ease_out((t - 0.55) / 1.1)
        if t > 0.55:
            amount = text_img("LKR " + money(value if t < 1.65 else 36_000_000), 112, weight=900, width=78, box=ORANGE, color=INK, box_pad=(40, 22))
            put(f, amount, W / 2 - amount.width / 2, 1030 - amount.height / 2, clamp((t - 0.55) * 5))
        say(f, "ON THE BEACH IN WADDUWA", W / 2, 1190, 46, t, 1.75, "rise", weight=800)
        return f

    return [
        (2.6, hook),
        (2.1, clue(living, ["STEPS FROM", "THE BEACH"])),
        (2.1, clue(dining, ["40 MINUTES", "FROM COLOMBO"], False)),
        (2.1, clue(kitchen, ["RESORT-STYLE", "LIVING"])),
        (2.4, lock),
        (3.3, reveal),
        (3.4, end_card(aerial, "OCEANA WADDUWA", "lankanewhomes.com/projects/oceana-wadduwa", ["DID YOU", "GET IT RIGHT?"], sub="Tell us in the comments")),
    ], "flash"


# ============================== 2. GUESS THE CITY ==============================
def reel_2():
    dusk = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_aerial-dusk.jpg", (0.55, 0.5))
    day = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_aerial-day.jpg", (0.48, 0.5))
    bedroom = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_bedroom.jpg", (0.5, 0.5))
    pool = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_rooftop-pool-sunset.jpg", (0.5, 0.5))
    living = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_living-room.jpg", (0.5, 0.5))
    # more photos (2026-11-14, owner asked for more images). The two building-exterior photos are left
    # out on purpose: the developer's name is readable on the tower.
    bathroom = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_bathroom.jpg", (0.5, 0.5))
    dining = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_dining-kitchen.jpg", (0.5, 0.5))
    gym = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_gym.jpg", (0.5, 0.5))
    pool_day = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_rooftop-pool-day.jpg", (0.42, 0.5))
    pool_deck = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_rooftop-pool-deck.jpg", (0.5, 0.5))
    pool_dusk = Photo(f"{P}/yarl-royal-palace-jaffna/yarl-royal-palace-jaffna_rooftop-pool-dusk.jpg", (0.42, 0.5))
    WORD = "JAFFNA"

    def cuts(photos, t, dur):
        """Several photos inside one scene: hard cuts with a short white blink."""
        seg = dur / len(photos)
        i = min(int(max(t, 0) / seg), len(photos) - 1)
        local = t - i * seg
        f = photos[i].frame(min(local / seg, 1.0), i % 2 == 0)
        if i > 0 and local < 0.16:
            f = Image.blend(f, Image.new("RGBA", (W, H), (255, 255, 255, 255)), 0.6 * (1 - local / 0.16) ** 2)
        return f

    def letters(f, shown, t, pop_from=None):
        """Six letter boxes; `shown` = indexes already revealed."""
        box, gap = 132, 18
        x0 = (W - (box * 6 + gap * 5)) / 2
        y = 1400
        d = ImageDraw.Draw(f, "RGBA")
        for i, ch in enumerate(WORD):
            x = x0 + i * (box + gap)
            filled = i in shown
            d.rectangle([x, y, x + box, y + box], fill=(249, 153, 88, 255) if filled else (255, 255, 255, 235))
            if filled:
                img = text_img(ch, 104, color=INK, weight=900, shadow=False)
                s = 1.0
                if pop_from is not None and i in pop_from[0]:
                    s = 0.4 + 0.6 * back_out((t - pop_from[1]) / 0.35)
                    if t < pop_from[1]:
                        d.rectangle([x, y, x + box, y + box], fill=(255, 255, 255, 235))
                        continue
                img = img.resize((int(img.width * s), int(img.height * s)), Image.BICUBIC)
                put(f, img, x + box / 2 - img.width / 2, y + box / 2 - img.height / 2)

    def hook(t, dur):
        f = cuts([dusk, pool_dusk, pool_deck], t, dur)
        dim(f, 0.34)
        big(f, "CAN YOU GUESS", 740, t, 0.05, "drop", size=128)
        big(f, "THIS CITY?", 880, t, 0.25, "drop", size=150)
        label(f, "3 CLUES. 6 LETTERS.", 1040, t, 0.7, "pop", size=52)
        if t > 1.0:
            letters(f, set(), t)
        return f

    def clue(photos, n, lines, before, new):
        def draw(t, dur):
            f = cuts(photos, t, dur)
            dim(f, 0.2)
            label(f, f"CLUE {n} OF 3", 470, t, 0.05, "drop", size=44)
            for i, line in enumerate(lines):
                big(f, line, 1130 + i * 112, t, 0.2 + i * 0.15, "rise", size=100)
            letters(f, before | new, t, (new, 1.15))
            return f
        return draw

    def reveal(t, dur):
        f = day.frame(t / dur, False)
        dim(f, 0.36)
        say(f, "IT IS", W / 2, 700, 60, t, 0.0, "rise", weight=800, tracking=6)
        big(f, "JAFFNA", 880, t, 0.2, "stamp", size=250)
        letters(f, {0, 1, 2, 3, 4, 5}, t, ({2, 3}, 0.2))
        return f

    def listing(t, dur):
        f = cuts([pool_day, pool], t, dur)
        dim(f, 0.2)
        label(f, "YARL ROYAL PALACE", 470, t, 0.05, "drop", size=50)
        big(f, "ROOFTOP POOL", 1180, t, 0.2, "left", size=118)
        big(f, "13 FLOORS", 1305, t, 0.36, "right", size=118)
        big(f, "1, 2 AND 3 BEDROOMS", 1430, t, 0.52, "left", size=86)
        return f

    return [
        (2.6, hook),
        (2.4, clue([bedroom, bathroom], 1, ["NORTHERN", "SRI LANKA"], set(), {0})),
        (2.4, clue([living, dining], 2, ["2 KM FROM", "A FAMOUS FORT"], {0}, {1, 5})),
        (2.4, clue([gym, dusk], 3, ["NEAR NALLUR", "KANDASWAMY KOVIL"], {0, 1, 5}, {4})),
        (2.6, reveal),
        (2.8, listing),
        (3.4, end_card(pool, "YARL ROYAL PALACE", "lankanewhomes.com/projects/yarl-royal-palace-jaffna", ["WHICH CLUE", "GAVE IT AWAY?"], sub="Comment 1, 2 or 3")),
    ], "pushup"


# ============================== 3. THIS OR THAT ==============================
def reel_3():
    golf_view = Photo(f"{P}/the-golf-colombo-08/the-golf-colombo-08_royal-colombo-golf-course-view.jpg", (0.5, 0.5))
    golf_pool = Photo(f"{P}/the-golf-colombo-08/the-golf-colombo-08_rooftop-pool-deck-dusk.jpg", (0.5, 0.5))
    golf_lounge = Photo(f"{P}/the-golf-colombo-08/the-golf-colombo-08_rooftop-lounge-evening.jpg", (0.5, 0.5))
    glen_out = Photo(f"{P}/glenhaven-nuwara-eliya/glenhaven-nuwara-eliya_building-exterior.jpg", (0.5, 0.5))
    glen_living = Photo(f"{P}/glenhaven-nuwara-eliya/glenhaven-nuwara-eliya_living-room.jpg", (0.5, 0.5))
    glen_bed = Photo(f"{P}/glenhaven-nuwara-eliya/glenhaven-nuwara-eliya_bedroom.jpg", (0.5, 0.5))
    top_src = Image.open(f"{P}/the-golf-colombo-08/the-golf-colombo-08_rooftop-pool-deck-dusk.jpg").convert("RGB")
    bot_src = Image.open(f"{P}/glenhaven-nuwara-eliya/glenhaven-nuwara-eliya_building-exterior.jpg").convert("RGB")

    def half(src, h, zoom, fy=0.5):
        k = max(W / src.width, h / src.height) * zoom
        im = src.resize((int(src.width * k) + 1, int(src.height * k) + 1), Image.BILINEAR)
        x, y = (im.width - W) // 2, int((im.height - h) * fy)
        return im.crop((x, y, x + W, y + h)).convert("RGBA")

    def split(t, dur, question=True, slide=True):
        f = Image.new("RGBA", (W, H), (0, 0, 0, 255))
        e = ease_out(t / 0.45) if slide else 1.0
        put(f, half(top_src, 960, 1.0 + 0.05 * t / dur), -W * (1 - e), 0)
        put(f, half(bot_src, 960, 1.0 + 0.05 * t / dur, 0.62), W * (1 - e), 960)
        dim(f, 0.22)
        ImageDraw.Draw(f).rectangle([0, 954, W, 966], fill=WHITE + (255,))
        badge = Image.new("RGBA", (190, 190), (0, 0, 0, 0))
        ImageDraw.Draw(badge).ellipse([0, 0, 189, 189], fill=ORANGE + (255,), outline=WHITE + (255,), width=8)
        orr = text_img("OR", 84, color=INK, weight=900, shadow=False)
        badge.alpha_composite(orr, (95 - orr.width // 2, 95 - orr.height // 2))
        place(f, badge, W / 2, 960, t, 0.4, 0.4, "pop")
        return f

    def hook(t, dur):
        f = split(t, dur)
        big(f, "CITY ROOFTOP", 640, t, 0.55, "left", size=120)
        big(f, "HILL COUNTRY", 1290, t, 0.75, "right", size=120)
        label(f, "WHICH WOULD YOU PICK?", 470, t, 1.1, "drop", size=50)
        return f

    def option(photo, number, place_name, lines, zoom_in=True):
        def draw(t, dur):
            f = photo.frame(t / dur, zoom_in)
            dim(f, 0.18)
            num = text_img(number, 150, color=INK, weight=900, box=ORANGE, box_pad=(46, 4), shadow=False)
            place(f, num, 150, 520, t, 0.05, 0.4, "pop")
            if place_name:
                say(f, place_name, 270, 520, 64, t, 0.2, "left", anchor="l", weight=900, width=80)
            for i, line in enumerate(lines):
                big(f, line, 1300 + i * 116, t, 0.25 + i * 0.16, "rise", size=104)
            return f
        return draw

    def vote(t, dur):
        f = split(t, dur, slide=False)
        pulse = 1 + 0.05 * math.sin(t * 7)
        for number, y in (("1", 520), ("2", 1400)):
            num = text_img(number, 210, color=INK, weight=900, box=ORANGE, box_pad=(60, 4), shadow=False)
            num = num.resize((int(num.width * pulse), int(num.height * pulse)), Image.BICUBIC)
            place(f, num, W / 2, y, t, 0.1, 0.4, "pop")
        big(f, "COMMENT 1 OR 2", 760, t, 0.5, "stamp", size=112)
        return f

    def both(t, dur):
        f = golf_lounge.frame(t / dur)
        dim(f, 0.52)
        big(f, "1 OR 2?", 760, t, 0.1, "pop", size=200)
        say(f, "Tell us in the comments", W / 2, 910, 40, t, 0.4, "rise", weight=600)
        label(f, "THE GOLF, COLOMBO 08", 1040, t, 0.6, "left", size=42)
        label(f, "GLENHAVEN, NUWARA ELIYA", 1126, t, 0.75, "right", size=42)
        say(f, "Both listed on lankanewhomes.com", W / 2, 1226, 30, t, 0.95, "rise", box=WHITE, color=INK, weight=600, box_pad=(26, 14))
        say(f, "LINK IN BIO", W / 2, 1312, 25, t, 1.1, "rise", box=INK, color=WHITE, weight=700, box_pad=(22, 12))
        return f

    return [
        (2.8, hook),
        (2.0, option(golf_view, "1", "COLOMBO 08", ["OVERLOOKS THE", "GOLF COURSE"])),
        (2.0, option(golf_lounge, "1", "", ["ROOFTOP POOLS", "AND TERRACE"], False)),
        (2.0, option(glen_living, "2", "NUWARA ELIYA", ["HILL-COUNTRY", "VIEWS"])),
        (2.0, option(glen_bed, "2", "", ["ONLY 12", "RESIDENCES"], False)),
        (2.8, vote),
        (3.4, both),
    ], "push"


# ============================== 4. COUNTDOWN ==============================
def reel_4():
    aerial = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_aerial-view-01.jpg", (0.5, 0.5))
    meadow = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_villas-and-meadow.jpg", (0.5, 0.5))
    stream = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_yoga-meditation-deck.jpg", (0.5, 0.5))
    living = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_living-dining.jpg", (0.5, 0.5))
    bedroom = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_bedroom-01.jpg", (0.5, 0.5))
    plunge = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_type-b-deck-plunge-pool.jpg", (0.4, 0.5))
    terrace = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_roof-terrace-pool.jpg", (0.4, 0.5))
    front = Photo(f"{P}/vyan-villas-ella/vyan-villas-ella_villa-pool-front.jpg", (0.5, 0.5))

    def tracker(f, current, t):
        """3 - 2 - 1 across the top: the number being shown is orange."""
        for i, n in enumerate((3, 2, 1)):
            on = n == current
            done = n > current
            img = text_img(str(n), 54, color=INK if on else WHITE, weight=900, box=ORANGE if on else (INK if done else (70, 78, 82)), box_pad=(30, 6), shadow=False)
            put(f, img, W - 330 + i * 96, 430, 1.0 if on or done else 0.75)

    def hook(t, dur):
        f = aerial.frame(t / dur)
        dim(f, 0.34)
        num = text_img("3", 330, color=INK, weight=900, box=ORANGE, box_pad=(70, 0), shadow=False)
        place(f, num, W / 2, 660, t, 0.0, 0.4, "stamp")
        big(f, "REASONS THESE VILLAS", 960, t, 0.3, "rise", size=100)
        big(f, "ARE DIFFERENT", 1075, t, 0.45, "rise", size=120)
        say(f, "WAIT FOR NUMBER 1", W / 2, 1240, 44, t, 0.95, "pop", box=WHITE, color=INK, weight=800)
        return f

    def reason(photo, n, lines, first=True, zoom_in=True):
        def draw(t, dur):
            f = photo.frame(t / dur, zoom_in)
            dim(f, 0.18)
            tracker(f, n, t)
            if first:
                num = text_img(str(n), 250, color=INK, weight=900, box=ORANGE, box_pad=(56, 0), shadow=False)
                place(f, num, 190, 1130, t, 0.0, 0.36, "stamp")
            for i, line in enumerate(lines):
                big(f, line, 1340 + i * 112, t, 0.22 + i * 0.15, "left", size=100)
            return f
        return draw

    def name(t, dur):
        f = front.frame(t / dur)
        dim(f, 0.3)
        big(f, "VYAN VILLAS", 860, t, 0.05, "drop", size=160)
        label(f, "FOREST VILLAS IN ELLA", 1010, t, 0.4, "pop", size=52)
        say(f, "2 AND 3 BEDROOMS", W / 2, 1110, 44, t, 0.6, "rise", weight=800, tracking=3)
        return f

    return [
        (2.6, hook),
        (1.9, reason(meadow, 3, ["FIVE ACRES", "OF FOREST"])),
        (1.7, reason(stream, 3, ["BESIDE A", "NATURAL STREAM"], False, False)),
        (1.9, reason(living, 2, ["FULLY", "FURNISHED"])),
        (1.7, reason(bedroom, 2, ["READY AT", "HANDOVER"], False, False)),
        (2.0, reason(plunge, 1, ["A PRIVATE", "PLUNGE POOL"])),
        (1.9, reason(terrace, 1, ["WITH EVERY", "VILLA"], False, False)),
        (2.4, name),
        (3.4, end_card(front, "VYAN VILLAS ELLA", "lankanewhomes.com/projects/vyan-villas-ella", ["WHICH ONE", "WON YOU OVER?"], sub="Comment 1, 2 or 3")),
    ], "zoom"


# ============================== 5. QUICK QUIZ (LAND) ==============================
def reel_5():
    L = f"{P}/the-highway/the-highway_photo-"
    air1 = Photo(L + "05.webp", (0.5, 0.5), full=True)
    air2 = Photo(L + "03.webp", (0.5, 0.45), full=True)
    air3 = Photo(L + "08.webp", (0.5, 0.5), full=True)
    road = Photo(L + "06.webp", (0.5, 0.5), full=True)
    plot = Photo(L + "04.webp", (0.5, 0.5), full=True)
    OPTIONS = [("A", "100 PERCHES"), ("B", "160 PERCHES"), ("C", "200 PERCHES")]

    def options(f, t, start, answer=None, answer_t=0.0):
        for i, (letter, text) in enumerate(OPTIONS):
            y = 1010 + i * 150
            st = start + i * 0.14
            if t < st:
                continue
            right = answer == letter
            fill = GREEN if right and t >= answer_t else (255, 255, 255)
            fg = WHITE if right and t >= answer_t else INK
            row = Image.new("RGBA", (820, 122), fill + (255,))
            d = ImageDraw.Draw(row)
            d.rectangle([0, 0, 122, 122], fill=(GREEN if not (right and t >= answer_t) else (31, 31, 31)) + (255,))
            a = text_img(letter, 76, color=WHITE, weight=900, shadow=False)
            row.alpha_composite(a, (61 - a.width // 2, 61 - a.height // 2))
            tx = text_img(text, 64, color=fg, weight=900, width=85, shadow=False)
            row.alpha_composite(tx, (170 - 40, 61 - tx.height // 2))
            alpha, dx, dy, _ = anim_state("left", (t - st) / 0.4)
            if answer and t >= answer_t and not right:
                alpha *= 0.35
            scale = 1.0
            if right and t >= answer_t:
                scale = 1 + 0.08 * (1 - ease_out((t - answer_t) / 0.4))
                row = row.resize((int(820 * scale), int(122 * scale)), Image.BICUBIC)
            put(f, row, W / 2 - row.width / 2 + dx, y - row.height / 2, alpha)

    def question(t, dur):
        f = air1.frame(t / dur)
        dim(f, 0.46)
        label(f, "QUICK QUIZ", 470, t, 0.0, "drop", size=50, accent=GREEN)
        big(f, "HOW MANY PERCHES", 690, t, 0.1, "pop", size=110)
        big(f, "IN 1 ACRE?", 820, t, 0.28, "pop", size=140)
        options(f, t, 0.7)
        if t > 1.3:
            bar(f, 130, 1470, 820, 16, 1 - (t - 1.3) / (dur - 1.3), color=GREEN)
            say(f, "COMMENT A, B OR C", W / 2, 1535, 36, t, 1.3, "rise", weight=800, tracking=3)
        return f

    def answer(t, dur):
        f = air1.frame(1.0)
        dim(f, 0.46)
        label(f, "THE ANSWER", 470, t, 0.0, "drop", size=50, accent=GREEN)
        big(f, "160 PERCHES", 690, t, 0.05, "stamp", size=140)
        big(f, "= 1 ACRE", 820, t, 0.3, "pop", size=140)
        options(f, t + 5, 0.0, "B", 5.25)
        say(f, "DID YOU GET IT?", W / 2, 1500, 44, t, 0.9, "rise", weight=800, tracking=3)
        return f

    def fact(photo, tag, lines, zoom_in=True, y=1330):
        def draw(t, dur):
            f = photo.frame(t / dur, zoom_in)
            dim(f, 0.22)
            if tag:
                label(f, tag, 470, t, 0.05, "drop", size=44, accent=GREEN)
            for i, line in enumerate(lines):
                big(f, line, y + i * 114, t, 0.2 + i * 0.15, "rise", size=104)
            return f
        return draw

    def price(t, dur):
        f = air3.frame(t / dur)
        dim(f, 0.4)
        say(f, "PRICED FROM", W / 2, 780, 46, t, 0.05, "rise", weight=800, tracking=4)
        value = 2_100_000 * ease_out((t - 0.2) / 0.9)
        if t > 0.2:
            amount = text_img("LKR " + money(value if t < 1.1 else 2_100_000), 118, weight=900, width=78, box=GREEN, color=WHITE, box_pad=(40, 22))
            put(f, amount, W / 2 - amount.width / 2, 930 - amount.height / 2, clamp((t - 0.2) * 5))
        say(f, "PER PERCH", W / 2, 1075, 46, t, 1.2, "pop", box=WHITE, color=INK, weight=800)
        return f

    return [
        (4.6, question),
        (2.6, answer),
        (1.9, fact(air2, "NOW PICTURE YOUR PLOT", ["LAND FOR SALE", "IN KOTTAWA"])),
        (2.0, fact(road, None, ["PLOTS FROM", "6.15 PERCHES"], False, 1290)),
        (2.2, fact(plot, None, ["1.1 KILOMETRES TO THE", "EXPRESSWAY"], True, 1290)),
        (2.6, price),
        (3.4, end_card(air2, "THE HIGHWAY, KOTTAWA", "lankanewhomes.com/land/the-highway", ["WHAT WAS", "YOUR ANSWER?"], accent=GREEN, sub="Comment A, B or C")),
    ], "fade"


if __name__ == "__main__":
    which, out = int(sys.argv[1]), sys.argv[2]
    scenes, transition = [reel_1, reel_2, reel_3, reel_4, reel_5][which - 1]()
    still = float(sys.argv[sys.argv.index("--still") + 1]) if "--still" in sys.argv else None
    render(scenes, out, transition, still=still)
