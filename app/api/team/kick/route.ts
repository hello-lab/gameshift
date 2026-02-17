import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sessionCookieOptions, verifySession } from "@/lib/auth";

type KickBody = {
  memberId?: string;
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

  let body: KickBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.memberId || !ObjectId.isValid(body.memberId)) {
    return NextResponse.json({ error: "Valid memberId required" }, { status: 400 });
  }

  const targetId = new ObjectId(body.memberId);

  const db = await getDb();
  const users = db.collection("users");
  const teams = db.collection("teams");

  const user = await users.findOne({ _id: userId });

  if (!user || !user.teamId) {
    return NextResponse.json({ error: "Not in a team" }, { status: 400 });
  }

  const teamId = user.teamId instanceof ObjectId ? user.teamId : new ObjectId(user.teamId);
  const team = await teams.findOne({ _id: teamId });

  if (!team) {
    return NextResponse.json({ error: "Team not found" }, { status: 404 });
  }

  const leaderId = team.leaderId instanceof ObjectId ? team.leaderId : new ObjectId(team.leaderId);

  if (!leaderId.equals(userId)) {
    return NextResponse.json({ error: "Only the leader can kick players" }, { status: 403 });
  }

  if (leaderId.equals(targetId)) {
    return NextResponse.json({ error: "Leader cannot be kicked" }, { status: 400 });
  }

  await teams.updateOne({ _id: teamId }, { $pull: { memberIds: targetId } });
  await users.updateOne({ _id: targetId, teamId }, { $unset: { teamId: "", teamRole: "" } });

  return NextResponse.json({ ok: true });
}
