import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { showcaseProjects } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://stackquadrant.com";

  if (!token) {
    return NextResponse.redirect(`${appUrl}/showcase/verify?status=error&message=Missing+token`);
  }

  try {
    const [project] = await db.select().from(showcaseProjects)
      .where(eq(showcaseProjects.verificationToken, token));

    if (!project) {
      return NextResponse.redirect(`${appUrl}/showcase/verify?status=error&message=Invalid+or+expired+token`);
    }

    if (project.verifiedAt) {
      return NextResponse.redirect(`${appUrl}/showcase/verify?status=already&message=Already+verified`);
    }

    await db.update(showcaseProjects).set({
      verifiedAt: new Date(),
      status: "pending_review",
      verificationToken: null,
      updatedAt: new Date(),
    }).where(eq(showcaseProjects.id, project.id));

    return NextResponse.redirect(`${appUrl}/showcase/verify?status=success&message=Verified+successfully`);
  } catch (error) {
    console.error("GET /api/v1/showcase/verify error:", error);
    return NextResponse.redirect(`${appUrl}/showcase/verify?status=error&message=Something+went+wrong`);
  }
}
