import { getDb } from "@/lib/mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    const users = db.collection("users");

    // Ensure index exists for faster sorting
    await users.createIndex({ score: -1 });

    // Debug: Get total user count
    const totalUsers = await users.countDocuments({});
    console.log(`Total users in database: ${totalUsers}`);

    // Get top 50 users ranked by score (include all users)
    const leaderboard = await users
      .find({})
      .project({
        username: 1,
        score: 1,
        createdAt: 1,
      })
      .sort({ score: -1 })
      .limit(50)
      .toArray();

    console.log("Leaderboard query results:", {
      count: leaderboard.length,
      users: leaderboard.map(u => ({ 
        id: u._id.toString(), 
        username: u.username, 
        score: u.score,
        scoreType: typeof u.score
      }))
    });

    // Add rank and ensure score is never null
    const rankedLeaderboard = leaderboard.map((user, index) => ({
      rank: index + 1,
      id: user._id.toString(),
      username: user.username,
      score: typeof user.score === 'number' ? user.score : 0,
      createdAt: user.createdAt,
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
