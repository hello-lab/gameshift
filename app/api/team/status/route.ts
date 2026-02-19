import { NextResponse, type NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { sessionCookieOptions, verifySession } from "@/lib/auth";

type TeamMember = {
  id: string;
  username: string;
  role: "leader" | "member";
  score: number;
};

type TeamPayload = {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  members: TeamMember[];
};

function getSessionUserId(request: NextRequest) {
  const token = request.cookies.get(sessionCookieOptions.name)?.value;
  const session = verifySession(token);

  if (!session || !ObjectId.isValid(session.sub)) {
    return null;
  }

  return new ObjectId(session.sub);
}

export async function GET(request: NextRequest) {
  const userId = getSessionUserId(request);

  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = await getDb();
  const users = db.collection("users");
  const teams = db.collection("teams");

  const user = await users.findOne({ _id: userId });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (!user.teamId) {
    return NextResponse.json({ team: null });
  }

  const teamId = user.teamId instanceof ObjectId ? user.teamId : new ObjectId(user.teamId);
  const team = await teams.findOne({ _id: teamId });

  if (!team) {
    return NextResponse.json({ team: null });
  }

  const leaderId = team.leaderId instanceof ObjectId ? team.leaderId : new ObjectId(team.leaderId);
  const memberIds = Array.isArray(team.memberIds) ? team.memberIds : [];
  const normalizedMemberIds = memberIds.map((memberId) =>
    memberId instanceof ObjectId ? memberId : new ObjectId(memberId)
  );

  const members = await users
    .find({ _id: { $in: normalizedMemberIds } })
    .project({ username: 1, score: 1 })
    .toArray();

  const memberMap = new Map(
    members.map((member) => [member._id.toString(), { username: member.username, score: member.score || 0 }])
  );
  const memberPayload: TeamMember[] = normalizedMemberIds
    .map((memberId) => {
      const member = memberMap.get(memberId.toString());
      if (!member) {
        return null;
      }

      return {
        id: memberId.toString(),
        username: member.username,
        role: memberId.equals(leaderId) ? "leader" : "member",
        score: member.score,
      } satisfies TeamMember;
    })
    .filter((member): member is TeamMember => Boolean(member));

  const payload: TeamPayload = {
    id: team._id.toString(),
    name: team.name,
    inviteCode: team.inviteCode,
    maxMembers: team.maxMembers ?? 5,
    members: memberPayload,
  };

  return NextResponse.json({
    team: payload,
    viewer: {
      id: userId.toString(),
      role: leaderId.equals(userId) ? "leader" : "member",
    },
    teamScore: team.score || 0,
  });
}
