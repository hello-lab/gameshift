import WordleGameSimple from "@/components/WordleGameSimple";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import { ObjectId } from "mongodb";
import Link from "next/link";

export default async function WordlePage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieOptions.name)?.value;
  const session = verifySession(token);

  if (!session) {
    redirect("/login");
  }

  const db = await getDb();
  const users = db.collection("users");
  const user = await users.findOne({ _id: new ObjectId(session.sub) });

  if (!user || !user.teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4">groups</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Team Required</h2>
          <p className="text-pixel-light mb-6">You must join a team before playing Wordle.</p>
          <Link 
            href="/team" 
            className="inline-block px-6 py-3 bg-accent-yellow border-2 border-black text-black font-pixel hover:bg-accent-green transition-colors shadow-[4px_4px_0_#000]"
          >
            Join a Team
          </Link>
        </div>
      </div>
    );
  }

  // Check if user is team leader
  const teams = db.collection("teams");
  const team = await teams.findOne({ _id: new ObjectId(user.teamId) });

  if (!team) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4">error</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Team Error</h2>
          <p className="text-pixel-light mb-6">Could not find your team.</p>
        </div>
      </div>
    );
  }

  const isLeader = team.leaderId?.toString() === user._id.toString();

  if (!isLeader) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4">stars</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Leaders Only</h2>
          <p className="text-pixel-light mb-6">Only your team leader can play Wordle and earn points.</p>
          <p className="text-sm text-verse-light">Current Leader: <strong>{team.leaderName || "Unknown"}</strong></p>
          <Link 
            href="/team" 
            className="inline-block px-6 py-3 bg-accent-yellow border-2 border-black text-black font-pixel hover:bg-accent-green transition-colors shadow-[4px_4px_0_#000] mt-4"
          >
            Back to Teams
          </Link>
        </div>
      </div>
    );
  }

  return <WordleGameSimple teamId={team._id.toString()} teamName={team.name} />;
}
