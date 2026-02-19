import { cookies } from "next/headers";
import { verifySession, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(sessionCookieOptions.name)?.value;
    const session = verifySession(token);

    if (!session) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { points, word } = await request.json();

    if (typeof points !== "number" || points < 0) {
      return Response.json({ error: "Invalid points" }, { status: 400 });
    }

    if (!word || typeof word !== "string") {
      return Response.json({ error: "Invalid word" }, { status: 400 });
    }

    const db = await getDb();
    const users = db.collection("users");
    const user = await users.findOne({ _id: new ObjectId(session.sub) });

    if (!user || !user.teamId) {
      return Response.json({ error: "User not in a team" }, { status: 400 });
    }

    // Update user's personal score (leader) and track completed word
    const result = await users.updateOne(
      { _id: new ObjectId(session.sub) },
      { 
        $inc: { score: points },
        $addToSet: { completedWords: word.toUpperCase() }
      }
    );

    if (!result.modifiedCount) {
      return Response.json({ error: "User not found" }, { status: 404 });
    }

    // Get updated user score
    const updatedUser = await users.findOne({ _id: new ObjectId(session.sub) });

    return Response.json({
      success: true,
      userScore: updatedUser?.score || 0,
      pointsAdded: points,
    });
  } catch (error) {
    console.error("Error saving Wordle score:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
