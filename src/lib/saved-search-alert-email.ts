// Branded HTML for the weekly saved-search alert email — same visual style
// as follower-digest-email.ts/lead-alert-email.ts. Content (which listings
// matched, which are the Featured placements) is decided in
// src/lib/saved-search-alerts.ts; this file only renders it.

export type SavedSearchAlertListing = { slug: string; name: string; city: string; startingPriceLkr: number }
export type SavedSearchAlertFeaturedListing = { slug: string; name: string; city: string; isPremium: boolean }

export type SavedSearchAlertGroup = {
  searchName: string
  matches: SavedSearchAlertListing[]
  featured: SavedSearchAlertFeaturedListing[]
}

export type SavedSearchAlertEmailInput = {
  buyerName: string | null
  groups: SavedSearchAlertGroup[]
  serverURL: string
  accountUrl: string
}

function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

function formatLkrShort(amount: number): string {
  if (!(amount > 0)) return "Contact for pricing"
  return `Rs. ${amount.toLocaleString("en-LK")}`
}

// Owner's 2026-09-24 build note (item 9) — Developer Pro/Campaign's
// "placement in saved-search alert emails" perk. Deliberately labeled
// "Sponsored" (not "Featured") here, matching the placement spec's own
// transparency note ("mark every paid card Featured or Sponsored") — inside
// an email, next to a buyer's own real matches, "Sponsored" reads more
// honestly than "Featured" would.
function renderFeaturedBlock(featured: SavedSearchAlertFeaturedListing[], serverURL: string): string {
  if (featured.length === 0) return ""
  const rows = featured
    .map(
      (listing) => `
        <tr>
          <td style="padding:8px 0; border-top:1px solid #f4b48a;">
            <a href="${serverURL}/projects/${escapeHtml(listing.slug)}" style="font-size:14px; font-weight:700; color:${listing.isPremium ? "#c65a1e" : "#92670c"}; text-decoration:none;">${escapeHtml(listing.name)}</a>
            <span style="font-size:12px; color:#9a9282;"> — ${escapeHtml(listing.city)}</span>
          </td>
        </tr>`
    )
    .join("")

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px; background-color:#fef1e8; border:1px solid #f4b48a;">
      <tr>
        <td style="padding:10px 14px 4px;">
          <p style="margin:0; font-size:10.5px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; color:#c65a1e;">Sponsored</p>
        </td>
      </tr>
      <tr>
        <td style="padding:0 14px 10px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${rows}</table>
        </td>
      </tr>
    </table>`
}

export function renderSavedSearchAlertEmailHTML(input: SavedSearchAlertEmailInput): string {
  const greetingName = input.buyerName ? escapeHtml(input.buyerName) : "there"
  const searchBlocks = input.groups
    .map((group) => {
      const matchRows = group.matches
        .map(
          (listing) => `
            <tr>
              <td style="padding:10px 0; border-top:1px solid #e4e0d8;">
                <a href="${input.serverURL}/projects/${escapeHtml(listing.slug)}" style="font-size:15px; font-weight:700; color:#1f1f1f; text-decoration:none;">${escapeHtml(listing.name)}</a>
                <p style="margin:4px 0 0; font-size:13px; color:#4a4a4a;">${escapeHtml(listing.city)} &middot; ${escapeHtml(formatLkrShort(listing.startingPriceLkr))}</p>
              </td>
            </tr>`
        )
        .join("")

      return `
        <tr>
          <td style="padding:18px 32px 0;">
            <p style="margin:0 0 4px; font-size:12px; letter-spacing:0.08em; text-transform:uppercase; color:#f47b36; font-weight:700;">${escapeHtml(group.searchName)}</p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${matchRows}</table>
            ${renderFeaturedBlock(group.featured, input.serverURL)}
          </td>
        </tr>`
    })
    .join("")

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>New listings matching your saved search</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:520px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <span style="font-size:20px; font-weight:700; color:#1f1f1f;">Lanka<span style="color:#f47b36;">New</span>Homes</span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 32px 0;">
              <h1 style="margin:0; font-size:20px; line-height:1.3; color:#1f1f1f; font-weight:700;">Hi ${greetingName}, new listings match your search</h1>
              <p style="margin:8px 0 0; font-size:13px; color:#9a9282;">Based on the saved searches in your account</p>
            </td>
          </tr>

          ${searchBlocks}

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <a href="${input.accountUrl}" style="font-size:14px; font-weight:700; color:#f47b36; text-decoration:none;">Manage your saved searches</a>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:8px 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#9a9282;">
                You're getting this because email notifications are on for a saved search — turn them off any time from ${input.accountUrl}.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
