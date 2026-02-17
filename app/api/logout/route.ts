import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set({
    name: sessionCookieOptions.name,
    value: "",
    httpOnly: sessionCookieOptions.httpOnly,
    sameSite: sessionCookieOptions.sameSite,
    secure: sessionCookieOptions.secure,
    path: sessionCookieOptions.path,
    maxAge: 0,
  });
  return response;
}
