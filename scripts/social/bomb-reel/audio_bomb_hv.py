import sys; sys.path.insert(0,'.')
from audio_lib import *
TOTAL=(7*56+100)/30
M=Mix(TOTAL)
# music: warm pad chords, soft pulse
ch=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]]
for i in range(0,int(TOTAL//4)+1):
    f=ch[i%4]; M.add(pad(f,4.4,0.07),i*4.0)
for k in range(int(TOTAL*2)):
    M.add(hat(),k*0.5,g=0.5)
    if k%4==0: M.add(kick(),k*0.5,g=0.35)
# bomb on scene 0
M.add(boom(),(10)/30-0.05,g=1.0); M.add(boom(),(17)/30-0.05,g=1.1)
for s in range(1,8): M.add(whoosh(),(s*56-6)/30,g=0.55)
M.add(whoosh(),(7*56+2)/30,g=0.6); M.add(whoosh(),(7*56+14)/30,g=0.5)
lines=["Havelock Signature.","Forty-nine residences.","Skyline views.","A rooftop pool and gym.","Six levels of parking.","Luxury residences.","Signature living.","Find yours at lankanewhomes dot com."]
import os; os.makedirs('a_hv',exist_ok=True)
for i,t in enumerate(lines):
    d=tts(t,f'a_hv/v{i}',rate='+10%'); t0=(i*56+(20 if i==0 else 3))/30 if i<7 else (7*56+18)/30
    M.voice(f'a_hv/v{i}.wav',t0); print(i,round(d,2),'at',round(t0,2))
M.write('mix_hv.wav'); print('ok',TOTAL)
