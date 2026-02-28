import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { subscribers } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length < 10) {
    return NextResponse.redirect(new URL("/?confirmed=invalid", request.url));
  }

  const [subscriber] = await db
    .select()
    .from(subscribers)
    .where(eq(subscribers.confirmationToken, token));

  if (!subscriber) {
    return NextResponse.redirect(new URL("/?confirmed=invalid", request.url));
  }

  if (subscriber.status === "confirmed") {
    return NextResponse.redirect(new URL("/?confirmed=already", request.url));
  }

  // Check if token is older than 48 hours
  const tokenAge = Date.now() - new Date(subscriber.createdAt).getTime();
  if (tokenAge > 48 * 60 * 60 * 1000) {
    return NextResponse.redirect(new URL("/?confirmed=expired", request.url));
  }

  await db
    .update(subscribers)
    .set({
      status: "confirmed",
      confirmedAt: new Date(),
      confirmationToken: null,
    })
    .where(eq(subscribers.id, subscriber.id));

  return NextResponse.redirect(new URL("/?confirmed=success", request.url));
}
