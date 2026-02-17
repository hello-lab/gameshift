import { NextResponse } from "next/server";
import { sessionCookieOptions } from "@/lib/auth";

function formatCookieHeader(
  name: string,
  value: string,
  options: {
    httpOnly: boolean;
    sameSite: string;
    secure: boolean;
    path: string;
    maxAge: number;
  }
): string {
  const parts = [
    `${name}=${value}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    `SameSite=${options.sameSite}`,
  ];

  if (options.httpOnly) {
    parts.push("HttpOnly");
  }

  if (options.secure) {
    parts.push("Secure");
  }

  return parts.join("; ");
}

export async function POST() {
  const cookieHeader = formatCookieHeader(
    sessionCookieOptions.name,
    "",
    {
      httpOnly: sessionCookieOptions.httpOnly,
      sameSite: sessionCookieOptions.sameSite,
      secure: sessionCookieOptions.secure,
      path: sessionCookieOptions.path,
      maxAge: 0,
    }
  );

  return new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieHeader,
    },
  });
}
