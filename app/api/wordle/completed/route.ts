import { cookies } from "next/headers";
import { verifySession, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieOptions.name)?.value;
    const session = verifySession(token);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ _id: new ObjectId(session.sub) });

    if (!user) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    const completedWords = user.completedWords || [];

    return Response.json({
      success: true,
      completedWords: completedWords,
    });
  } catch (error) {
    console.error("Error fetching completed words:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
