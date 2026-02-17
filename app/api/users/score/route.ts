import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const { userId, scorePoints } = await request.json();

    if (!userId || typeof scorePoints !== "number") {
      return NextResponse.json(
        { error: "userId and scorePoints are required" },
        { status: 400 }
      );
    }

    const db = await getDb();
    const users = db.collection("users");

    const result = await users.findOneAndUpdate(
      { _id: new ObjectId(userId) },
      { $inc: { score: scorePoints } },
      { returnDocument: "after" }
    );

    if (!result) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      newScore: result.score || 0,
    });
  } catch (error) {
    console.error("Error updating user score:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
