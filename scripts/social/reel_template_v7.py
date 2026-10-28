import subprocess, sys, math
from PIL import Image, ImageDraw, ImageFont
R='/Users/rupansinnarajah/Desktop/lankanewhomes'; S=sys.argv[1]; OUT=sys.argv[2]
FF=R+'/node_modules/ffmpeg-static/ffmpeg'; FONT=R+'/scripts/social/assets/fonts/Archivo-VF.ttf'
W,H,FPS=1080,1920,30
import os
PAPER=tuple(int(x) for x in os.environ.get('BGC','247,244,238').split(','))
LIGHTBG=os.environ.get('LIGHT','1')=='1'
INK=(21,20,26); LINE=(226,221,208); MUTED=(107,99,85); SAND=(255,255,255); ACC=(244,123,54)
URL='lankanewhomes.com/projects/ocean-breeze-galle'
M=56; BOX=(M+22,192,W-M-22,1792); BW,BH=BOX[2]-BOX[0],BOX[3]-BOX[1]
HP=(M,190,W-M,372); CY=1676; CH=112
def font(sz,w=400):
    f=ImageFont.truetype(FONT,sz); f.set_variation_by_axes([w,100]); return f
logo=Image.open(R+'/public/brand/lankanewhomes-logo.png').convert('RGBA')
def wl(w):
    x=Image.open(R+'/public/brand/lankanewhomes-logo-white.png').convert('RGBA'); return x.resize((w,int(x.height*w/x.width)),Image.LANCZOS)
def lg(w): return logo.resize((w,int(logo.height*w/logo.width)),Image.LANCZOS)
def ease(x): x=max(0,min(1,x)); return 1-(1-x)**3
def bg():
    im=Image.new('RGB',(W,H),PAPER); d=ImageDraw.Draw(im); g=tuple(c+(-26 if LIGHTBG else 14) for c in PAPER)
    for x in range(0,W,108): d.line([(x,0),(x,H)],fill=g,width=3)
    for y in range(0,H,108): d.line([(0,y),(W,y)],fill=g,width=3)
    LL=lg(200); im.paste(LL,(M,40),LL)
    d.rectangle((M,170,W-M,H-M),fill=SAND,outline=LINE,width=2)
    d.text((M+22,BOX[3]+18),'Developer renders',font=font(26),fill=MUTED)
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
    bw=BW-48; bh=64+len(head)*70+70
    e=ease((t-0.1)/0.4)
    lay=Image.new('RGB',(bw,bh),'white'); d=ImageDraw.Draw(lay)
    for n,line in enumerate(head): d.text((36,30+n*70),line,font=font(60,500),fill=INK)
    k=int(len(detail)*ease((t-0.35)/0.5)); d.text((36,30+len(head)*70+14),detail[:k],font=font(34),fill=MUTED)
    y=BOX[3]-24-bh+int((1-e)*(bh+40))
    if e>0: im.paste(lay,(BOX[0]+24,y))
def progress(im,i,N,t,dur):
    ov=Image.new('RGBA',im.size,(0,0,0,0)); d=ImageDraw.Draw(ov)
    gap=8; sw=(BW-48-gap*(N-1))/N
    for k in range(N):
        x=BOX[0]+24+k*(sw+gap); y=BOX[1]+22
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
    L=wlogo.resize((240,int(240*wlogo.height/wlogo.width)),Image.LANCZOS); im.paste(L,(M+8,40),L)
    e=ease(t/0.45); d=ImageDraw.Draw(im)
    d.text((48-int((1-e)*200),680),'Ocean Breeze Galle',font=font(96,500),fill='white')
    e2=ease((t-0.12)/0.45); d.text((48-int((1-e2)*200),806),'Beachfront hotel residency.',font=font(48),fill=(170,170,176))
    e3=ease((t-0.3)/0.4); y=940+int((1-e3)*160)
    if e3>0:
        d.rectangle((48,y,1032,y+150),fill='white')
        sz=72
        while d.textlength(CTA,font=font(sz,500))>930: sz-=2
        d.text((540,y+75),CTA,font=font(sz,500),fill=INK,anchor='mm')
    e4=ease((t-0.5)/0.4); y2=1120+int((1-e4)*160)
    if e4>0:
        d.rectangle((48,y2,1032,y2+110),outline='white',width=3); d.text((540,y2+55),URL,font=font(38,500),fill='white',anchor='mm')
    return im
def frame(sc,t,i,N):
    if sc.get('final'): return frame_final(t)
    im=BASE.copy(); k=t/sc['dur']
    im.paste(pic(sc['p'],sc['fx'],sc['pan'],k),(BOX[0],BOX[1]))
    d=ImageDraw.Draw(im); d.rectangle(BOX,outline=LINE,width=3)
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
    frame(scs[0],1.5,0,N).save(os.environ['SHEET']); sys.exit()
FADE=int(.3*FPS)
p=subprocess.Popen([FF,'-y','-loglevel','error','-f','rawvideo','-pix_fmt','rgb24','-s',f'{W}x{H}','-r',str(FPS),'-i','-','-f','lavfi','-i','anullsrc=r=44100:cl=mono','-shortest','-t',str(sum(s['dur'] for s in scs)),'-c:v','libx264','-crf','17','-preset','medium','-pix_fmt','yuv420p','-c:a','aac','-b:a','128k','-movflags','+faststart',OUT],stdin=subprocess.PIPE)
for si,sc in enumerate(scs):
    for f in range(int(sc['dur']*FPS)):
        im=frame(sc,f/FPS,si,N)
        if si>0 and f<FADE and not sc.get('final'): im=Image.blend(frame(scs[si-1],scs[si-1]['dur'],si-1,N),im,(f+1)/FADE)
        p.stdin.write(im.tobytes())
p.stdin.close(); p.wait(); print('done',sum(s['dur'] for s in scs))
