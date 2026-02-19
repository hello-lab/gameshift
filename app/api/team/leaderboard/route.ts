import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await getDb();
    const teams = db.collection("teams");
    const users = db.collection("users");

    // Get all teams
    const teamDocs = await teams
      .find({})
      .project({
        name: 1,
        leaderId: 1,
        memberIds: 1,
        createdAt: 1,
      })
      .toArray();

    // For each team, calculate aggregate score from all members
    const teamsWithScores = await Promise.all(
      teamDocs.map(async (team) => {
        const memberIds = (team.memberIds || []).map((id) =>
          id instanceof ObjectId ? id : new ObjectId(id)
        );

        // Get all members and sum their scores
        const members = await users
          .find({ _id: { $in: memberIds } })
          .project({ score: 1 })
          .toArray();

        const totalScore = members.reduce((sum, member) => sum + (member.score || 0), 0);

        return {
          ...team,
          totalScore,
        };
      })
    );

    // Sort by total score descending
    teamsWithScores.sort((a, b) => b.totalScore - a.totalScore);

    // Fetch leader names
    const leaderIds = teamsWithScores
      .map((t) => t.leaderId)
      .filter((id) => id);

    const leaders = await users
      .find({ _id: { $in: leaderIds } })
      .project({ username: 1 })
      .toArray();

    const leaderMap = new Map(leaders.map((u) => [u._id.toString(), u.username]));

    // Add rank and leader info
    const rankedLeaderboard = teamsWithScores.slice(0, 50).map((team, index) => ({
      rank: index + 1,
      id: team._id.toString(),
      name: team.name,
      score: team.totalScore,
      leaderId: team.leaderId?.toString(),
      leaderName: leaderMap.get(team.leaderId?.toString()) || "Unknown",
      memberCount: (team.memberIds || []).length,
      createdAt: team.createdAt,
    }));

    return NextResponse.json({
      leaderboard: rankedLeaderboard,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Error fetching team leaderboard:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
