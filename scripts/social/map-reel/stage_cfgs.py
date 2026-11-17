import json,os,shutil
J=os.environ['CLAUDE_JOB_DIR']+'/tmp'; P=J+'/w/rem/public'
def stage(id,geo,photos):
    os.makedirs(f'{P}/maps/{id}',exist_ok=True); os.makedirs(f'{P}/media/{id}',exist_ok=True)
    shutil.copy(f'{J}/geo/{geo}/basemap.png',f'{P}/maps/{id}/basemap.png'); out=[]
    for i,src in enumerate(photos):
        ext=src.rsplit('.',1)[1]; d=f'{P}/media/{id}/p{i}.{ext}'; shutil.copy(src,d); out.append(f'media/{id}/p{i}.{ext}')
    return out
A=J+'/assets'
rp=stage('rush','rush',[f'{A}/rush-city-dematagoda/gallery__rush-city-dematagoda_{n}.jpg' for n in ('exterior-01','exterior-skyline-sunset','living-room-02','bedroom-01','kitchen-01','swimming-pool-aerial','exterior-tower-dusk','exterior-skyline-night')])
fp=stage('refl','refl',[f'{A}/the-reflection-samagi-mawatha-thalawathugoda/gallery__the-reflection-samagi-mawatha-thalawathugoda_{n}.png' for n in ('building-exterior','buildings-sunset','dining-living','living-room','bedroom','master-bedroom')])
lp=stage('legado','legado',[f'{A}/legado-homagama/gallery__legado-homagama_photo-{n}.png' for n in ('03','04','05','08')])
def routes(g):
    R=json.load(open(f'{J}/geo/{g}/mapgeo.json'))['routes']; return [{'key':k,'label':k} for k in sorted(R,key=lambda k:R[k]['min'])]
cfgs={
 'rush':{'id':'rush','kind':'project','geo':f'{J}/geo/rush/mapgeo.json','accent':'#F99958','title':['RUSH CITY'],'city':'Dematagoda, Colombo 9','cardTitle':'Rush City','cardCity':'Dematagoda, Colombo 9','photos':rp,'endPhoto':rp[0],'price':'RS. 34M','url':'www.lankanewhomes.com/projects/rush-city-dematagoda',
  'intro_voice':'Rush City, Dematagoda.','callouts':[['35 Levels','109 Apartments'],['Freehold','Ownership'],['2 To 4','Bedrooms'],['Pool, Gym','And Function Hall'],['Handover','2030']],
  'callout_voice':['Thirty-five levels. One hundred and nine apartments.','Freehold ownership.','Two to four bedroom layouts.','Swimming pool, gym and function hall.','Handover in twenty thirty.'],
  'end_voice':'Rush City, Dematagoda, Colombo nine. From thirty-four million rupees.','routes':routes('rush')},
 'refl':{'id':'refl','kind':'project','geo':f'{J}/geo/refl/mapgeo.json','accent':'#F99958','title':['THE REFLECTION'],'city':'Thalawathugoda','cardTitle':'The Reflection','cardCity':'Thalawathugoda','photos':fp,'endPhoto':fp[1],'price':'RS. 52M','url':'www.lankanewhomes.com/projects/the-reflection-samagi-mawatha-thalawathugoda',
  'intro_voice':'The Reflection, Thalawathugoda.','callouts':[['38 Homes','In Two Buildings'],['3 Bedrooms','3 Bathrooms'],['1,111 To 1,120','Sq Ft'],['Landscaped','Gardens']],
  'callout_voice':['Thirty-eight homes in two buildings.','Three bedrooms. Three bathrooms.','About eleven hundred square feet.','Landscaped gardens and security.'],
  'end_voice':'The Reflection, Thalawathugoda. From fifty-two million rupees.','routes':routes('refl')},
 'legado':{'id':'legado','kind':'land','geo':f'{J}/geo/legado/mapgeo.json','accent':'#A9C99A','title':['LEGADO'],'city':'Homagama','cardTitle':'Legado','cardCity':'Homagama','photos':lp,'endPhoto':lp[0],'price':'RS. 1.2M PER PERCH','url':'www.lankanewhomes.com/land/legado-homagama',
  'intro_voice':'Legado, Homagama.','callouts':[['Only 8','Premium Plots'],['10 Perches','Each Plot'],['1st Class','Bimsawiya Title']],
  'callout_voice':['Only eight premium plots.','Each plot is ten perches.','First class Bimsawiya title.','One point two million rupees per perch.'],
  'end_voice':'Legado, Homagama. Land from one point two million rupees per perch.','routes':routes('legado')}}
for k,c in cfgs.items(): json.dump(c,open(f'{J}/w/cfg_{k}.json','w'),indent=1); print(k,[(r['key'],json.load(open(c['geo']))['routes'][r['key']]['min']) for r in c['routes']])
