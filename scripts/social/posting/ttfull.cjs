const { chromium } = require('playwright-core'); const fs=require('fs')
const [dir,kind,title,post]=process.argv.slice(2)
const flat=s=>s.replace(/\s+/g,' ').trim()
;(async()=>{
 const loc=fs.readFileSync(dir+'/location.txt','utf8').trim(); const cap=fs.readFileSync(dir+'/caption.txt','utf8').trim()
 const b = await chromium.connectOverCDP('http://localhost:9333'); const p=b.contexts()[0].pages().find(x=>x.url().includes('tiktok.com'))
 p.on('dialog',d=>d.accept().catch(()=>{}));
 await p.goto('https://www.tiktok.com/tiktokstudio/content',{waitUntil:'domcontentloaded'}).catch(()=>{}); await p.waitForTimeout(3000)
 await p.goto('https://www.tiktok.com/tiktokstudio/upload',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(4000)
 const problems=[]
 if(kind==='reel'){
  await p.locator('input[type=file]').first().setInputFiles(dir+'/reel.mp4',{timeout:240000})
  for(let i=0;i<80;i++){ await p.waitForTimeout(3000); const t=await p.innerText('body'); if(/Uploaded/.test(t.slice(0,400))) break }
 } else {
  await p.getByText('Photos',{exact:true}).first().click(); await p.waitForTimeout(1500)
  const files=fs.readdirSync(dir).filter(f=>/^slide-\d+\.png$/.test(f)).sort().map(f=>dir+'/'+f)
  await p.locator('input[type=file]').first().setInputFiles(files)
  for(let i=0;i<25;i++){ await p.waitForTimeout(3000); const m=(await p.innerText('body')).match(/(\d+) photos uploaded/); if(m&&+m[1]===files.length) break }
  const m=(await p.innerText('body')).match(/(\d+) photos uploaded/); if(!m||+m[1]!==files.length) problems.push('photo count '+(m&&m[1])+' of '+files.length)
  await p.locator('input[placeholder*="title" i], textarea[placeholder*="title" i]').first().fill(title).catch(()=>{})
 }
 await p.waitForTimeout(3000); await p.evaluate(()=>{document.querySelector('#react-joyride-portal')?.remove()})
 const ed=(kind==='reel'?p.locator('[contenteditable="true"]').first():p.locator('[contenteditable="true"]').last())
 await ed.scrollIntoViewIfNeeded(); await ed.click(); await p.waitForTimeout(800); await p.keyboard.press('Meta+A'); await p.keyboard.press('Backspace'); await p.waitForTimeout(600)
 for(const line of cap.split('\n')){ if(line){ await p.keyboard.insertText(line); await p.waitForTimeout(250) } await p.keyboard.press('Enter') }
 await p.keyboard.insertText(' '); await p.waitForTimeout(800); await p.getByText('Details',{exact:true}).first().click({force:true}).catch(()=>{}); await p.waitForTimeout(1200)
 const got=flat(await ed.innerText()); if(got.length<flat(cap).length-5) problems.push('caption '+got.length+' of '+flat(cap).length)
 if(kind==='reel'){
  await p.getByText('Edit cover',{exact:true}).first().click(); await p.waitForTimeout(3000)
  await p.getByText('Got it',{exact:true}).first().click({timeout:2000}).catch(()=>{}); await p.waitForTimeout(600)
  const [fc]=await Promise.all([p.waitForEvent('filechooser',{timeout:15000}),p.getByText('Upload cover',{exact:true}).first().click({force:true})])
  await fc.setFiles(dir+'/cover.png'); await p.waitForTimeout(5000)
  await p.getByRole('button',{name:'Save',exact:true}).first().click({force:true}); await p.waitForTimeout(3500)
  if(await p.getByText('Upload cover',{exact:true}).count()) problems.push('cover dialog still open')
 }
 const li=p.locator('input[placeholder*="locations" i]').first(); await li.scrollIntoViewIfNeeded(); await li.click(); await li.fill(''); await li.pressSequentially(loc,{delay:90}); await p.waitForTimeout(5000)
 const opt=p.locator('li, [role=option], [class*=option]').filter({hasText:new RegExp('^'+loc,'i')}).filter({hasText:/Sri Lanka/}).first()
 if(await opt.count()) await opt.click({force:true}); else await p.getByText(/Sri Lanka$/).first().click({force:true}).catch(()=>{})
 await p.waitForTimeout(2000); const lv=await li.inputValue(); if(!lv) problems.push('location empty')
 console.log('location box:',JSON.stringify(lv),'| caption chars',got.length,'of',flat(cap).length,'| problems:',problems.length?problems.join('; '):'none')
 await p.screenshot({path:'ttfull.png'})
 if(post==='1'&&!problems.length){ await p.getByRole('button',{name:'Post',exact:true}).first().scrollIntoViewIfNeeded(); await p.getByRole('button',{name:'Post',exact:true}).first().click(); await p.waitForTimeout(4000)
  const pn=p.getByRole('button',{name:/post now/i}); if(await pn.count()) await pn.first().click(); await p.waitForTimeout(10000); console.log('posted, now at',p.url()) }
 else if(post==='1') console.log('NOT POSTED because of problems')
 process.exit(0)
})()
