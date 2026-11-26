// PC copy of scripts/social/posting/ffreel.cjs from the site repo: the video check accepts any 0:NN length (reels are now 30 s+, not 16 s).
// Facebook Page REEL via the posting Chrome. Refuses to post unless a video is attached. Usage: node ffreel.cjs <dir> [1 = post]
const { chromium } = require('playwright-core'); const fs=require('fs')
const [dir,post]=process.argv.slice(2)
const flat=s=>s.replace(/\s+/g,' ').trim()
const SH=__dirname+'/'
;(async()=>{
 const loc=fs.readFileSync(dir+'/location.txt','utf8').trim(); const cap=fs.readFileSync(dir+'/caption-fb.txt','utf8').trim()
 const b=await chromium.connectOverCDP('http://127.0.0.1:9333'); const p=b.contexts()[0].pages().find(x=>x.url().includes('facebook.com'))
 p.on('dialog',d=>d.accept().catch(()=>{}))
 const problems=[]
 await p.goto('https://www.facebook.com/lankanewhomes',{waitUntil:'domcontentloaded'}).catch(()=>{}); await p.waitForTimeout(4000)
 await p.goto('https://www.facebook.com/reels/create',{waitUntil:'domcontentloaded'}); await p.waitForTimeout(6000)
 const [fc]=await Promise.all([p.waitForEvent('filechooser',{timeout:15000}), p.getByText('Add video').first().click()]); await fc.setFiles(dir+'/reel.mp4',{timeout:420000})
 for(let i=0;i<40;i++){ await p.waitForTimeout(4000); const t=await p.innerText('body'); if(i>2&&!/Uploading|Processing/.test(t)) break }
 const bt=await p.innerText('body'); const hasVideo=(/Replace media/.test(bt)&&/0:\d\d/.test(bt))?1:0; if(!hasVideo) problems.push('NO VIDEO ATTACHED')
 await p.screenshot({path:SH+'ffreel1.png'})
 // next through the editing steps until the description/caption box appears
 for(let i=0;i<3;i++){ if(await p.getByRole('textbox').count()) break; const nx=p.getByRole('button',{name:'Next'}).first(); if(await nx.count()){ await nx.click({force:true}); await p.waitForTimeout(3500) } }
 const ed=p.getByRole('textbox').first(); await ed.click(); await p.waitForTimeout(500)
 const lines=cap.split('\n'); for(let i=0;i<lines.length;i++){ if(lines[i]) await p.keyboard.insertText(lines[i]); if(i<lines.length-1) await p.keyboard.press('Enter') }
 await p.waitForTimeout(2000)
 const got=flat(await ed.innerText()); if(got.length<flat(cap).length-5) problems.push('caption '+got.length+' of '+flat(cap).length)
 await p.keyboard.press('Escape'); await p.waitForTimeout(800)
 // cover
 await p.getByText('Cover',{exact:true}).first().click(); await p.waitForTimeout(3000)
 const up=p.getByRole('button',{name:'Upload',exact:true}).first()
 if(await up.count()){ const [fc2]=await Promise.all([p.waitForEvent('filechooser',{timeout:12000}),up.click({force:true})]); await fc2.setFiles(dir+'/cover.png',{timeout:120000}); await p.waitForTimeout(5000)
   for(const nm of ['Save','Done','Apply']){ const sv=p.getByRole('button',{name:nm,exact:true}).first(); if(await sv.count()){ await sv.click({force:true}); await p.waitForTimeout(3000); break } } }
 else problems.push('cover upload button not found')
 if(await p.getByText('Choose a thumbnail').count()) problems.push('thumbnail dialog still open')
 // location (wait for the copyright check to finish first; the chip stays greyed until then)
 for(let i=0;i<12;i++){ const dis=await p.evaluate(()=>{const e=[...document.querySelectorAll('[role=button]')].find(x=>/^Location$/.test((x.innerText||'').trim())); return e?e.getAttribute('aria-disabled'):'none'}); if(dis!=='true') break; await p.waitForTimeout(5000) }
 console.log('location chip disabled state:',await p.evaluate(()=>{const e=[...document.querySelectorAll('[role=button]')].find(x=>/^Location$/.test((x.innerText||'').trim())); return e?e.getAttribute('aria-disabled'):'none'}))
 const chip=['(no location: Facebook greys it out for reels)']
 await p.screenshot({path:SH+'ffreel2.png'})
 console.log('video attached:',!!hasVideo,'| caption',got.length,'of',flat(cap).length,'| chip',JSON.stringify(chip.slice(0,1)),'| problems:',problems.length?problems.join('; '):'none')
 if(post==='1'&&!problems.length){
  await p.getByRole('button',{name:'Next',exact:true}).first().click({force:true}); await p.waitForTimeout(4000)
  await p.getByRole('button',{name:'Post',exact:true}).first().click({force:true}); await p.waitForTimeout(15000); console.log('posted, now at',p.url())
 } else if(post==='1') console.log('NOT POSTED because of problems')
 process.exit(0)
})()
