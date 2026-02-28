import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return NextResponse.json({ status: "healthy", database: "connected", timestamp: new Date().toISOString() });
  } catch {
    return NextResponse.json({ status: "unhealthy", database: "disconnected", timestamp: new Date().toISOString() }, { status: 503 });
  }
}
