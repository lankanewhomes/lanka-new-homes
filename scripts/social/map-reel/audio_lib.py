import numpy as np, subprocess, wave, os, json
SR=44100; FF='/Volumes/MyStorage/LNH/lankanewhomes/.venv-social/lib/python3.14/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1'
rng=np.random.default_rng(11)
def lp(x,a):
    y=np.zeros_like(x); s=0.0
    for i,v in enumerate(x): s+=a*(v-s); y[i]=s
    return y
def kick(d=0.4):
    t=np.arange(int(SR*d))/SR; f=45+110*np.exp(-t*22); ph=2*np.pi*np.cumsum(f)/SR
    return np.sin(ph)*np.exp(-t*7.5)*0.9
def boom(d=1.5):
    t=np.arange(int(SR*d))/SR; f=38+60*np.exp(-t*8); ph=2*np.pi*np.cumsum(f)/SR
    return np.tanh(np.sin(ph)*2.2)*np.exp(-t*2.6)*0.9
def hat(d=0.06):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,0.25); return n*np.exp(-t*60)*0.2
def whoosh(d=0.6):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); y=np.zeros_like(n); s=0.0
    for i in range(len(n)):
        a=0.02+0.5*(i/len(n))**2; s+=a*(n[i]-s); y[i]=s
    return y*(t/d)**2*2.2
def ping(f=880,d=0.9):
    t=np.arange(int(SR*d))/SR; return (np.sin(2*np.pi*f*t)+0.3*np.sin(2*np.pi*f*2*t))*np.exp(-t*5)*0.3
def bell(f,d=1.6):
    t=np.arange(int(SR*d))/SR; return (np.sin(2*np.pi*f*t)+0.4*np.sin(2*np.pi*f*2.76*t)+0.2*np.sin(2*np.pi*f*5.4*t))*np.exp(-t*3.2)*0.25
def tick(d=0.05):
    t=np.arange(int(SR*d))/SR; n=rng.standard_normal(len(t)); n=n-lp(n,0.3); return n*np.exp(-t*90)*0.5+np.sin(2*np.pi*180*t)*np.exp(-t*60)*0.4
def pad(freqs,d,vol=0.06):
    t=np.arange(int(SR*d))/SR; s=np.zeros_like(t)
    for f in freqs:
        for det in (-0.4,0,0.4): s+=np.sin(2*np.pi*(f+det)*t)+0.35*np.sin(2*np.pi*2*(f+det)*t)
    s/=len(freqs)*3; env=np.minimum(1,t/0.8)*np.minimum(1,(d-t)/1.0); return s*env*vol
class Mix:
    def __init__(s,total): s.N=int(SR*total); s.m=np.zeros((2,s.N)); s.vo=np.zeros(s.N); s.duck=np.ones(s.N); s.total=total
    def add(s,sig,t0,pan=0.0,g=1.0):
        i=int(t0*SR)
        if i<0 or i>=s.N: return
        n=min(len(sig),s.N-i); s.m[0,i:i+n]+=sig[:n]*g*(1-max(0,pan)); s.m[1,i:i+n]+=sig[:n]*g*(1+min(0,pan))
    def voice(s,wavpath,t0,maxdur=None):
        w=wave.open(wavpath); d=np.frombuffer(w.readframes(w.getnframes()),dtype=np.int16).astype(float)/32768; d=d.reshape(-1,w.getnchannels())[:,0]; d/=np.abs(d).max()
        i=int(t0*SR); n=min(len(d),s.N-i); s.vo[i:i+n]+=d[:n]
        a=max(0,i-int(.12*SR)); b=min(s.N,i+n+int(.25*SR)); s.duck[a:b]=0.32
    def write(s,path,fade=1.2):
        k=int(0.12*SR); duck=np.convolve(s.duck,np.ones(k)/k,mode='same'); fd=np.minimum(1,(s.total-np.arange(s.N)/SR)/fade)
        o=np.tanh((s.m*duck*fd+s.vo*1.15)*1.05); o/=np.abs(o).max()/0.92
        with wave.open(path,'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((o.T*32767).astype(np.int16).tobytes())
def tts(text,out,voice='en-US-AvaNeural',rate='+4%'):
    r=subprocess.run(['./ttsenv/bin/edge-tts','--voice',voice,f'--rate={rate}','--text',text,'--write-media',out+'.mp3'],capture_output=True)
    subprocess.run([FF,'-y','-loglevel','error','-i',out+'.mp3','-ar','44100','-ac','1',out+'.wav'],check=True)
    w=wave.open(out+'.wav'); return w.getnframes()/w.getframerate()
