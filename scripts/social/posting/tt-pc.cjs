// TikTok reel post from the PC posting Chrome (debug port 9333). Based on scripts/social/posting/ttfull.cjs in the site repo, with three PC fixes:
// a tall viewport (the cover dialog's Save button was off-screen), Escape after each caption line (TikTok's link/hashtag pop-up swallowed
// the next line), and Control+A instead of the Mac's Meta+A. Refuses to post unless caption, cover and a Sri Lanka location are all set.
//   node tt-pc.cjs <dir> [1 = post]            full run: upload, caption, cover, location, post
//   node tt-pc.cjs <dir> 1 postonly            only press Post on a form that is already filled and checked
const { chromium } = require('playwright-core'); const fs = require('fs')
const [dir, post, mode] = process.argv.slice(2)
const flat = (s) => s.replace(/\s+/g, ' ').trim()
;(async () => {
  const loc = fs.readFileSync(dir + '/location.txt', 'utf8').trim(), cap = fs.readFileSync(dir + '/caption.txt', 'utf8').trim()
  const b = await chromium.connectOverCDP('http://127.0.0.1:9333'); const p = b.contexts()[0].pages().find((x) => x.url().includes('tiktok.com'))
  p.on('dialog', (d) => d.accept().catch(() => {}))
  await p.setViewportSize({ width: 1500, height: 1250 })
  const problems = []
  const ed = p.locator('[contenteditable="true"]').first()
  if (mode !== 'postonly') {
    await p.goto('https://www.tiktok.com/tiktokstudio/content', { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(3000)
    await p.goto('https://www.tiktok.com/tiktokstudio/upload', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000)
    await p.locator('input[type=file]').first().setInputFiles(dir + '/reel.mp4', { timeout: 240000 })
    for (let i = 0; i < 80; i++) { await p.waitForTimeout(3000); if (/Uploaded/.test((await p.innerText('body')).slice(0, 400))) break }
    await p.waitForTimeout(3000); await p.evaluate(() => { document.querySelector('#react-joyride-portal')?.remove() })
    await ed.scrollIntoViewIfNeeded(); await ed.click(); await p.waitForTimeout(800); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await p.waitForTimeout(600)
    const lines = cap.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) { await p.keyboard.insertText(lines[i]); await p.waitForTimeout(900); await p.keyboard.press('Escape'); await p.waitForTimeout(300) }
      if (i < lines.length - 1) { await p.keyboard.press('Enter'); await p.waitForTimeout(300) }
    }
    await p.keyboard.insertText(' '); await p.waitForTimeout(1000); await p.keyboard.press('Escape'); await p.waitForTimeout(800)
    await p.getByText('Edit cover', { exact: true }).first().click(); await p.waitForTimeout(3000)
    await p.getByText('Got it', { exact: true }).first().click({ timeout: 2000 }).catch(() => {}); await p.waitForTimeout(600)
    const [fc] = await Promise.all([p.waitForEvent('filechooser', { timeout: 15000 }), p.getByText('Upload cover', { exact: true }).first().click({ force: true })])
    await fc.setFiles(dir + '/cover.png'); await p.waitForTimeout(6000)
    await p.evaluate(() => { const bt = [...document.querySelectorAll('button')].find((x) => (x.innerText || '').trim() === 'Save'); if (bt) bt.click() }); await p.waitForTimeout(4500)
    if (await p.getByText('Sticker', { exact: true }).count()) problems.push('cover dialog still open')
    const li = p.locator('input[placeholder*="locations" i]').first(); await li.scrollIntoViewIfNeeded(); await li.click(); await li.fill(''); await li.pressSequentially(loc, { delay: 90 }); await p.waitForTimeout(5000)
    const opts = p.locator('li, [role=option], [class*=option]').filter({ hasText: new RegExp('^' + loc, 'i') })
    console.log('location options:', JSON.stringify((await opts.allInnerTexts()).slice(0, 4)))
    const opt = opts.filter({ hasText: /Sri Lanka/ }).first()
    if (await opt.count()) await opt.click({ force: true }); else problems.push('no Sri Lanka location option')
    await p.waitForTimeout(2000)
  }
  const got = flat(await ed.innerText()); if (got.length < flat(cap).length - 5 || !got.includes(flat(cap).slice(-40))) problems.push('caption ' + got.length + ' of ' + flat(cap).length)
  const lv = await p.locator('input[placeholder*="locations" i]').first().inputValue().catch(() => ''), body = flat(await p.innerText('body'))
  const locShown = lv || (new RegExp('Location ' + loc, 'i').test(body) ? loc : '')
  if (!locShown) problems.push('location empty')
  console.log('location:', JSON.stringify(locShown), '| caption', got.length, 'of', flat(cap).length, '| problems:', problems.length ? problems.join('; ') : 'none')
  await p.evaluate(() => window.scrollTo(0, 0)); await p.screenshot({timeout:8000, path: 'tt-form.png', fullPage: true }).catch(()=>{})
  if (post === '1' && !problems.length) {
    const bt = p.getByRole('button', { name: 'Post', exact: true }).first(); await bt.scrollIntoViewIfNeeded(); await bt.click(); await p.waitForTimeout(4000)
    const pn = p.getByRole('button', { name: /post now/i }); if (await pn.count()) await pn.first().click()
    await p.waitForTimeout(12000); console.log('posted, now at', p.url())
  } else if (post === '1') console.log('NOT POSTED because of problems')
  process.exit(0)
})().catch((e) => { console.log('ERR', e.message.split('\n')[0]); process.exit(1) })
