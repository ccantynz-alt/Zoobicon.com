/**
 * Shared email template for all Zoobicon transactional emails.
 * Full-width signature with 4 domain links, consistent branding.
 */

export function emailTemplate(opts: {
  heading: string;
  body: string;
  buttonText?: string;
  buttonUrl?: string;
  footerNote?: string;
}): string {
  const { heading, body, buttonText, buttonUrl, footerNote } = opts;

  const button = buttonText && buttonUrl
    ? `<a href="${buttonUrl}" style="display: inline-block; background: #6366f1; color: #ffffff; padding: 16px 40px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 16px; margin: 28px 0 16px; letter-spacing: 0.02em;">${buttonText}</a>`
    : "";

  const note = footerNote
    ? `<p style="color: #94a3b8; font-size: 13px; line-height: 1.5; margin-top: 8px;">${footerNote}</p>`
    : "";

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin: 0; padding: 0; background-color: #0f172a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #0f172a; padding: 40px 0;">
    <tr>
      <td align="center">
        <!-- Logo -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 0 24px 32px;">
              <span style="font-size: 28px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">ZOOBICON</span>
            </td>
          </tr>
        </table>

        <!-- Content Card -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="background: #1e293b; border-radius: 16px; padding: 40px 32px; border: 1px solid rgba(255,255,255,0.06);">
              <h1 style="font-size: 26px; font-weight: 700; color: #ffffff; margin: 0 0 16px; line-height: 1.3;">${heading}</h1>
              <div style="color: #cbd5e1; font-size: 16px; line-height: 1.7;">${body}</div>
              ${button}
              ${note}
            </td>
          </tr>
        </table>

        <!-- Signature / Footer -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px;">
          <tr>
            <td style="padding: 32px 24px 16px; text-align: center;">
              <p style="color: #64748b; font-size: 14px; margin: 0 0 16px; line-height: 1.6;">
                Build websites, apps, and stores in 60 seconds with AI.
              </p>
              <!-- Domain Links -->
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                <tr>
                  <td style="padding: 0 12px;">
                    <a href="https://zoobicon.com" style="color: #818cf8; text-decoration: none; font-size: 14px; font-weight: 600;">zoobicon.com</a>
                  </td>
                  <td style="color: #334155; font-size: 14px;">•</td>
                  <td style="padding: 0 12px;">
                    <a href="https://zoobicon.ai" style="color: #818cf8; text-decoration: none; font-size: 14px; font-weight: 600;">zoobicon.ai</a>
                  </td>
                  <td style="color: #334155; font-size: 14px;">•</td>
                  <td style="padding: 0 12px;">
                    <a href="https://zoobicon.io" style="color: #818cf8; text-decoration: none; font-size: 14px; font-weight: 600;">zoobicon.io</a>
                  </td>
                  <td style="color: #334155; font-size: 14px;">•</td>
                  <td style="padding: 0 12px;">
                    <a href="https://zoobicon.sh" style="color: #818cf8; text-decoration: none; font-size: 14px; font-weight: 600;">zoobicon.sh</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding: 8px 24px 40px; text-align: center;">
              <p style="color: #475569; font-size: 12px; margin: 0;">
                &copy; ${new Date().getFullYear()} Zoobicon. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
