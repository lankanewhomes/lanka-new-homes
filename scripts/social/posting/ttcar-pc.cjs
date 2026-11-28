// TikTok photo (carousel) post from the PC posting Chrome (port 9333). Built 2026-11-28 from tt-pc.cjs + the Mac ttfull.cjs photo branch.
// Usage: node ttcar-pc.cjs <dir> "<title>" [1 = post]. <dir> holds slide-NN.png, caption.txt, location.txt. Refuses to post unless every photo is uploaded, caption full and a Sri Lanka location set.
const { chromium } = require('playwright-core'); const fs = require('fs')
const [dir, title, post] = process.argv.slice(2); const mode = ''
const flat = (s) => s.replace(/\s+/g, ' ').trim()
;(async () => {
  const loc = fs.readFileSync(dir + '/location.txt', 'utf8').trim(), cap = fs.readFileSync(dir + '/caption.txt', 'utf8').trim()
  const b = await chromium.connectOverCDP('http://127.0.0.1:9333'); const p = b.contexts()[0].pages().find((x) => x.url().includes('tiktok.com'))
  p.on('dialog', (d) => d.accept().catch(() => {}))
  await p.setViewportSize({ width: 1500, height: 1250 })
  const problems = []
  const ed = p.locator('[contenteditable="true"]').last()
  if (mode !== 'postonly') {
    await p.goto('https://www.tiktok.com/tiktokstudio/content', { waitUntil: 'domcontentloaded' }).catch(() => {}); await p.waitForTimeout(3000)
    await p.goto('https://www.tiktok.com/tiktokstudio/upload', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(4000)
    await p.getByText('Photos', { exact: true }).first().click(); await p.waitForTimeout(1500)
    const files = fs.readdirSync(dir).filter((f) => /^slide-\d+\.png$/.test(f)).sort().map((f) => dir + '/' + f)
    await p.locator('input[type=file]').first().setInputFiles(files, { timeout: 240000 })
    for (let i = 0; i < 40; i++) { await p.waitForTimeout(3000); const m = (await p.innerText('body')).match(/(\d+) photos uploaded/); if (m && +m[1] === files.length) break }
    const m = (await p.innerText('body')).match(/(\d+) photos uploaded/); if (!m || +m[1] !== files.length) problems.push('photo count ' + (m && m[1]) + ' of ' + files.length)
    await p.locator('input[placeholder*="title" i], textarea[placeholder*="title" i]').first().fill(title).catch(() => {})
    await p.waitForTimeout(3000); await p.evaluate(() => { document.querySelector('#react-joyride-portal')?.remove() })
    await ed.scrollIntoViewIfNeeded(); await ed.click(); await p.waitForTimeout(800); await p.keyboard.press('Control+A'); await p.keyboard.press('Backspace'); await p.waitForTimeout(600)
    const lines = cap.split('\n')
    for (let i = 0; i < lines.length; i++) {
      if (lines[i]) { await p.keyboard.insertText(lines[i]); await p.waitForTimeout(900); await p.keyboard.press('Escape'); await p.waitForTimeout(300) }
      if (i < lines.length - 1) { await p.keyboard.press('Enter'); await p.waitForTimeout(300) }
    }
    await p.keyboard.insertText(' '); await p.waitForTimeout(1000); await p.keyboard.press('Escape'); await p.waitForTimeout(800)
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
