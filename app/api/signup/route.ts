import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb, ensureUserIndexes } from "@/lib/mongodb";

type SignupBody = {
  email?: string;
  username?: string;
  password?: string;
};

export async function POST(request: Request) {
  let body: SignupBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = body.email?.trim().toLowerCase() || "";
  const username = body.username?.trim() || "";
  const password = body.password || "";

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  if (username.length < 3 || username.length > 24) {
    return NextResponse.json({ error: "Username must be 3-24 characters" }, { status: 400 });
  }

  if (password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  const db = await getDb();
  await ensureUserIndexes(db);
  const users = db.collection("users");

  const usernameLower = username.toLowerCase();

  const existing = await users.findOne({
    $or: [{ emailLower: email }, { usernameLower }],
  });

  if (existing) {
    return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 12);

  try {
    await users.insertOne({
      email,
      emailLower: email,
      username,
      usernameLower,
      passwordHash,
      createdAt: new Date(),
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === 11000) {
      return NextResponse.json({ error: "Email or username already in use" }, { status: 409 });
    }

    return NextResponse.json({ error: "Signup failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
