import { NextResponse } from "next/server";

export async function POST() {
  const response = NextResponse.json({ data: { success: true } });

  response.cookies.set("sq-admin-token", "", {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  });

  return response;
}
