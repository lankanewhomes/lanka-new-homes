// Adds a location to an existing Facebook Page reel through Edit reel. Usage: node fbloc.cjs <reelId> "<location>" [1 = save]
const { chromium } = require('playwright-core')
const [id,loc,save]=process.argv.slice(2)
const SH=__dirname+'/'
;(async()=>{const b=await chromium.connectOverCDP('http://localhost:9333');const p=b.contexts()[0].pages().find(x=>x.url().includes('facebook.com'))
p.on('dialog',d=>d.accept().catch(()=>{}))
await p.goto('https://www.facebook.com/reel/'+id,{waitUntil:'domcontentloaded'}); await p.waitForTimeout(8000)
const vp=p.viewportSize()||{width:1470,height:723}
let opened=false
for(const sel of ['[aria-label="More"]','[aria-label="Actions for this reel"]','[aria-label*="More options"]']){ const l=p.locator(sel); const n=await l.count(); for(let k=0;k<n&&!opened;k++){ const bb=await l.nth(k).boundingBox(); if(bb&&bb.x>vp.width*0.35&&bb.x<vp.width*0.72&&bb.y>vp.height*0.6){ await l.nth(k).click({force:true}); opened=true } } if(opened) break }
if(!opened) await p.mouse.click(Math.round(vp.width*0.5),Math.round(vp.height*0.93))
await p.waitForTimeout(2000)
await p.locator('[role=menuitem]').filter({hasText:/Edit reel/}).first().click(); await p.waitForTimeout(4000)
await p.screenshot({path:SH+'fbloc0.png'}); const problems=[]
await p.getByText('Location',{exact:true}).first().click(); await p.waitForTimeout(2000)
await p.keyboard.type(loc,{delay:100}); await p.waitForTimeout(4500)
const exact=p.getByText(loc+', Sri Lanka',{exact:true}).first()
if(await exact.count()) await exact.click({force:true}); else await p.locator('[role=dialog] [role=button], [role=dialog] [role=option]').filter({hasText:loc}).first().click({force:true}).catch(()=>problems.push('no location result'))
await p.waitForTimeout(2500)
const chip=await p.locator('div[role=button]:has-text("'+loc.split(' ')[0]+'")').allInnerTexts().catch(()=>[])
if(!chip.length) problems.push('location chip missing'); else if(!/Sri Lanka/.test(chip[0])) problems.push('location not in Sri Lanka: '+chip[0])
await p.screenshot({path:SH+'fbloc.png'})
console.log(id,'chip:',JSON.stringify(chip.slice(0,1)),'| problems:',problems.length?problems.join('; '):'none')
if(save==='1'&&!problems.length){ await p.getByRole('button',{name:'Save',exact:true}).first().click({force:true}); for(let i=0;i<30;i++){ await p.waitForTimeout(4000); const ev=p.getByText('Publish Original Post',{exact:true}); if(await ev.count()){ await ev.first().click({force:true}); await p.waitForTimeout(3000) } if(!(await p.getByText('Saving',{exact:true}).count())) break } await p.screenshot({path:SH+'fbsaved.png'}); console.log('saved, edit screen closed:', !(await p.getByText('Edit reel',{exact:true}).count())) } else if(save==='1') console.log('NOT SAVED because of problems')
process.exit(0)})()
