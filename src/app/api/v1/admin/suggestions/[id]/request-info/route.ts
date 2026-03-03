import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { requireAdmin } from "@/lib/utils/auth";
import { getSuggestionById, updateSuggestionStatus } from "@/lib/db/queries";
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

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError("UNAUTHORIZED", "Admin access required", 401);

  try {
    const { id } = await params;
    const body = await request.json();

    if (!body.question || typeof body.question !== "string" || body.question.trim().length === 0) {
      return apiError("VALIDATION_ERROR", "Question is required", 400);
    }

    const suggestion = await getSuggestionById(id);
    if (!suggestion) {
      return apiError("NOT_FOUND", "Suggestion not found", 404);
    }

    if (suggestion.status !== "pending") {
      return apiError(
        "INVALID_STATE_TRANSITION",
        `Cannot request info on suggestion with status "${suggestion.status}". Must be "pending".`,
        422
      );
    }

    if (!suggestion.submitterEmail) {
      return apiError("NO_SUBMITTER_EMAIL", "No submitter email on record", 422);
    }

    const updated = await updateSuggestionStatus(id, {
      status: "needs_info",
      adminNotes: body.question.trim(),
      reviewedBy: admin.email,
    });

    await transporter.sendMail({
      from: `StackQuadrant <${fromEmail}>`,
      to: suggestion.submitterEmail,
      subject: `Additional info needed for your suggestion: ${suggestion.toolName}`,
      html: `
        <div style="font-family: 'SF Mono', 'Fira Code', monospace; max-width: 480px; margin: 0 auto; padding: 32px; background: #0a0a0a; color: #e0e0e0; border: 1px solid #222;">
          <h2 style="font-size: 16px; font-weight: 700; color: #fff; margin: 0 0 16px;">StackQuadrant</h2>
          <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 0 0 8px;">
            We're reviewing your suggestion for <strong style="color: #fff;">${suggestion.toolName}</strong> and need some additional information.
          </p>
          <div style="padding: 12px 16px; background: #111; border-left: 3px solid #0ea5e9; margin: 16px 0; font-size: 13px; color: #ccc; line-height: 1.6;">
            ${body.question.trim().replace(/\n/g, "<br>")}
          </div>
          <p style="font-size: 13px; line-height: 1.6; color: #aaa; margin: 16px 0;">
            You can reply to this email or submit an updated suggestion on the site.
          </p>
          <a href="${appUrl}" style="display: inline-block; padding: 10px 24px; background: #0ea5e9; color: #fff; text-decoration: none; border-radius: 4px; font-size: 13px; font-weight: 600;">
            Visit StackQuadrant
          </a>
          <p style="font-size: 11px; color: #666; margin: 24px 0 0;">
            If you didn't submit this suggestion, please ignore this email.
          </p>
        </div>
      `,
    }).catch((err) => {
      console.error("Failed to send info request email:", err);
    });

    return apiSuccess(updated);
  } catch (error) {
    console.error("POST /api/v1/admin/suggestions/[id]/request-info error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
