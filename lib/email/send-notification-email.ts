import "server-only";

import { Resend } from "resend";

type SendNotificationEmailInput = {
  to: string;
  title: string;
  message: string;
  link?: string | null;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getSafeLink(link?: string | null) {
  if (!link) return null;

  const appUrl = process.env.NEXT_PUBLIC_APP_URL;

  try {
    const url = new URL(link, appUrl || "http://localhost:3000");

    if (url.protocol !== "https:" && url.protocol !== "http:") {
      return null;
    }

    // Do not allow links to send users to an unrelated external website.
    if (url.origin !== new URL(appUrl || "http://localhost:3000").origin) {
      return null;
    }

    return appUrl ? url.toString() : null;
  } catch {
    return null;
  }
}

export async function sendNotificationEmail({
  to,
  title,
  message,
  link,
}: SendNotificationEmailInput) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("Email configuration is missing.");
    return { success: false, error: "Email configuration is missing." };
  }

  const resend = new Resend(apiKey);
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);
  const safeLink = getSafeLink(link);

  const html = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${safeTitle}</title>
      </head>
      <body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:24px 28px;background:#047857;color:#ffffff;">
            <h1 style="margin:0;font-size:21px;font-weight:700;">
              Emirate ErrandHub
            </h1>
            <p style="margin:6px 0 0;font-size:13px;color:#d1fae5;">
              Services made easier
            </p>
          </div>

          <div style="padding:32px 28px;">
            <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">
              ${safeTitle}
            </h2>

            <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;white-space:pre-line;">
              ${safeMessage}
            </p>

            ${
              safeLink
                ? `<p style="margin:28px 0 0;">
                    <a href="${escapeHtml(safeLink)}"
                      style="display:inline-block;padding:12px 20px;background:#059669;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                      View details
                    </a>
                  </p>`
                : ""
            }
          </div>

          <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
              You received this email because you have an account with
              Emirate ErrandHub.
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject: title,
    html,
    text: `${title}\n\n${message}${safeLink ? `\n\nView details: ${safeLink}` : ""}`,
  });

  if (error) {
    console.error("Resend email delivery error:", error);
    return { success: false, error: error.message };
  }

  return { success: true, id: data?.id };
}
