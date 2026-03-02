import { NextResponse } from "next/server";
import { listDomains } from "@/lib/engine";

/**
 * GET /api/engine/domains
 * List all active domains with entity counts.
 */
export async function GET() {
  try {
    const domains = await listDomains();
    return NextResponse.json({ success: true, data: domains });
  } catch (error) {
    console.error("Failed to list domains:", error);
    return NextResponse.json(
      { success: false, error: "INTERNAL_ERROR", message: "Failed to list domains" },
      { status: 500 }
    );
  }
}
