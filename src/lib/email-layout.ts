// Shared look for the developer-facing emails (owner, 2026-10-16: "the email design needs a better design, update the logo"): dark header with
// the white logo, orange top rule, big heading, numbered cards, an orange button and a quiet footer. Table layout and inline styles only,
// so it renders in Gmail, Outlook and Zoho. The logo is a PNG on the public site (SVG is blocked by most mail clients).
export const esc = (v: unknown) => String(v ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

const INK = '#1c1c20'
const TEXT = '#2b2b29'
const MUTED = '#6b6a66'
const LINE = '#e4e2db'
const PAPER = '#f3efe8'
const ORANGE = '#f47b36'
const SITE = 'https://www.lankanewhomes.com'
const FONT = "Arial,Helvetica,sans-serif"

export function emailShell(opts: { preheader: string; title: string; body: string; footerNote?: string }): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(opts.title)}</title></head>
<body style="margin:0;background:${PAPER};font-family:${FONT};color:${TEXT};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(opts.preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PAPER};padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:620px;background:#ffffff;border:1px solid ${LINE};">
  <tr><td style="background:${INK};border-top:4px solid ${ORANGE};padding:26px 32px;"><a href="${SITE}" style="text-decoration:none;"><img src="${SITE}/brand/lankanewhomes-logo-white.png" width="124" alt="LankaNewHomes" style="display:block;border:0;width:124px;height:auto;font-size:20px;font-weight:700;color:#ffffff;"></a></td></tr>
${opts.body}
  <tr><td style="background:${INK};padding:22px 32px;font-size:12px;line-height:1.6;color:#b9b8b2;">${opts.footerNote ?? "You are receiving this because your company or project is listed on LankaNewHomes."}<br><a href="${SITE}" style="color:#ffffff;text-decoration:underline;">lankanewhomes.com</a> &nbsp;·&nbsp; Sri Lanka's new homes marketplace: apartments, houses and land, with prices, floor plans and developer details in one place.</td></tr>
</table></td></tr></table></body></html>`
}

export const emailHero = (title: string, lead?: string) =>
  `  <tr><td style="padding:34px 32px 6px;"><h1 style="margin:0;font-size:30px;font-weight:400;line-height:1.2;letter-spacing:-0.01em;color:${INK};">${title}</h1>${lead ? `<p style="margin:14px 0 0;font-size:16px;line-height:1.6;color:${MUTED};">${lead}</p>` : ''}</td></tr>`

export const emailPara = (html: string, muted = false) => `  <tr><td style="padding:12px 32px 4px;font-size:15px;line-height:1.65;color:${muted ? MUTED : TEXT};">${html}</td></tr>`

export const verifiedPill = () =>
  `<span style="display:inline-block;background:#ecfeff;border:1px solid #67e8f9;color:#0e7490;font-size:13px;font-weight:700;padding:6px 12px;border-radius:3px;">&#10003;&nbsp; Verified Developer</span>`

/** Numbered cards: a dark number tile on the left, a bold title and a short explanation. */
export function emailNumbered(items: { title: string; body: string }[]): string {
  const rows = items.map((it, i) => `
      <tr><td style="padding:0 0 10px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${LINE};background:#ffffff;"><tr>
        <td width="48" valign="top" style="background:${INK};color:#ffffff;text-align:center;font-size:17px;font-weight:700;padding:16px 0;">${i + 1}</td>
        <td style="padding:14px 18px;font-size:14px;line-height:1.6;color:${TEXT};"><strong style="font-size:15px;color:${INK};">${it.title}</strong><br>${it.body}</td>
      </tr></table></td></tr>`).join('')
  return `  <tr><td style="padding:14px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table></td></tr>`
}

/** A tinted panel with a heading and a body (used for the Verified Developer steps and "where buyers see it"). */
export function emailPanel(opts: { heading: string; bodyHtml: string; pill?: boolean; tint?: string }): string {
  return `  <tr><td style="padding:14px 32px 6px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${opts.tint ?? '#faf7f2'};border:1px solid ${LINE};border-left:4px solid ${ORANGE};"><tr><td style="padding:20px 22px;">
    ${opts.pill ? `<div style="margin:0 0 12px;">${verifiedPill()}</div>` : ''}
    <div style="margin:0 0 10px;font-size:19px;font-weight:700;line-height:1.3;color:${INK};">${opts.heading}</div>
    <div style="font-size:14px;line-height:1.7;color:${TEXT};">${opts.bodyHtml}</div>
  </td></tr></table></td></tr>`
}

export const emailButton = (label: string, href: string, secondary?: { label: string; href: string }) =>
  `  <tr><td align="center" style="padding:22px 32px 8px;"><a href="${esc(href)}" style="display:inline-block;background:${ORANGE};color:${INK};text-decoration:none;font-size:16px;font-weight:700;padding:15px 30px;">${label}</a>${secondary ? `<div style="margin-top:14px;font-size:13px;"><a href="${esc(secondary.href)}" style="color:${INK};">${secondary.label}</a></div>` : ''}</td></tr>`

export const emailSignoff = (extra = '') =>
  `  <tr><td style="padding:18px 32px 30px;font-size:15px;line-height:1.65;color:${TEXT};">${extra}<p style="margin:${extra ? '14px' : '0'} 0 0;">Warm regards,<br><strong>The LankaNewHomes team</strong><br><span style="color:${MUTED};font-size:13px;">developers@lankanewhomes.com</span></p></td></tr>`
