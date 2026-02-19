import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, sessionCookieOptions } from "@/lib/auth";
import { getDb } from "@/lib/mongodb";
import GamePage from "./gamePage";
import Link from "next/link";

export default async function BattleshipPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(sessionCookieOptions.name)?.value;
  const session = verifySession(token);

  if (!session) {
    redirect("/login");
  }

  const db = await getDb();
  const settings = db.collection("settings");
  const gameSetting = await settings.findOne({ key: "currentGamePhase" });
  const currentPhase = gameSetting?.phase || "battleship";

  if (currentPhase !== "battleship") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4">block</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Battleship Disabled</h2>
          <p className="text-pixel-light mb-6">
            Battleship is not active right now. The current game is Wordle.
          </p>
          <Link
            href="/wordle"
            className="inline-block px-6 py-3 bg-accent-yellow border-2 border-black text-black font-pixel hover:bg-accent-green transition-colors shadow-[4px_4px_0_#000]"
          >
            Go to Wordle
          </Link>
        </div>
      </div>
    );
  }

  return <GamePage />;
}
