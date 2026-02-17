import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb, ensureTeamIndexes } from "@/lib/mongodb";
import { sessionCookieOptions, verifySession } from "@/lib/auth";

type CreateTeamBody = {
  name?: string;
};

const MAX_MEMBERS = 5;

function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get(sessionCookieOptions.name)?.value;
  const session = verifySession(token);

  if (!session || !ObjectId.isValid(session.sub)) {
    return null;
  }

  return new ObjectId(session.sub);
}

function generateInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";

  for (let i = 0; i < 6; i += 1) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }

  return code;
}

export async function POST(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: CreateTeamBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const name = body.name?.trim() || "";

  if (name.length < 3 || name.length > 24) {
    return NextResponse.json({ error: "Team name must be 3-24 characters" }, { status: 400 });
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

  let inviteCode = "";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = generateInviteCode();
    const exists = await teams.findOne({ inviteCode: candidate });
    if (!exists) {
      inviteCode = candidate;
      break;
    }
  }

  if (!inviteCode) {
    return NextResponse.json({ error: "Failed to generate invite code" }, { status: 500 });
  }

  const insertResult = await teams.insertOne({
    name,
    inviteCode,
    leaderId: userId,
    memberIds: [userId],
    maxMembers: MAX_MEMBERS,
    createdAt: new Date(),
  });

  const updateResult = await users.updateOne(
    { _id: userId, teamId: { $exists: false } },
    { $set: { teamId: insertResult.insertedId, teamRole: "leader" } }
  );

  if (updateResult.modifiedCount === 0) {
    await teams.deleteOne({ _id: insertResult.insertedId });
    return NextResponse.json({ error: "Could not join team" }, { status: 409 });
  }

  return NextResponse.json({
    team: {
      id: insertResult.insertedId.toString(),
      name,
      inviteCode,
      maxMembers: MAX_MEMBERS,
      members: [
        {
          id: userId.toString(),
          username: user.username,
          role: "leader",
        },
      ],
    },
  });
}
