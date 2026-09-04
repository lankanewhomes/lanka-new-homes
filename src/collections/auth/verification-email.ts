// Branded HTML for the developer/admin account-verification email — Payload's
// own auth.verify sends a plain default otherwise. Same visual style as the
// buyer signup-confirmation template (docs/email-templates/*.html), adapted
// for a real verificationURL (Payload's built-in /cms/users/verify/:token
// page) instead of Supabase's {{ .ConfirmationURL }} template variable.
export function renderVerificationEmailHTML({
  verificationURL,
  loginURL,
}: {
  verificationURL: string
  loginURL: string
}): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Confirm your email</title>
</head>
<body style="margin:0; padding:0; background-color:#f5f5f0; font-family:Helvetica, Arial, sans-serif;">
  <div style="display:none; max-height:0; overflow:hidden; mso-hide:all;">
    Confirm your email to activate your account on Lanka New Homes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f5f5f0; padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%; max-width:480px; background-color:#ffffff; border-radius:8px; overflow:hidden;">

          <tr>
            <td align="center" style="padding:32px 32px 8px;">
              <span style="font-size:20px; font-weight:700; color:#1f1f1f;">Lanka<span style="color:#f47b36;">New</span>Homes</span>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:16px 32px 0;">
              <h1 style="margin:0; font-size:22px; line-height:1.3; color:#1f1f1f; font-weight:700;">Confirm your account</h1>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:16px 32px 0;">
              <p style="margin:0; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Your Lanka New Homes account has been created. Confirm your email to activate it and sign in.
              </p>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:28px 32px 8px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="border-radius:999px; background-color:#f47b36;">
                    <a href="${verificationURL}"
                       style="display:inline-block; padding:14px 32px; font-size:15px; font-weight:700; color:#ffffff; text-decoration:none; border-radius:999px;">
                      Confirm your email
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:12px 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.5; color:#9a9282; word-break:break-all;">
                Or paste this link into your browser:<br>
                <a href="${verificationURL}" style="color:#9a9282;">${verificationURL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:0 32px;">
              <div style="border-top:1px solid #e4e0d8;"></div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 32px 8px;">
              <p style="margin:0; font-size:13px; line-height:1.6; color:#4a4a4a;">
                Once confirmed, sign in any time at<br>
                <a href="${loginURL}" style="color:#1f1f1f; font-weight:600;">${loginURL}</a>
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding:12px 32px 0;">
              <div style="border-top:1px solid #e4e0d8;"></div>
            </td>
          </tr>

          <tr>
            <td align="center" style="padding:20px 32px 32px;">
              <p style="margin:0; font-size:12px; line-height:1.6; color:#9a9282;">
                This inbox is not monitored. For help, contact us at
                <a href="mailto:support@lankanewhomes.com" style="color:#9a9282;">support@lankanewhomes.com</a>.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}
