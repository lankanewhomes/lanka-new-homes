// PC copy of scripts/social/posting/igfull.cjs: 127.0.0.1, and the location prefers the real place "<Town>, Sri Lanka" over look-alike tags.
// Instagram post via the posting Chrome. Usage: node igfull.cjs <dir> reel|carousel [1 = share]. Rebuilt 2026-11-14. Refuses to share unless caption, location and Crop Original are all set.
const { chromium } = require('playwright-core'); const fs=require('fs')
const [dir,kind,post]=process.argv.slice(2)
;(async()=>{
 const loc=fs.readFileSync(dir+'/location.txt','utf8').trim(); const cap=fs.readFileSync(dir+'/caption.txt','utf8').trim()
 const b=await chromium.connectOverCDP('http://127.0.0.1:9333'); const p=b.contexts()[0].pages().find(x=>x.url().includes('instagram.com'))||await b.contexts()[0].newPage()
 const problems=[]; p.on('dialog',d=>d.accept().catch(()=>{}))
 await p.goto('https://www.instagram.com/',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000)
 await p.getByRole('link',{name:/^New post|Create/i}).first().click().catch(async()=>{ await p.locator('svg[aria-label="New post"]').first().click() })
 await p.waitForTimeout(1500); await p.getByRole('link',{name:/^Post/}).first().click().catch(()=>{}); await p.waitForTimeout(1500)
 const files= kind==='reel'?[dir+'/reel.mp4']:fs.readdirSync(dir).filter(f=>/^slide-\d+\.png$/.test(f)).sort().map(f=>dir+'/'+f)
 const [fc]=await Promise.all([p.waitForEvent('filechooser',{timeout:10000}), p.getByRole('button',{name:/Select from computer/i}).click()])
 await fc.setFiles(files,{timeout:300000}); await p.waitForTimeout(kind==='reel'?20000:9000)
 if(kind==='reel'){ await p.getByRole('button',{name:'OK'}).first().click({timeout:3000}).catch(()=>{}); await p.waitForTimeout(1500) }
 const cropBtn=p.locator('svg[aria-label="Select crop"]').first()
 if(await cropBtn.count()){ await cropBtn.click(); await p.waitForTimeout(1000); const orig=p.getByText('Original',{exact:true}).first(); if(await orig.count()){ await orig.click(); await p.waitForTimeout(1500); console.log('crop: Original') } else problems.push('Original option missing') }
 else if(kind!=='reel') problems.push('crop control missing'); else console.log('crop: no crop control on this reel screen (full 9:16 kept)')
 const next=async()=>{ await p.getByRole('button',{name:'Next'}).first().click().catch(async()=>{await p.getByText('Next',{exact:true}).first().click()}); await p.waitForTimeout(3000) }
 await next()
 if(kind==='reel'){ const [fc2]=await Promise.all([p.waitForEvent('filechooser',{timeout:10000}), p.getByText('Select from computer',{exact:true}).first().click()]); await fc2.setFiles(dir+'/cover.png'); await p.waitForTimeout(4000) }
 await next()
 const ed=p.getByRole('textbox',{name:'Add a caption...'}).first(); await ed.click()
 const lines=cap.split('\n'); for(let i=0;i<lines.length;i++){ if(lines[i]) await p.keyboard.insertText(lines[i]); if(i<lines.length-1) await p.keyboard.press('Shift+Enter') }
 await p.waitForTimeout(1200)
 const got=(await ed.innerText()).replace(/\s+/g,' ').trim(); const want=cap.replace(/\s+/g,' ').trim(); if(got.length<want.length-5) problems.push('caption '+got.length+' of '+want.length)
 const li=p.locator('input[placeholder*="location" i]').first(); await li.click(); await li.pressSequentially(loc,{delay:120}); await p.waitForTimeout(9000)
 const all=p.locator('[role=dialog] button, [role=dialog] [role=button]').filter({hasText:new RegExp(loc,'i')})
 console.log('location options:',JSON.stringify((await all.allInnerTexts()).slice(0,4)))
 const exact=all.filter({hasText:new RegExp('^\\s*'+loc+'(,? ?Sri ?Lanka)?\\s*(\\n|$)','i')}); const strict=all.filter({hasText:new RegExp('^\\s*'+loc+', Sri Lanka','i')}); const pick=(await strict.count())?strict.first():(await exact.count())?exact.first():all.first()
 if(await pick.count()){ const bb=await pick.boundingBox(); await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2) } else problems.push('no location option')
 await p.waitForTimeout(2000)
 const dt=(await p.locator('[role=dialog]').first().innerText())+' '+(await li.inputValue().catch(()=>'')); if(!new RegExp(loc,'i').test(dt.split('/2,200').slice(1).join(' ')||'')) problems.push('location not shown')
 console.log('caption',got.length,'of',want.length,'| problems:',problems.length?problems.join('; '):'none')
 await p.screenshot({timeout:8000,path:'igfull.png'}).catch(()=>{})
 if(post==='1'&&!problems.length){
  await p.getByRole('button',{name:'Share',exact:true}).first().click().catch(async()=>{await p.getByText('Share',{exact:true}).first().click()})
  for(let i=0;i<30;i++){ await p.waitForTimeout(4000); if(/Your (post|reel) has been shared|has been shared/i.test(await p.innerText('body'))){ console.log('SHARED'); process.exit(0) } }
  console.log('share not confirmed')
 } else if(post==='1') console.log('NOT POSTED because of problems')
 process.exit(0)
})()
