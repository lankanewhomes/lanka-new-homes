// Facebook Page multi-photo (carousel) post via the posting Chrome. Usage: node fbcar.cjs <dir> [1 = post]
// <dir> holds slide-NN.png, caption-fb.txt, location.txt. Refuses to post unless every photo is attached, caption is full and the location chip says Sri Lanka.
const { chromium } = require('playwright-core'); const fs = require('fs')
const [dir, post] = process.argv.slice(2)
const flat = s => s.replace(/\s+/g, ' ').trim()
const SH = __dirname + '/'
;(async () => {
  const loc = fs.readFileSync(dir + '/location.txt', 'utf8').trim(); const cap = fs.readFileSync(dir + '/caption-fb.txt', 'utf8').trim()
  const files = fs.readdirSync(dir).filter(f => /^slide-\d+\.png$/.test(f)).sort().map(f => dir + '/' + f)
  const b = await chromium.connectOverCDP('http://localhost:9333'); const p = b.contexts()[0].pages().find(x => x.url().includes('facebook.com')) || await b.contexts()[0].newPage()
  p.on('dialog', d => d.accept().catch(() => {})); const problems = []
  await p.goto('https://www.facebook.com/lankanewhomes', { waitUntil: 'domcontentloaded' }); await p.waitForTimeout(6000)
  await p.getByText(/What.s on your mind/).first().click(); await p.waitForTimeout(3000)
  const [fc] = await Promise.all([p.waitForEvent('filechooser', { timeout: 15000 }), p.getByText('Add photos or videos').first().click()])
  await fc.setFiles(files, { timeout: 300000 })
  for (let i = 0; i < 30; i++) { await p.waitForTimeout(4000); const t = await p.innerText('body'); if (i > 1 && !/Uploading|Processing/.test(t)) break }
  await p.waitForTimeout(3000)
  const n = await p.locator('[aria-label="Remove photo"]').count()
  await p.screenshot({ path: SH + 'fbcar1.png' })
  const ed = p.getByRole('textbox').first(); await ed.click(); await p.waitForTimeout(500)
  const lines = cap.split('\n'); for (let i = 0; i < lines.length; i++) { if (lines[i]) await p.keyboard.insertText(lines[i]); if (i < lines.length - 1) await p.keyboard.press('Enter') }
  await p.waitForTimeout(2000)
  const got = flat(await ed.innerText()); if (got.length < flat(cap).length - 5) problems.push('caption ' + got.length + ' of ' + flat(cap).length)
  await p.getByText('Location', { exact: true }).first().click(); await p.waitForTimeout(2000)
  await p.keyboard.type(loc, { delay: 100 }); await p.waitForTimeout(4500)
  const exact = p.getByText(loc + ', Sri Lanka', { exact: true }).first()
  if (await exact.count()) await exact.click({ force: true }); else await p.locator('[role=dialog] [role=button], [role=dialog] [role=option]').filter({ hasText: loc }).first().click({ force: true }).catch(() => problems.push('no location result'))
  await p.waitForTimeout(2500)
  const chip = (await p.locator('[aria-label="Remove location"]').count()) ? [(await p.innerText('body')).match(/Lanka New Homes is (?:at|in) ([^\n]+)/)?.[1] || loc] : []
  if (!chip.length) problems.push('location chip missing'); else if (!chip[0].includes(loc.split(' ')[0])) problems.push('location mismatch: ' + chip[0])
  await p.screenshot({ path: SH + 'fbcar2.png' })
  console.log('photos detected:', n, 'of', files.length, '| caption', got.length, 'of', flat(cap).length, '| chip', JSON.stringify(chip.slice(0, 1)), '| problems:', problems.length ? problems.join('; ') : 'none')
  if (post === '1' && !problems.length && n === files.length) {
    await p.getByRole('button', { name: 'Post', exact: true }).first().click({ force: true }); await p.waitForTimeout(5000); const nn = p.getByText('Not now', { exact: true }).first(); if (await nn.count()) await nn.click({ force: true }) /* 'Call Now button' upsell popup */; await p.waitForTimeout(12000); console.log('posted, now at', p.url())
  } else if (post === '1') console.log('NOT POSTED because of problems')
  process.exit(0)
})()
