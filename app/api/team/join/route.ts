import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, ensureTeamIndexes } from "@/lib/mongodb";
import { sessionCookieOptions, verifySession } from "@/lib/auth";

type JoinTeamBody = {
  inviteCode?: string;
};

function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get(sessionCookieOptions.name)?.value;
  const session = verifySession(token);

  if (!session || !ObjectId.isValid(session.sub)) {
    return null;
  }

  return new ObjectId(session.sub);
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: JoinTeamBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const inviteCode = body.inviteCode?.trim().toUpperCase() || "";

  if (inviteCode.length < 4) {
    return NextResponse.json({ error: "Invite code is required" }, { status: 400 });
  }

  const db = await getDb();
  await ensureTeamIndexes(db);

  const users = db.collection("users");
  const teams = db.collection("teams");

  const user = await users.findOne({ _id: userId });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (user.teamId) {
    return NextResponse.json({ error: "Already in a team" }, { status: 409 });
  }

  const team = await teams.findOne({ inviteCode });

  if (!team) {
    return NextResponse.json({ error: "Invite code not found" }, { status: 404 });
  }

  const teamId = team._id instanceof ObjectId ? team._id : new ObjectId(team._id);

  const updateTeamResult = await teams.updateOne(
    {
      _id: teamId,
      memberIds: { $ne: userId },
      $expr: { $lt: [{ $size: "$memberIds" }, "$maxMembers"] },
    },
    { $addToSet: { memberIds: userId } }
  );

  if (updateTeamResult.modifiedCount === 0) {
    return NextResponse.json({ error: "Team is full or already joined" }, { status: 409 });
  }

  const updateUserResult = await users.updateOne(
    { _id: userId, teamId: { $exists: false } },
    { $set: { teamId, teamRole: "member" } }
  );

  if (updateUserResult.modifiedCount === 0) {
    await teams.updateOne({ _id: teamId }, { $pull: { memberIds: userId } as any });
    return NextResponse.json({ error: "Could not join team" }, { status: 409 });
  }

  return NextResponse.json({ ok: true });
}
