import { getDb } from "@/lib/mongodb";
import { verifySession, sessionCookieOptions } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";

export async function GET(request: NextRequest) {
  const cookieStore = request.cookies;
  const token = cookieStore.get(sessionCookieOptions.name)?.value;

  const session = verifySession(token);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const db = await getDb();
    const users = db.collection("users");

    const user = await users.findOne({ _id: new ObjectId(session.sub) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        sub: session.sub,
        email: user.email,
        username: user.username,
      },
      stats: {
        email: user.email,
        username: user.username,
        score: user.score || 0,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error fetching user:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
