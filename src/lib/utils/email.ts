import nodemailer from "nodemailer";

const fromEmail = process.env.FROM_EMAIL || "info@stackquadrant.com";
const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtppro.zoho.eu",
  port: parseInt(process.env.SMTP_PORT || "465"),
  secure: true,
  auth: {
    user: process.env.SMTP_USER || fromEmail,
    pass: process.env.SMTP_PASS || "",
  },
});

export async function sendConfirmationEmail(email: string, token: string) {
  const confirmUrl = `${appUrl}/api/v1/subscribers/confirm?token=${token}`;

  await transporter.sendMail({
    from: `StackQuadrant <${fromEmail}>`,
    to: email,
    subject: "Confirm your StackQuadrant subscription",
    html: `
      <div style="font-family: 'SF Mono', 'Fira Code', monospace; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #e0e0e0; border: 1px solid #222;">
        <h2 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 16px;">StackQuadrant</h2>
        <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0 0 24px;">
          Click the button below to confirm your subscription. You'll receive updates when we publish new tool evaluations and benchmarks.
        </p>
        <a href="${confirmUrl}" style="display: inline-block; padding: 10px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">
          Confirm Subscription
        </a>
        <p style="font-size: 11px; color: #666; margin: 24px 0 0;">
          If you didn't subscribe, ignore this email. This link expires in 48 hours.
        </p>
      </div>
    `,
  });
}
