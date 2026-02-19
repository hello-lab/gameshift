import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, scorePoints } = await request.json();

    console.log("Score update request:", { userId, scorePoints });

    if (!userId || typeof scorePoints !== "number") {
      return NextResponse.json(
        { error: "userId and scorePoints are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");
    const teams = db.collection("teams");

    // Update user score
    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $inc: { score: scorePoints } },
      { returnDocument: "after" }
    );

    const user = result.value;

    if (!user) {
      console.error("User not found:", userId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log("User score updated:", { userId, oldScore: (user.score || 0) - scorePoints, newScore: user.score, pointsAdded: scorePoints });

    // Also update team score if user is in a team
    if (user.teamId) {
      const teamIdObj = user.teamId instanceof ObjectId ? user.teamId : new ObjectId(user.teamId);
      const teamResult = await teams.updateOne(
        { _id: teamIdObj },
        { $inc: { score: scorePoints } }
      );
      console.log("Team score updated:", { teamId: teamIdObj.toString(), matched: teamResult.matchedCount, modified: teamResult.modifiedCount });
      
      // Verify the team score was actually updated
      const updatedTeam = await teams.findOne({ _id: teamIdObj });
      console.log("Team verification after update:", { teamId: teamIdObj.toString(), teamScore: updatedTeam?.score, scoreType: typeof updatedTeam?.score });
    }

    return NextResponse.json({
      success: true,
      newScore: user.score || 0,
    });
  } catch (error) {
    console.error("Error updating user score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
