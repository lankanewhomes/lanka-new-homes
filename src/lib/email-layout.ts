// Shared look for the developer-facing emails (owner, 2026-10-16: "the email design needs a better design, update the logo"): dark header with
// the white logo, orange top rule, big heading, numbered cards, an orange button and a quiet footer. Table layout and inline styles only,
// so it renders in Gmail and Outlook. The logo is a PNG on the public site (SVG is blocked by most mail clients).
// The logo PNG has the dark header colour baked in (owner, 2026-11-22: "black background for where the image is"), so the white logo
// always sits on black even when a mail app's dark mode recolours the header cell.
// The header cell also paints its colour as a background image (a one-colour gradient): dark mode in the Gmail app flips background
// colours but leaves background images alone, so the whole header container stays black (owner, 2026-11-22).
export const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const INK = '#1c1c20'
const TEXT = '#2b2b29'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const PAPER = '#f3efe8'
const ORANGE = '#f47b36'
const SITE = 'https://www.lankanewhomes.com'
const FONT = "Arial,Helvetica,sans-serif"

/** Background for a dark box that must stay dark in the Gmail app's dark mode (owner, 2026-11-22: every dark container stays black). Dark mode
 *  flips background colours but not background images, so the colour is also painted as a one-colour gradient. */
export const darkBg = (color = INK) => `background-color:${color};background-image:linear-gradient(${color},${color});`

/** Light text inside a darkBg box. Gmail's dark mode would turn it dark (unreadable on the pinned dark box); these two blend-mode wrappers
 *  turn it back to light. The classes only do anything inside Gmail (the `u + .body` rule in emailShell); elsewhere they are plain divs. */
export const lightOnDark = (html: string) => `<div class="gm-screen"><div class="gm-diff">${html}</div></div>`

/** One style for every note (questions, why you got this, unsubscribe): white, divider line, small grey centred text. Notes sit ABOVE the dark footer; the dark footer is always the last thing in the email (owner, 2026-11-23). */
export const emailNoteRow = (html: string, bg = '#ffffff') => `  <tr><td style="padding:18px 32px;background:${bg};border-top:1px solid ${LINE};font-size:12px;line-height:1.6;color:#8a8a8a;text-align:center;">${html}</td></tr>`

export function emailShell(opts: { preheader: string; title: string; body: string; footerNote?: string; /** Second note: how to get help (after "why you got this"). */ helpNote?: string; /** Full table row placed after the notes, just above the dark footer (the unsubscribe line of a newsletter). */ lastRow?: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.title)}</title><style>u + .body .gm-screen{background:#000;mix-blend-mode:screen;}u + .body .gm-diff{background:#000;mix-blend-mode:difference;}</style></head>
<body class="body" style="margin:0;background:${PAPER};font-family:${FONT};color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid ${LINE};">
  <tr><td bgcolor="${INK}" style="${darkBg()}border-top:4px solid ${ORANGE};padding:26px 32px;"><a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/brand/lankanewhomes-logo-white-on-dark.png" width="124" alt="LankaNewHomes" style="display:block;border:0;width:124px;height:auto;background:${INK};font-size:20px;font-weight:700;color:#ffffff;"></a></td></tr>
${opts.body}
${opts.footerNote === '' ? '' : (opts.footerNote === undefined ? emailNoteRow('You are receiving this because your company or project is listed on LankaNewHomes.', PAPER) : emailNoteRow(opts.footerNote))}
${opts.helpNote ? emailNoteRow(opts.helpNote) : ''}
${opts.lastRow ?? ''}
  <tr><td bgcolor="${INK}" style="${darkBg()}padding:22px 32px;font-size:12px;line-height:1.7;color:#b9b8b2;">${lightOnDark(`Sri Lanka's new homes marketplace: apartments, houses and land, with prices, floor plans and developer details in one place.<br><a href="${SITE}" style="color:#ffffff;text-decoration:underline;">www.lankanewhomes.com</a><br>Follow us: <a href="https://www.instagram.com/lankanewhomes/" style="color:#ffffff;text-decoration:underline;">Instagram</a> &nbsp;·&nbsp; <a href="https://www.facebook.com/lankanewhomes" style="color:#ffffff;text-decoration:underline;">Facebook</a> &nbsp;·&nbsp; <a href="https://www.tiktok.com/@lankanewhomes" style="color:#ffffff;text-decoration:underline;">TikTok</a>`)}</td></tr>
</table></td></tr></table></body></html>`
}

export const emailHero = (title: string, lead?: string) =>
  `  <tr><td style="padding:34px 32px 6px;"><h1 style="margin:0;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-0.01em;color:${INK};">${title}</h1>${lead ? `<p style="margin:14px 0 0;font-size:16px;line-height:1.6;color:${MUTED};">${lead}</p>` : ''}</td></tr>`

export const emailPara = (html: string, muted = false) => `  <tr><td style="padding:12px 32px 4px;font-size:15px;line-height:1.65;color:${muted ? MUTED : TEXT};">${html}</td></tr>`

// Same look as the site's .badge-verified pill (globals.css): cyan, 3px corners, 11px bold uppercase.
export const verifiedPill = () =>
  `<span style="display:inline-block;background:#ecfeff;border:1px solid #67e8f9;color:#0e7490;font-size:11px;font-weight:700;line-height:1.4;letter-spacing:0.06em;text-transform:uppercase;padding:3px 7px;border-radius:3px;">&#10003; Verified Developer</span>`

/** Numbered steps. Same look as emailCompactList (owner, 2026-11-23: "I like this design. Can you implement it"): one bordered box,
 *  small orange numbers, a bold lead-in and a short line each. Kept as its own name so older callers do not change. */
export function emailNumbered(items: { title: string; body: string }[]): string {
  return emailCompactList(items)
}

/** A compact numbered list in one bordered box: small orange numbers, a bold lead-in and one short line each. */
export function emailCompactList(items: { title: string; body: string }[]): string {
  const rows = items.map((it, i) => `
      <tr><td width="44" valign="top" style="width:28px;padding:11px 0 11px 16px;font-size:14px;font-weight:700;color:${ORANGE};${i ? `border-top:1px solid ${LINE};` : ''}">${i + 1}</td><td style="padding:11px 16px 11px 0;font-size:14px;line-height:1.55;color:${TEXT};${i ? `border-top:1px solid ${LINE};` : ''}"><strong style="color:${INK};">${it.title}${/[.!?:]$/.test(it.title) ? '' : '.'}</strong> ${it.body}</td></tr>`).join('')
  return `  <tr><td style="padding:10px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;table-layout:fixed;border:1px solid ${LINE};">${rows}</table></td></tr>`
}

/** Topic blocks with bullet points: a bold topic line, then short bullets (what we show, what we need). One box, thin dividers. */
export function emailBulletSections(items: { title: string; bullets: string[] }[]): string {
  const rows = items.map((it, i) => `
      <tr><td style="padding:13px 18px;${i ? `border-top:1px solid ${LINE};` : ''}font-size:14px;line-height:1.55;color:${TEXT};"><div style="margin:0 0 5px;font-size:15px;font-weight:700;color:${INK};"><span style="color:${ORANGE};">${i + 1}.</span>&nbsp; ${it.title}</div><ul style="margin:0;padding:0 0 0 18px;">${it.bullets.map((b) => `<li style="margin:0 0 3px;">${b}</li>`).join('')}</ul></td></tr>`).join('')
  return `  <tr><td style="padding:10px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};">${rows}</table></td></tr>`
}

/** A tinted panel with a heading and a body (used for the Verified Developer steps and "where buyers see it"). */
export function emailPanel(opts: { heading: string; bodyHtml: string; pill?: boolean; tint?: string }): string {
  return `  <tr><td style="padding:14px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${opts.tint ?? '#faf7f2'};border:1px solid ${LINE};border-left:4px solid ${ORANGE};"><tr><td style="padding:20px 22px;">
    ${opts.pill ? `<div style="margin:0 0 12px;">${verifiedPill()}</div>` : ''}
    <div style="margin:0 0 10px;font-size:19px;font-weight:700;line-height:1.3;color:${INK};">${opts.heading}</div>
    <div style="font-size:14px;line-height:1.7;color:${TEXT};">${opts.bodyHtml}</div>
  </td></tr></table></td></tr>`
}

export const emailButton = (label: string, href: string, secondary?: { label: string; href: string }, color?: { bg: string; fg: string }) =>
  `  <tr><td align="center" style="padding:22px 32px 8px;"><a href="${esc(href)}" style="display:inline-block;background:${color?.bg ?? ORANGE};color:${color?.fg ?? INK};text-decoration:none;font-size:16px;font-weight:700;padding:15px 30px;">${label}</a>${secondary ? `<div style="margin-top:14px;font-size:13px;"><a href="${esc(secondary.href)}" style="color:${INK};">${secondary.label}</a></div>` : ''}</td></tr>`

export const emailSignoff = (extra = '') =>
  `  <tr><td style="padding:18px 32px 30px;font-size:15px;line-height:1.65;color:${TEXT};">${extra}<p style="margin:${extra ? '14px' : '0'} 0 0;">Warm regards,<br><strong>LankaNewHomes Team</strong></p></td></tr>`

/** WhatsApp green, so a "reply on WhatsApp" button stands apart from the orange action buttons (owner, 2026-10-18). */
export const WHATSAPP_BUTTON = { bg: '#25d366', fg: '#ffffff' }

/** A label / value table in a bordered, tinted card with the orange left rule. Values are HTML (already escaped by the caller). */
export function emailFacts(rows: [string, string][]): string {
  const body = rows.filter(([, v]) => v).map(([a, b]) => `<tr><td valign="top" style="padding:7px 0;font-size:14px;color:${MUTED};width:34%;border-top:1px solid ${LINE};">${a}</td><td valign="top" style="padding:7px 0;font-size:14px;color:${INK};font-weight:700;border-top:1px solid ${LINE};">${b}</td></tr>`).join('')
  return `  <tr><td style="padding:14px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-left:4px solid ${ORANGE};background:#faf7f2;"><tr><td style="padding:10px 20px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${body}</table></td></tr></table></td></tr>`
}

/** Several buttons stacked, one on top of the other, each the full width (owner, 2026-11-23: "put one on top and other on bottom. Be
 *  constant"; side by side they wrapped onto two lines and came out different sizes on a phone). Each can have its own colour. */
export function emailButtonRow(buttons: { label: string; href: string; bg?: string; fg?: string }[]): string {
  const rows = buttons.map((b) => `<tr><td style="padding:0 0 10px;"><a href="${esc(b.href)}" style="display:block;background:${b.bg ?? ORANGE};color:${b.fg ?? INK};text-decoration:none;text-align:center;white-space:nowrap;font-size:16px;font-weight:700;padding:15px 20px;">${b.label}</a></td></tr>`).join('')
  return `  <tr><td style="padding:20px 32px 0;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`
}

/** A section label (orange caps) above a group of listing cards, e.g. the saved search name or the developer name. */
export const emailSectionLabel = (label: string) =>
  `  <tr><td style="padding:26px 32px 8px;font-size:12px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:${ORANGE};">${label}</td></tr>`

/** One listing as a bordered card: bold name, a muted line (city · price, or update lines), and a "View listing" link. `sponsored` tints it and adds a Sponsored tag. */
export function emailListingCard(opts: { name: string; href?: string | null; meta?: string; cta?: string; lines?: string[]; sponsored?: boolean }): string {
  const bg = opts.sponsored ? '#fef1e8' : '#ffffff'
  const tag = opts.sponsored ? `<div style="margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#c65a1e;">Sponsored</div>` : ''
  const lines = (opts.lines ?? []).map((l) => `<div style="margin:3px 0 0;font-size:13px;line-height:1.55;color:${TEXT};">&bull;&nbsp; ${l}</div>`).join('')
  return `  <tr><td style="padding:0 32px 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};border-left:4px solid ${ORANGE};background:${bg};"><tr>
    <td style="padding:16px 18px;">${tag}${opts.href ? `<a href="${esc(opts.href)}" style="font-size:17px;font-weight:700;line-height:1.3;color:${INK};text-decoration:none;">${opts.name}</a>` : `<span style="font-size:17px;font-weight:700;line-height:1.3;color:${INK};">${opts.name}</span>`}${opts.meta ? `<div style="margin:5px 0 0;font-size:14px;color:${MUTED};">${opts.meta}</div>` : ''}${lines}${opts.href ? `<div style="margin:10px 0 0;"><a href="${esc(opts.href)}" style="font-size:13px;font-weight:700;color:${INK};text-decoration:underline;">${opts.cta ?? 'View listing'} &rarr;</a></div>` : ''}</td>
  </tr></table></td></tr>`
}

/** Plain team sign-off for buyer emails (no mailbox shown). */
export const emailTeamSignoff = () =>
  `  <tr><td style="padding:18px 32px 30px;font-size:15px;line-height:1.65;color:${TEXT};"><p style="margin:0;">Warm regards,<br><strong>LankaNewHomes Team</strong></p></td></tr>`
