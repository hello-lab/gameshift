import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sessionCookieOptions, verifySession } from "@/lib/auth";

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
    await users.updateOne({ _id: userId }, { $unset: { teamId: "", teamRole: "" } });
    return NextResponse.json({ ok: true });
  }

  const leaderId = team.leaderId instanceof ObjectId ? team.leaderId : new ObjectId(team.leaderId);

  if (leaderId.equals(userId)) {
    return NextResponse.json({ error: "Leader must disband the team" }, { status: 400 });
  }

  await teams.updateOne({ _id: teamId }, { $pull: { memberIds: userId } });
  await users.updateOne({ _id: userId }, { $unset: { teamId: "", teamRole: "" } });

  return NextResponse.json({ ok: true });
}
