import { NextRequest } from "next/server";
import { apiSuccess, apiError } from "@/lib/utils/api";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";
import { sendConfirmationEmail } from "@/lib/utils/email";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = body;

    if (!email || typeof email !== "string" || email.length > 320) {
      return apiError("VALIDATION_FAILED", "A valid email is required", 400, [
        { field: "email", message: "Invalid email format" },
      ]);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return apiError("VALIDATION_FAILED", "A valid email is required", 400, [
        { field: "email", message: "Invalid email format" },
      ]);
    }

    const [existing] = await db.select().from(subscribers).where(eq(subscribers.email, email.toLowerCase()));
    if (existing) {
      if (existing.status === "confirmed") {
        return apiError("CONFLICT", "This email is already subscribed", 409);
      }
      return apiSuccess({ status: "pending_confirmation" }, undefined, 200);
    }

    const confirmationToken = uuidv4();
    await db.insert(subscribers).values({
      email: email.toLowerCase(),
      confirmationToken,
      status: "pending",
    });

    try {
      await sendConfirmationEmail(email.toLowerCase(), confirmationToken);
    } catch (emailError) {
      console.error("Failed to send confirmation email:", emailError);
      // Subscriber is saved; they can re-request confirmation later
    }

    return apiSuccess({ status: "pending_confirmation" }, undefined, 201);
  } catch (error) {
    console.error("POST /api/v1/subscribers error:", error);
    return apiError("INTERNAL_ERROR", "An unexpected error occurred", 500);
  }
}
