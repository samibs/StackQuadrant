import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { db } from "@/lib/db";
import { showcaseProjects, showcaseToolLinks, tools } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { validateString, validateSlug, validateUrl, collectErrors } from "@/lib/utils/validate";
import { sendShowcaseVerificationEmail } from "@/lib/utils/email";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, description, projectUrl, githubUrl, screenshotUrl, techStack, aiToolsUsed, timeToBuild, builderName, builderEmail, builderUrl } = body;

    // Generate slug from name
    const slug = (name || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 200);

    const errors = collectErrors(
      validateString(name, "name", { max: 300 }),
      validateString(description, "description", { max: 5000 }),
      ...(projectUrl ? [validateUrl(projectUrl, "projectUrl")] : []),
      validateString(builderName, "builderName", { max: 200 }),
      validateString(builderEmail, "builderEmail", { max: 320 }),
    );
    if (!builderEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(builderEmail)) {
      errors.push({ field: "builderEmail", message: "Valid email is required" });
    }

    if (errors.length > 0) {
      return apiError("VALIDATION_FAILED", "Invalid input", 400, errors);
    }

    const verificationToken = crypto.randomBytes(32).toString("hex");

    const [project] = await db.insert(showcaseProjects).values({
      name,
      slug: slug || `project-${Date.now()}`,
      description,
      projectUrl: projectUrl || null,
      githubUrl: githubUrl || null,
      screenshotUrl: screenshotUrl || null,
      techStack: Array.isArray(techStack) ? techStack : [],
      aiToolsUsed: Array.isArray(aiToolsUsed) ? aiToolsUsed : [],
      timeToBuild: timeToBuild || null,
      builderName,
      builderEmail,
      builderUrl: builderUrl || null,
      verificationToken,
      status: "pending_verification",
    }).returning();

    // Link tools by slug
    if (Array.isArray(aiToolsUsed) && aiToolsUsed.length > 0) {
      for (const toolSlug of aiToolsUsed) {
        const [tool] = await db.select({ id: tools.id }).from(tools).where(eq(tools.slug, toolSlug));
        if (tool) {
          await db.insert(showcaseToolLinks).values({
            projectId: project.id,
            toolId: tool.id,
          }).onConflictDoNothing();
        }
      }
    }

    // Send verification email
    await sendShowcaseVerificationEmail(builderEmail, verificationToken, name);

    return apiSuccess({ submitted: true, message: "Check your email to verify your submission." }, undefined, 201);
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("unique")) {
      return apiError("CONFLICT", "A project with this name already exists", 409);
    }
    console.error("POST /api/v1/showcase/submit error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
