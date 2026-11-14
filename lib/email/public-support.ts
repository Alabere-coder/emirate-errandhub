import "server-only";

import { Resend } from "resend";

const supportEmail = "ishowtechs@gmail.com";

type PublicSupportEmailInput = {
  fullName: string;
  email: string;
  category: string;
  subject: string;
  message: string;
};

type PublicSupportReplyEmailInput = {
  visitorName: string;
  visitorEmail: string;
  originalSubject: string;
  message: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getEmailClient() {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    throw new Error("Email configuration is missing.");
  }

  return {
    resend: new Resend(apiKey),
    from,
  };
}

function emailLayout(title: string, content: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>${escapeHtml(title)}</title>
      </head>
      <body style="margin:0;padding:32px 16px;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
        <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
          <div style="padding:24px 28px;background:#047857;color:#ffffff;">
            <h1 style="margin:0;font-size:21px;font-weight:700;">
              Emirate ErrandHub
            </h1>
            <p style="margin:6px 0 0;font-size:13px;color:#d1fae5;">
              Services made easier
            </p>
          </div>

          <div style="padding:32px 28px;">
            ${content}
          </div>

          <div style="padding:20px 28px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;font-size:12px;line-height:1.6;color:#64748b;">
              Emirate ErrandHub Support Team
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export async function sendPublicSupportConfirmation(
  input: PublicSupportEmailInput,
) {
  try {
    const { resend, from } = getEmailClient();

    const { data, error } = await resend.emails.send({
      from,
      to: input.email,
      replyTo: supportEmail,
      subject: "We received your enquiry | Emirate ErrandHub",
      html: emailLayout(
        "We received your enquiry",
        `
          <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">
            Thank you for contacting us, ${escapeHtml(input.fullName)}.
          </h2>

          <p style="margin:0;font-size:15px;line-height:1.7;color:#475569;">
            Your enquiry has been received by our support team. We'll review
            your message and respond to this email address.
          </p>

          <div style="margin-top:24px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <p style="margin:0 0 8px;font-size:13px;color:#64748b;">
              Your enquiry reference
            </p>
            <p style="margin:0;font-size:15px;font-weight:700;color:#0f172a;">
              ${escapeHtml(input.subject)}
            </p>
          </div>

          <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
            Please keep this email for your records. You can reply to this
            email if you need to add more information. Your response will
            reach our support team.
          </p>
        `,
      ),
      text: [
        `Hello ${input.fullName},`,
        "",
        "Thank you for contacting Emirate ErrandHub.",
        "We have received your enquiry and our support team will review it.",
        "We will respond to this email address.",
        "",
        `Subject: ${input.subject}`,
        "",
        `You can reply to this email to reach our support team at ${supportEmail}.`,
        "",
        "Emirate ErrandHub Support Team",
      ].join("\n"),
    });

    if (error) {
      console.error("Public support confirmation email failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Public support confirmation email error:", error);

    return {
      success: false,
      error: "Unable to send confirmation email.",
    };
  }
}

export async function sendPublicSupportAdminNotification(
  input: PublicSupportEmailInput,
) {
  try {
    const { resend, from } = getEmailClient();

    const { data, error } = await resend.emails.send({
      from,
      to: supportEmail,
      replyTo: input.email,
      subject: `New public enquiry: ${input.subject}`,
      html: emailLayout(
        "New public support enquiry",
        `
          <h2 style="margin:0 0 20px;font-size:20px;color:#0f172a;">
            A visitor has submitted a new enquiry.
          </h2>

          <table style="width:100%;border-collapse:collapse;font-size:14px;">
            <tr>
              <td style="padding:10px 0;color:#64748b;width:120px;">Name</td>
              <td style="padding:10px 0;color:#0f172a;font-weight:600;">
                ${escapeHtml(input.fullName)}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;">Email</td>
              <td style="padding:10px 0;color:#0f172a;">
                ${escapeHtml(input.email)}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;">Category</td>
              <td style="padding:10px 0;color:#0f172a;">
                ${escapeHtml(input.category)}
              </td>
            </tr>
            <tr>
              <td style="padding:10px 0;color:#64748b;">Subject</td>
              <td style="padding:10px 0;color:#0f172a;font-weight:600;">
                ${escapeHtml(input.subject)}
              </td>
            </tr>
          </table>

          <div style="margin-top:20px;padding:18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <h3 style="margin:0 0 12px;font-size:15px;color:#0f172a;">
              Visitor's message
            </h3>
            <p style="margin:0;font-size:14px;line-height:1.8;color:#475569;white-space:pre-wrap;">
              ${escapeHtml(input.message)}
            </p>
          </div>

          <p style="margin:24px 0 0;font-size:13px;line-height:1.7;color:#64748b;">
            The enquiry is also available in the Emirate ErrandHub admin dashboard.
          </p>
        `,
      ),
      text: [
        "A visitor has submitted a new public support enquiry.",
        "",
        `Name: ${input.fullName}`,
        `Email: ${input.email}`,
        `Category: ${input.category}`,
        `Subject: ${input.subject}`,
        "",
        "Message:",
        input.message,
        "",
        "View and respond to this enquiry in the admin dashboard.",
      ].join("\n"),
    });

    if (error) {
      console.error("Public support admin notification failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Public support admin notification error:", error);

    return {
      success: false,
      error: "Unable to notify the support team.",
    };
  }
}

/**
 * Sends an admin's response directly to the visitor.
 * When the visitor clicks Reply, the response goes to the help desk email.
 */
export async function sendPublicSupportReply(
  input: PublicSupportReplyEmailInput,
) {
  try {
    const { resend, from } = getEmailClient();

    const subject = input.originalSubject.trim();
    const replySubject = /^re:/i.test(subject) ? subject : `Re: ${subject}`;

    const { data, error } = await resend.emails.send({
      from,
      to: input.visitorEmail,
      replyTo: supportEmail,
      subject: replySubject,
      html: emailLayout(
        "Response to your enquiry",
        `
          <h2 style="margin:0 0 16px;font-size:20px;color:#0f172a;">
            Hello ${escapeHtml(input.visitorName)},
          </h2>

          <p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#475569;">
            Our support team has responded to your enquiry.
          </p>

          <div style="padding:20px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
            <p style="margin:0;font-size:14px;line-height:1.8;color:#334155;white-space:pre-wrap;">
              ${escapeHtml(input.message)}
            </p>
          </div>

          <p style="margin:24px 0 0;font-size:14px;line-height:1.7;color:#64748b;">
            If you need further assistance, simply reply to this email.
            Your response will be delivered to our support team at
            ${escapeHtml(supportEmail)}.
          </p>

          <p style="margin:24px 0 0;font-size:14px;font-weight:600;color:#0f172a;">
            Emirate ErrandHub Support Team
          </p>
        `,
      ),
      text: [
        `Hello ${input.visitorName},`,
        "",
        "Our support team has responded to your enquiry.",
        "",
        input.message,
        "",
        "If you need further assistance, simply reply to this email.",
        `Your response will be delivered to ${supportEmail}.`,
        "",
        "Emirate ErrandHub Support Team",
      ].join("\n"),
    });

    if (error) {
      console.error("Public support reply email failed:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (error) {
    console.error("Public support reply email error:", error);

    return {
      success: false,
      error: "Unable to send the support reply email.",
    };
  }
}
