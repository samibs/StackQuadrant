import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { collectErrors, validateString, validateEnum, validateUrl } from "@/lib/utils/validate";
import { createSuggestion } from "@/lib/db/queries";
import DOMPurify from "isomorphic-dompurify";

const SUGGESTION_TYPES = ["add_tool", "move_tool", "update_metadata", "merge_duplicates", "flag_discontinued"];
const USER_ROLES = ["user", "vendor", "observer"];
const TYPES_REQUIRING_EVIDENCE = ["move_tool", "flag_discontinued"];

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request);
    const rl = rateLimit(`widget:suggest:${ip}`, 5, 3600000);
    if (!rl.success) {
      return apiError("RATE_LIMITED", "Too many suggestions. Please try again later.", 429);
    }

    const body = await request.json();

    const errors = collectErrors(
      validateEnum(body.type, "type", SUGGESTION_TYPES, { required: true }),
      validateString(body.toolName, "toolName", { max: 200 }),
      validateString(body.reason, "reason", { max: 2000 }),
      validateEnum(body.userRole, "userRole", USER_ROLES),
      validateString(body.submitterEmail, "submitterEmail", { max: 320, required: false }),
      validateString(body.toolSlug, "toolSlug", { required: false }),
      validateString(body.proposedQuadrant, "proposedQuadrant", { required: false }),
    );

    // Validate evidenceLinks array
    const evidenceLinks: string[] = [];
    if (body.evidenceLinks !== undefined && body.evidenceLinks !== null) {
      if (!Array.isArray(body.evidenceLinks)) {
        errors.push({ field: "evidenceLinks", message: "evidenceLinks must be an array" });
      } else if (body.evidenceLinks.length > 3) {
        errors.push({ field: "evidenceLinks", message: "evidenceLinks must have at most 3 items" });
      } else {
        for (let i = 0; i < body.evidenceLinks.length; i++) {
          const urlErr = validateUrl(body.evidenceLinks[i], `evidenceLinks[${i}]`);
          if (urlErr) {
            errors.push(urlErr);
          } else if (body.evidenceLinks[i]) {
            evidenceLinks.push(body.evidenceLinks[i]);
          }
        }
      }
    }

    // Evidence links required for move_tool and flag_discontinued
    if (TYPES_REQUIRING_EVIDENCE.includes(body.type) && evidenceLinks.length < 1) {
      errors.push({ field: "evidenceLinks", message: "At least 1 evidence link is required for this suggestion type" });
    }

    // Validate tags array
    const tags: string[] = [];
    if (body.tags !== undefined && body.tags !== null) {
      if (!Array.isArray(body.tags)) {
        errors.push({ field: "tags", message: "tags must be an array" });
      } else {
        for (const tag of body.tags) {
          if (typeof tag !== "string") {
            errors.push({ field: "tags", message: "Each tag must be a string" });
            break;
          }
          tags.push(tag);
        }
      }
    }

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid suggestion data", 400, errors);
    }

    const sanitizedReason = DOMPurify.sanitize(body.reason);

    const context = {
      pageUrl: body.context?.pageUrl || undefined,
      toolCardId: body.context?.toolCardId || undefined,
      browser: request.headers.get("user-agent") || undefined,
      locale: request.headers.get("accept-language") || undefined,
    };

    const result = await createSuggestion({
      type: body.type,
      toolName: body.toolName,
      toolSlug: body.toolSlug || undefined,
      proposedQuadrant: body.proposedQuadrant || undefined,
      reason: sanitizedReason,
      evidenceLinks,
      tags,
      userRole: body.userRole || "user",
      submitterEmail: body.submitterEmail || undefined,
      context,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/widget/suggest error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
