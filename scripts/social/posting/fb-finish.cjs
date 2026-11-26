// Finishes a Facebook reel that ffreel-pc.cjs has filled (dry run): tries to set the location, then Next and Post.
//   node fb-finish.cjs <dir> [1 = post]
const { chromium } = require('playwright-core'); const fs = require('fs')
const [dir, post] = process.argv.slice(2)
;(async () => {
  const loc = fs.readFileSync(dir + '/location.txt', 'utf8').trim()
  const b = await chromium.connectOverCDP('http://127.0.0.1:9333', { timeout: 60000 }); const p = b.contexts()[0].pages().find((x) => x.url().includes('facebook.com'))
  const body = async () => (await p.innerText('body')).replace(/\s+/g, ' ')
  if (!/Create reel/.test(await body()) || !/Replace media/.test(await body())) { console.log('NOT on a filled Create reel form'); process.exit(1) }
  let locSet = ''
  const already = new RegExp('People ' + loc + ',\\s*Sri Lanka', 'i').test(await body())
  if (already) { locSet = loc + ', Sri Lanka (already set)' } else try {
    // the chip is called "Location" until one is set, then it carries the place name
    await p.getByRole('button', { name: new RegExp('^(Location|' + loc + '.*)$', 'i') }).first().click({ timeout: 8000 }); await p.waitForTimeout(2500)
    const inp = p.locator('input[placeholder*="Where" i], input[aria-label*="Where" i], input[placeholder*="location" i], input[type="search"]').last()
    await inp.click({ timeout: 6000 }); await inp.pressSequentially(loc, { delay: 100 }); await p.waitForTimeout(4500)
    // prefer the real place "<Town>, Sri Lanka" over look-alike tags such as "Colombo Srilanka"
    const all = p.locator('[role=option], [role=listbox] [role=button], ul li').filter({ hasText: new RegExp('^\\s*' + loc, 'i') })
    const exact = all.filter({ hasText: new RegExp('^\\s*' + loc + ',\\s*Sri Lanka', 'i') })
    const opt = (await exact.count()) ? exact.first() : all.first()
    console.log('location options:', JSON.stringify((await p.locator('[role=option], ul li').allInnerTexts()).filter((x) => new RegExp(loc, 'i').test(x)).slice(0, 4)))
    if (await opt.count()) { await opt.click({ timeout: 6000 }); await p.waitForTimeout(2500); locSet = loc }
  } catch (e) { console.log('location step failed:', e.message.split('\n')[0]) }
  await p.keyboard.press('Escape').catch(() => {}); await p.waitForTimeout(800)
  const t = await body(); const onForm = /Create reel/.test(t) && /Replace media/.test(t)
  console.log('location set:', JSON.stringify(locSet), '| shown on form:', new RegExp('(is in|at|in) ' + loc, 'i').test(t), '| still on form:', onForm)
  await p.screenshot({timeout:8000, path: __dirname + '/fb-before-post.png' }).catch(()=>{})
  if (post === '1' && onForm) {
    await p.getByRole('button', { name: 'Next', exact: true }).first().click({ force: true }); await p.waitForTimeout(5000)
    await p.screenshot({timeout:8000, path: __dirname + '/fb-settings.png' }).catch(()=>{})
    await p.getByRole('button', { name: 'Post', exact: true }).first().click({ force: true }); await p.waitForTimeout(20000)
    console.log('posted, now at', p.url())
  } else if (post === '1') console.log('NOT POSTED: form lost')
  process.exit(0)
})().catch((e) => { console.log('ERR', e.message.split('\n')[0]); process.exit(1) })
