import sys; sys.path.insert(0,'.')
from audio_lib import *
durs=[4.6,2.6,2.0,2.0,2.0,2.2,3.4]; st=[0]
for d in durs: st.append(st[-1]+d)
TOTAL=st[-1]
M=Mix(TOTAL)
ch=[[220,261.6,329.6],[174.6,220,261.6],[261.6,329.6,392],[196,246.9,293.7]]
for i in range(int(TOTAL//4)+1): M.add(pad(ch[i%4],4.4,0.06),i*4.0)
for k in range(int(TOTAL*2)):
    M.add(hat(),k*0.5,g=0.4)
# ticking timer during the question (1.3s -> 4.6s)
t=1.3
while t<4.5: M.add(tick(),t,g=0.5); t+=0.5
M.add(boom(),st[1]+0.05,g=0.9); M.add(ping(988),st[1]+0.35,g=0.9)
for s in range(1,7): M.add(whoosh(),st[s]-0.1,g=0.5)
lines=[(0.3,"Quick quiz. How many homes are in this Colombo 03 tower?"),(st[1]+0.5,"Sixty-six homes, on eleven floors."),(st[2]+0.25,"Two and three bedroom homes."),(st[3]+0.25,"A rooftop pool and gym."),(st[4]+0.25,"Five levels of secure parking."),(st[5]+0.25,"Just 100 metres from Sheraton."),(st[6]+0.2,"Your answer? Comment A, B or C.")]
import os; os.makedirs('a_quiz',exist_ok=True)
for i,(t0,tx) in enumerate(lines):
    d=tts(tx,f'a_quiz/v{i}',rate='+8%'); M.voice(f'a_quiz/v{i}.wav',t0); print(i,round(t0,2),round(d,2))
M.write('mix_quiz.wav'); print('ok',TOTAL)
