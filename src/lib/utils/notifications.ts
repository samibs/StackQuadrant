import nodemailer from "nodemailer";
import { logNotification } from "@/lib/db/queries";
import DOMPurify from "isomorphic-dompurify";

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

const TYPE_DESCRIPTIONS: Record<string, string> = {
  add_tool: "add a new tool",
  move_tool: "move a tool to a different quadrant",
  update_metadata: "update tool metadata",
  merge_duplicates: "merge duplicate entries",
  flag_discontinued: "flag a tool as discontinued",
};

interface SuggestionLike {
  id: string;
  type: string;
  toolName: string;
  toolSlug?: string | null;
  submitterEmail?: string | null;
}

export async function sendSuggestionNotification(
  suggestion: SuggestionLike,
  status: "approved" | "rejected" | "auto_approved",
  rejectionReason?: string,
) {
  if (!suggestion.submitterEmail) return;

  const sanitizedToolName = DOMPurify.sanitize(suggestion.toolName);
  const typeDesc = TYPE_DESCRIPTIONS[suggestion.type] || suggestion.type;
  const changelogUrl = suggestion.toolSlug
    ? `${appUrl}/tools/${suggestion.toolSlug}/changelog`
    : `${appUrl}/tools`;

  let subject: string;
  let bodyContent: string;

  if (status === "approved" || status === "auto_approved") {
    subject = `Your suggestion for ${sanitizedToolName} was approved`;
    bodyContent = `
      <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0 0 8px;">
        Your suggestion to <strong style="color: #fff;">${typeDesc}</strong> for
        <strong style="color: #fff;">${sanitizedToolName}</strong> on StackQuadrant
        has been ${status === "auto_approved" ? "auto-approved based on your contributor reputation" : "approved by our team"}.
      </p>
      <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0 0 24px;">
        The change will be reflected in the tool's changelog.
      </p>
      <a href="${changelogUrl}" style="display: inline-block; padding: 10px 24px; background: #22c55e; color: #fff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">
        View Changelog
      </a>
      <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 24px 0 0;">
        Thank you for helping improve StackQuadrant's data quality!
      </p>
    `;
  } else {
    subject = `Update on your suggestion for ${sanitizedToolName}`;
    const sanitizedReason = rejectionReason ? DOMPurify.sanitize(rejectionReason) : "No specific reason provided.";
    bodyContent = `
      <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0 0 8px;">
        Your suggestion to <strong style="color: #fff;">${typeDesc}</strong> for
        <strong style="color: #fff;">${sanitizedToolName}</strong> on StackQuadrant
        was reviewed but not applied.
      </p>
      <div style="margin: 16px 0; padding: 12px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); border-radius: 4px;">
        <p style="font-size: 12px; color: #ef4444; font-weight: 600; margin: 0 0 4px;">Reason:</p>
        <p style="font-size: 12px; color: #ccc; margin: 0;">${sanitizedReason}</p>
      </div>
      <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0;">
        If you have additional evidence, you're welcome to submit a new suggestion with updated information.
      </p>
    `;
  }

  const html = `
    <div style="font-family: 'SF Mono', 'Fira Code', monospace; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #e0e0e0; border: 1px solid #222;">
      <h2 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 16px;">StackQuadrant</h2>
      ${bodyContent}
      <hr style="border: none; border-top: 1px solid #222; margin: 24px 0;" />
      <p style="font-size: 11px; color: #666; margin: 0;">
        You received this email because you submitted a suggestion on StackQuadrant.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `StackQuadrant <${fromEmail}>`,
    to: suggestion.submitterEmail,
    subject,
    html,
  });

  await logNotification({
    suggestionId: suggestion.id,
    recipientEmail: suggestion.submitterEmail,
    type: status,
    emailSubject: subject,
  });
}
