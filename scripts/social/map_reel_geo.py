"""Builds the map data for a "minutes from" map reel (OpenStreetMap roads + OSRM driving routes). Facts only: roads and routes are real data,
travel times are OSRM driving estimates without traffic (say "approximate" in the caption).

  python3 scripts/social/map_reel_geo.py OUTDIR LAT LNG [--landmarks "Name A|Name B|Name C|Name D"] [--radius 5000]

With --landmarks each name is searched near the project (OSM name match; "search=>DISPLAY NAME" shows a different label). Without it the nearest notable
places are listed as candidates (OUTDIR/candidates.json) and 4 are picked automatically; re-run with --landmarks to choose them yourself.
Candidate names come from OSM and can be junk (pre-schools, pump houses): always review the printed list and pick real, well-known places.
Writes OUTDIR/mapgeo.json (w, h, project, routes{NAME:{min,km,pts,dest}}), OUTDIR/basemap.png (dark roads, 2x supersampled) and OUTDIR/landmarks.json.
"""
import json, math, os, sys, time, urllib.parse, urllib.request
from PIL import Image, ImageDraw

OVERPASS = ['https://overpass.openstreetmap.fr/api/interpreter', 'https://z.overpass-api.de/api/interpreter', 'https://overpass-api.de/api/interpreter']  # several public servers; they are often at capacity
OSRM = 'https://router.project-osrm.org/route/v1/driving/'
S = 0.65            # px per metre in the reel's map space
SS = 2              # supersampling for the basemap
UA = {'User-Agent': 'lankanewhomes-reel-builder/1.0'}

def http(url, data=None, tries=4, timeout=90):
    for t in range(tries):
        try:
            req = urllib.request.Request(url, data=data, headers=UA)
            return json.loads(urllib.request.urlopen(req, timeout=timeout).read())
        except Exception as e:
            last = e; time.sleep(4 + 6 * t)
    raise last

def overpass(q):
    for ep in OVERPASS:
        try: return http(ep, urllib.parse.urlencode({'data': q}).encode(), 3)
        except Exception as e: print('overpass', ep, 'failed', e)
    raise SystemExit('overpass unavailable')

def mercator(lat, lng, lat0, lng0):
    R = 6378137.0
    x = math.radians(lng - lng0) * R * math.cos(math.radians(lat0))
    y = -math.radians(lat - lat0) * R   # y down
    return x * S, y * S

def hav(a, b):
    R = 6371000; p1, p2 = math.radians(a[0]), math.radians(b[0]); dl = math.radians(b[1] - a[1]); dp = p2 - p1
    h = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))

def route(a, b):
    r = http(f'{OSRM}{a[1]},{a[0]};{b[1]},{b[0]}?overview=full&geometries=geojson')['routes'][0]
    return r['duration'] / 60.0, r['distance'] / 1000.0, [(c[1], c[0]) for c in r['geometry']['coordinates']]

CATS = [('hospital', '["amenity"="hospital"]'), ('mall', '["shop"~"mall|supermarket"]'), ('school', '["amenity"~"university|college|school"]'),
        ('interchange', '["highway"="motorway_junction"]'), ('station', '["railway"="station"]'), ('golf', '["leisure"="golf_course"]'), ('park', '["leisure"="park"]')]

def center(el): return (el['lat'], el['lon']) if 'lat' in el else (el['center']['lat'], el['center']['lon'])

def auto_landmarks(lat, lng, radius):
    found = []
    for cat, flt in CATS:
        q = f'[out:json][timeout:60];nwr{flt}["name"](around:{radius},{lat},{lng});out center 40;'
        els = overpass(q).get('elements', [])
        els = [e for e in els if e.get('tags', {}).get('name') and not e['tags']['name'].isascii() is False]
        els.sort(key=lambda e: hav((lat, lng), center(e)))
        for e in els[:3]: found.append((cat, e['tags']['name'], center(e)))
    return found

def find_named(name, lat, lng, radius):
    q = f'[out:json][timeout:60];nwr["name"~"{name}",i](around:{radius},{lat},{lng});out center 10;'
    els = overpass(q).get('elements', [])
    if not els: return None
    els.sort(key=lambda e: hav((lat, lng), center(e)))
    return els[0]['tags']['name'], center(els[0])

def main():
    a = sys.argv[1:]; out = a[0]; lat, lng = float(a[1]), float(a[2]); os.makedirs(out, exist_ok=True)
    names = None; radius = 5000
    if '--landmarks' in a: names = a[a.index('--landmarks') + 1].split('|')
    if '--radius' in a: radius = int(a[a.index('--radius') + 1])
    cands = []
    if names:
        for n in names:
            srch, _, disp = n.partition('=>')
            if '@' in srch:  # "Name@lat,lng=>DISPLAY": exact point (look it up first with an Overpass query)
                nm, _, ll = srch.partition('@'); la, lo = ll.split(','); r = (nm.strip(), (float(la), float(lo)))
            else: r = find_named(srch.strip(), lat, lng, max(radius, 8000))
            print(n, '->', r)
            if r: cands.append(('named', (disp or r[0]).strip().upper(), r[1]))
    else:
        for cat, name, pt in auto_landmarks(lat, lng, radius): cands.append((cat, name, pt))
        json.dump([{'cat': c, 'name': n, 'lat': p[0], 'lng': p[1]} for c, n, p in cands], open(f'{out}/candidates.json', 'w'), indent=1)
    routes = []
    seen = set()
    for cat, name, pt in cands:
        key = name.lower()
        if key in seen: continue
        seen.add(key)
        try: m, km, geom = route((lat, lng), pt)
        except Exception as e: print('route fail', name, e); continue
        routes.append({'cat': cat, 'name': name, 'min': m, 'km': km, 'geom': geom, 'dest': pt}); print(f'{cat:12s} {name[:40]:40s} {m:5.1f} min {km:5.1f} km')
    if not names:
        # keep the 4 nearest by driving time, at most one per category, minutes 1.5..14
        routes = [r for r in routes if 1.5 <= r['min'] <= 14]; routes.sort(key=lambda r: r['min']); pick = []; used = set()
        for r in routes:
            if r['cat'] in used: continue
            used.add(r['cat']); pick.append(r)
            if len(pick) == 4: break
        routes = pick
    routes.sort(key=lambda r: r['min'])
    # frame: bbox around project and all routes with a wide margin so the camera never leaves the basemap
    pts = [(lat, lng)] + [p for r in routes for p in r['geom']]
    xs = [mercator(p[0], p[1], lat, lng)[0] for p in pts]; ys = [mercator(p[0], p[1], lat, lng)[1] for p in pts]
    half = max(3200.0, max(abs(v) for v in xs + ys) + 1800.0)
    W = H = int(half * 2)
    ox = oy = half
    proj = (ox, oy)
    R = {}
    for r in routes:
        p = [(mercator(c[0], c[1], lat, lng)[0] + ox, mercator(c[0], c[1], lat, lng)[1] + oy) for c in r['geom']]
        d = (mercator(r['dest'][0], r['dest'][1], lat, lng)[0] + ox, mercator(r['dest'][0], r['dest'][1], lat, lng)[1] + oy)
        R[r['name'].upper()] = {'min': max(1, round(r['min'])), 'km': round(r['km'], 1), 'pts': [list(x) for x in p], 'dest': list(d)}
    json.dump({'w': W, 'h': H, 'project': list(proj), 'routes': R}, open(f'{out}/mapgeo.json', 'w'))
    json.dump([{k: r[k] for k in ('cat', 'name', 'min', 'km', 'dest')} for r in routes], open(f'{out}/landmarks.json', 'w'), indent=1)
    # roads
    dy = half / S / 111320.0; dx = dy / math.cos(math.radians(lat))
    bbox = f'{lat - dy},{lng - dx},{lat + dy},{lng + dx}'
    q = f'[out:json][timeout:180];way["highway"~"^(motorway|motorway_link|trunk|trunk_link|primary|primary_link|secondary|secondary_link|tertiary|tertiary_link|unclassified|residential|living_street)$"]({bbox});out geom;'
    data = overpass(q); print('roads', len(data['elements']))
    style = {'motorway': ((154, 167, 191), 13), 'trunk': ((141, 153, 176), 11), 'primary': ((141, 153, 176), 10), 'secondary': ((122, 134, 156), 7.5), 'tertiary': ((92, 103, 124), 5.5),
             'unclassified': ((66, 76, 94), 3.6), 'residential': ((58, 67, 83), 3.0), 'living_street': ((58, 67, 83), 2.4)}
    im = Image.new('RGB', (W * SS, H * SS), (27, 30, 36)); dr = ImageDraw.Draw(im)
    order = ['living_street', 'residential', 'unclassified', 'tertiary', 'secondary', 'primary', 'trunk', 'motorway']
    ways = {k: [] for k in order}
    for el in data['elements']:
        t = el.get('tags', {}).get('highway', '').replace('_link', ''); 
        if t in ways and el.get('geometry'): ways[t].append([(mercator(g['lat'], g['lon'], lat, lng)[0] + ox, mercator(g['lat'], g['lon'], lat, lng)[1] + oy) for g in el['geometry']])
    for t in order:
        col, wd = style[t]
        for w in ways[t]:
            dr.line([(x * SS, y * SS) for x, y in w], fill=col, width=max(1, int(wd * SS)), joint='curve')
    im = im.resize((W, H), Image.LANCZOS); im.save(f'{out}/basemap.png'); print('basemap', W, H)

if __name__ == '__main__': main()
