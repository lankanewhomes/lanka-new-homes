"""build_map_reel.py CFG.json : TTS (Ava) for intro/callouts/routes/end -> durations -> Remotion props + mixed audio.
cfg: id, kind(project|land), geo (path to mapgeo.json), title[], city, cardTitle, cardCity, photos[], endPhoto, price, url,
     intro_voice, callouts [[l1,l2],...], callout_voice [..], end_voice, routes [{key,label}], accent"""
import sys, json, os, math, subprocess, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from audio_lib import *
cfg = json.load(open(sys.argv[1])); W = os.path.dirname(os.path.abspath(__file__)); ID = cfg['id']; D = f'{W}/a_{ID}'; os.makedirs(D, exist_ok=True)
geo = json.load(open(cfg['geo']))
def dur(p): w = wave.open(p); return w.getnframes() / w.getframerate()
def say(text, name, rate='+8%', speed=1.0):
    d = tts(text, f'{D}/{name}', rate=rate)
    af = 'silenceremove=stop_periods=-1:stop_duration=0.5:stop_threshold=-45dB' + (f',atempo={speed}' if speed != 1 else '')
    subprocess.run([FF, '-y', '-loglevel', 'error', '-i', f'{D}/{name}.wav', '-af', af, f'{D}/{name}_t.wav'], check=True)
    return f'{D}/{name}_t.wav', dur(f'{D}/{name}_t.wav')
intro = say(cfg['intro_voice'], 'intro', '+0%')
call = [say(t, f'c{i}', '+8%') for i, t in enumerate(cfg['callout_voice'])]
callDur = [math.ceil(d * 30) + 8 for _, d in call]
rt = []
for i, r in enumerate(cfg['routes']):
    m = geo['routes'][r['key']]['min']; nm = r['label'].title().replace("'S", "'s")
    rt.append(say(f"{nm}. {m} {'minute' if m == 1 else 'minutes'}.", f'r{i}', '+12%', 1.3))
end = say(cfg['end_voice'], 'end', '+12%', 1.06)
HERO, RLEN, TAIL = 72, 72, 200
starts = [HERO + 4]
for d in callDur[:-1]: starts.append(starts[-1] + d)
R0 = starts[-1] + callDur[-1] + 14; END = R0 + len(rt) * RLEN
need = max(TAIL, int((end[1] + 0.9) * 30) + 20)
TOT = END + need; TOTAL = TOT / 30
props = {k: cfg[k] for k in ('accent', 'title', 'cardTitle', 'cardCity', 'city', 'routes', 'photos', 'callouts', 'endPhoto', 'price', 'url')}
props.update({'geo': geo, 'base': f'maps/{ID}/basemap.png', 'callDur': callDur})
json.dump(props, open(f'{W}/props_{ID}.json', 'w'))
# audio
M = Mix(TOTAL); chords = [[110, 164.8, 220, 261.6], [87.3, 130.8, 174.6, 220], [130.8, 196, 261.6, 329.6], [98, 146.8, 196, 246.9]]
for k in range(int(TOTAL / 4) + 2): M.add(pad(chords[k % 4], 4.6, 0.07), k * 4.0 - 0.2)
t = 2.4
while t < END / 30 - 0.1: M.add(kick(), t, 0, 0.55); M.add(hat(), t + 0.25, 0.3, 0.7); t += 0.5
M.add(boom(), 0.35, 0, 0.9); M.add(whoosh(0.5), 1.9, 0.2, 0.6); M.add(boom(0.9), 2.4, 0, 0.55)
M.voice(intro[0], 0.6)
for i, s in enumerate(starts): M.add(ping(1100 + i * 40, 0.35), s / 30, 0.2 * (1 if i % 2 else -1), 0.35); M.voice(call[i][0], s / 30 + 0.05)
for i in range(len(rt)):
    t0 = (R0 + i * RLEN) / 30; M.add(whoosh(0.5), t0 - 0.12, 0.25 if i % 2 else -0.25, 0.6); M.add(ping(660 + i * 110), t0 + 26 / 30, 0.2, 1.0); M.voice(rt[i][0], t0 + 0.3)
M.add(boom(1.8), END / 30, 0, 1.0)
for k, f in enumerate([523.3, 659.3, 784, 1046.5]): M.add(bell(f), END / 30 + 0.2 + k * 0.28, 0.2 * (k % 2 * 2 - 1), 0.8)
M.voice(end[0], END / 30 + 0.45)
M.write(f'{W}/mix_{ID}.wav', 1.2); print(ID, 'frames', TOT, 'secs', round(TOTAL, 1), 'callDur', callDur, 'routeVoice', [round(r[1], 2) for r in rt], 'end', round(end[1], 2))
