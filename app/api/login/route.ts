import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { signSession, sessionCookieOptions } from "@/lib/auth";

type LoginBody = {
  identifier?: string;
  password?: string;
};

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

export async function POST(request: Request) {
  let body: LoginBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const identifier = body.identifier?.trim() || "";
  const password = body.password || "";

  if (!identifier || !password) {
    return NextResponse.json({ error: "Identifier and password are required" }, { status: 400 });
  }

  const db = await getDb();
  const users = db.collection("users");

  const lookup = identifier.includes("@")
    ? { emailLower: identifier.toLowerCase() }
    : { usernameLower: identifier.toLowerCase() };

  const user = await users.findOne(lookup);

  if (!user || typeof user.passwordHash !== "string") {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);

  if (!isValid) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = signSession({
    sub: user._id.toString(),
    email: user.email,
    username: user.username,
  });

  const cookieHeader = formatCookieHeader(
    sessionCookieOptions.name,
    token,
    {
      httpOnly: sessionCookieOptions.httpOnly,
      sameSite: sessionCookieOptions.sameSite,
      secure: sessionCookieOptions.secure,
      path: sessionCookieOptions.path,
      maxAge: sessionCookieOptions.maxAge,
    }
  );

  const response = new NextResponse(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": cookieHeader,
    },
  });

  return response;
}
