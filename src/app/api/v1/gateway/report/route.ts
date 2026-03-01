import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { rateLimit, getClientIp } from "@/lib/utils/rate-limit";
import { collectErrors, validateString, validateEnum, validateUrl } from "@/lib/utils/validate";
import { createReport, getRegisteredSite } from "@/lib/db/queries";
import DOMPurify from "isomorphic-dompurify";

const REPORT_TYPES = ["bug", "data_quality"];

export async function POST(request: NextRequest) {
  try {
    // Validate site ID
    const siteId = request.headers.get("x-site-id");
    if (!siteId) {
      return apiError("MISSING_SITE_ID", "X-Site-Id header is required", 400);
    }

    const site = await getRegisteredSite(siteId);
    if (!site || !site.active) {
      return apiError("INVALID_SITE", `Site '${siteId}' is not registered or inactive`, 403);
    }

    const ip = getClientIp(request);
    const rl = rateLimit(`gateway:report:${siteId}:${ip}`, 10, 3600000);
    if (!rl.success) {
      return apiError("RATE_LIMITED", "Too many reports. Please try again later.", 429);
    }

    const body = await request.json();

    const errors = collectErrors(
      validateEnum(body.type, "type", REPORT_TYPES, { required: true }),
      validateString(body.description, "description", { max: 2000 }),
      validateString(body.screenshotUrl, "screenshotUrl", { max: 500, required: false }),
      validateString(body.submitterEmail, "submitterEmail", { max: 320, required: false }),
    );

    if (body.type === "bug") {
      const bugErrors = collectErrors(
        validateString(body.page, "page", { max: 500, required: false }),
        validateString(body.expectedResult, "expectedResult", { max: 2000, required: false }),
      );
      errors.push(...bugErrors);
    }

    if (body.type === "data_quality") {
      const dqErrors = collectErrors(
        validateString(body.toolSlug, "toolSlug", { required: false }),
        validateString(body.fieldReference, "fieldReference", { max: 100, required: false }),
        validateString(body.currentValue, "currentValue", { required: false }),
        validateString(body.correctedValue, "correctedValue", { required: false }),
      );
      errors.push(...dqErrors);
      if (body.evidenceLink) {
        const urlErr = validateUrl(body.evidenceLink, "evidenceLink");
        if (urlErr) errors.push(urlErr);
      }
    }

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid report data", 400, errors);
    }

    const sanitizedDescription = DOMPurify.sanitize(body.description);

    const context = {
      pageUrl: body.context?.pageUrl || undefined,
      browser: request.headers.get("user-agent") || undefined,
      locale: request.headers.get("accept-language") || undefined,
    };

    const result = await createReport({
      type: body.type,
      toolSlug: body.toolSlug || undefined,
      page: body.page || undefined,
      description: sanitizedDescription,
      expectedResult: body.expectedResult || undefined,
      currentValue: body.currentValue || undefined,
      correctedValue: body.correctedValue || undefined,
      fieldReference: body.fieldReference || undefined,
      evidenceLink: body.evidenceLink || undefined,
      screenshotUrl: body.screenshotUrl || undefined,
      submitterEmail: body.submitterEmail || undefined,
      context,
      site: siteId,
    });

    return apiSuccess(result, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/gateway/report error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
