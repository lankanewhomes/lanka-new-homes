import subprocess, sys, math
from PIL import Image, ImageDraw, ImageFont
R='/Users/rupansinnarajah/Desktop/lankanewhomes'; S=sys.argv[1]; OUT=sys.argv[2]
FF=R+'/node_modules/ffmpeg-static/ffmpeg'; FONT=R+'/scripts/social/assets/fonts/Archivo-VF.ttf'
W,H,FPS=1080,1920,30
import os
PAPER=tuple(int(x) for x in os.environ.get('BGC','214,232,238').split(','))
LIGHTBG=os.environ.get('LIGHT','1')=='1'
INK=(21,20,26); LINE=(226,221,208); MUTED=(107,99,85); SAND=(255,255,255); ACC=(244,123,54)
URL='lankanewhomes.com/projects/ocean-breeze-galle'
# v10 FULL-BLEED: media fills the whole 1080x1920 frame; only logo/text sit in the UI-free area. (was v9)
# ALL-PLATFORM-safe layout (v9): Meta Reels guide (top 14% / bottom 35% / sides 6% free) + TikTok right icon column => everything inside x 72-944, y 270-1250
M=56; PX0,PX1,PY0,PY1=72,944,376,1250; BOX=(40,340,1040,1800); BW,BH=BOX[2]-BOX[0],BOX[3]-BOX[1]
LOGO_W=250; LOGO_XY=(72,150); BOXR=944; BOXBOT=1680
HP=(M,190,W-M,372); CY=1676; CH=112
def font(sz,w=400):
    f=ImageFont.truetype(FONT,sz); f.set_variation_by_axes([w,100]); return f
logo=Image.open(R+'/public/brand/lankanewhomes-logo.png').convert('RGBA')
def wl(w):
    x=Image.open(R+'/public/brand/lankanewhomes-logo-white.png').convert('RGBA'); return x.resize((w,int(x.height*w/x.width)),Image.LANCZOS)
def lg(w): return logo.resize((w,int(logo.height*w/logo.width)),Image.LANCZOS)
def fit(txt,sz,maxw,w=400):
    while font(sz,w).getlength(txt)>maxw: sz-=2
    return sz
def scrim():
    s=Image.new('RGBA',(W,H),(0,0,0,0)); d=ImageDraw.Draw(s)
    for y in range(0,560):
        a=int(150*(1-y/560)**1.6); d.line([(0,y),(W,y)],fill=(0,0,0,a))
    return s
SCRIM=scrim()
def ease(x): x=max(0,min(1,x)); return 1-(1-x)**3
def bg():
    im=Image.new('RGB',(W,H),PAPER); d=ImageDraw.Draw(im); g=tuple(c+(-26 if LIGHTBG else 14) for c in PAPER)
    for x in range(0,W,108): d.line([(x,0),(x,H)],fill=g,width=3)
    for y in range(0,H,108): d.line([(0,y),(W,y)],fill=g,width=3)
    LL=lg(LOGO_W); im.paste(LL,LOGO_XY,LL)
    return im
BASE=bg()
def photo(n):
    p=Image.open(f'{S}/ob/ocean-breeze-galle_{n}.jpg').convert('RGB'); s=BH/p.height
    return p.resize((int(p.width*s),int(p.height*s)),Image.LANCZOS)
def pic(p,fx,pan,k):
    z=1.0-0.07*k; ch=int(p.height*z); cw=int(ch*BW/BH)
    cx=int(p.width*(fx+pan*0.03*(k-.5))); cx=min(max(cx,cw//2),p.width-cw//2); cy=p.height//2
    return p.crop((cx-cw//2,cy-ch//2,cx+cw//2,cy+ch//2)).resize((BW,BH),Image.LANCZOS)
def infobox(im,head,detail,t):
    bw=620; bh=106+len(head)*54
    e=ease((t-0.1)/0.4)
    lay=Image.new('RGBA',(bw,bh),(255,255,255,160)); d=ImageDraw.Draw(lay)
    for n,line in enumerate(head): d.text((28,22+n*54),line,font=font(46,500),fill=INK)
    k=int(len(detail)*ease((t-0.35)/0.5)); d.text((28,22+len(head)*54+8),detail[:k],font=font(28),fill=MUTED); d.text((28,bh-34),'Developer renders',font=font(20),fill=MUTED)
    y=BOXBOT-bh+int((1-e)*(bh+60))
    if e>0: im.paste(lay,(72,y),lay)
def progress(im,i,N,t,dur):
    return  # v12: no progress lines under the logo
    ov=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(ov)
    gap=8; sw=(BOXR-72-gap*(N-1))/N
    for k in range(N):
        x=72+k*(sw+gap); y=306
        d.rectangle((x,y,x+sw,y+8),fill=(255,255,255,90))
        f=1 if k<i else (t/dur if k==i else 0)
        if f>0: d.rectangle((x,y,x+max(8,sw*f),y+8),fill=(255,255,255,255))
    im.paste(Image.alpha_composite(im.convert('RGBA'),ov).convert('RGB'))
BLK=(12,12,14)
CTA='Explore the project — link in bio'
wlogo=Image.open(R+'/public/brand/lankanewhomes-logo-white.png').convert('RGBA')
def frame_final(t):
    im=Image.new('RGB',(W,H),BLK); d=ImageDraw.Draw(im)
    for x in range(0,W,108): d.line([(x,0),(x,H)],fill=(40,40,45),width=3)
    for y in range(0,H,108): d.line([(0,y),(W,y)],fill=(40,40,45),width=3)
    L=wlogo.resize((LOGO_W,int(LOGO_W*wlogo.height/wlogo.width)),Image.LANCZOS); im.paste(L,LOGO_XY,L)
    e=ease(t/0.45); d=ImageDraw.Draw(im)
    T1=fit('Ocean Breeze Galle',96,860,500); d.text((72-int((1-e)*200),500),'Ocean Breeze Galle',font=font(T1,500),fill='white')
    e2=ease((t-0.12)/0.45); T2=fit('Beachfront hotel residency.',48,860,400); d.text((72-int((1-e2)*200),500+T1+24),'Beachfront hotel residency.',font=font(T2),fill=(170,170,176))
    e3=ease((t-0.3)/0.4); y=740+int((1-e3)*160)
    if e3>0:
        d.rectangle((72,y,940,y+150),fill='white')
        sz=72
        while d.textlength(CTA,font=font(sz,500))>816: sz-=2
        d.text((506,y+75),CTA,font=font(sz,500),fill=INK,anchor='mm')
    e4=ease((t-0.5)/0.4); y2=920+int((1-e4)*160)
    if e4>0:
        d.rectangle((72,y2,940,y2+110),outline='white',width=3); d.text((506,y2+55),URL,font=font(fit(URL,38,816,500),500),fill='white',anchor='mm')
    return im
def frame(sc,t,i,N):
    if sc.get('final'): return frame_final(t)
    k=t/sc['dur']
    im=BASE.copy(); im.paste(pic(sc['p'],sc['fx'],sc['pan'],k),(BOX[0],BOX[1]))
    infobox(im,sc['head'],sc['detail'],t)
    progress(im,i,N,t,sc['dur'])
    return im
sl=[('aerial-coastline-render',['Beachfront hotel','residency in Galle.'],'Galle-Colombo Road',.45),
('beachfront-tower-render',['Landmark tower','on the shoreline.'],'About 5 minutes from Galle Fort',.80),
('pool-deck-ocean-view',['Pool deck on','the beachfront.'],'Palms and a curved sundeck',.9),
('lounge-bar-sea-view',['Lounge with','sea views.'],'Floor-to-ceiling windows',.12),
('living-room-ocean-view',['Living rooms with','ocean views.'],'Opening onto a balcony',.6),
('bedroom-ocean-view',['Bedrooms with','ocean views.'],'Balcony facing the sea',.55),
('rooftop-garden-terrace',['Rooftop garden','terrace.'],'Seating areas and garden paths',.5)]
scs=[dict(p=photo(a),head=h,detail=dt,fx=fx,pan=1 if i%2 else -1,dur=1.8) for i,(a,h,dt,fx) in enumerate(sl)]
scs.append(dict(final=True,dur=2.4))
N=len(scs)
if os.environ.get('SHEET'):
    _n=int(os.environ.get('SHEETN',0)); frame(scs[_n],float(os.environ.get('SHEETT',1.5)),_n,N).save(os.environ['SHEET']); sys.exit()
FADE=int(.3*FPS)
p=subprocess.Popen([FF,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-shortest','-t',str(sum(s['dur'] for s in scs)),'-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for si,sc in enumerate(scs):
    for f in range(int(sc['dur']*FPS)):
        im=frame(sc,f/FPS,si,N)
        if si>0 and f<FADE and not sc.get('final'): im=Image.blend(frame(scs[si-1],scs[si-1]['dur'],si-1,N),im,(f+1)/FADE)
        p.stdin.write(im.tobytes())
p.stdin.close(); p.wait(); print('done',sum(s['dur'] for s in scs))
