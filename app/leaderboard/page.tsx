"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type LeaderboardEntry = {
  rank: number;
  id: string;
  username: string;
  score: number;
  createdAt: string;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const response = await fetch("/api/leaderboard", { cache: "no-store" });
        if (!response.ok) {
          throw new Error("Failed to fetch leaderboard");
        }
        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError("Failed to load leaderboard. Please try again later.");
        console.error("Leaderboard fetch error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, []);

  return (
    <div className="relative min-h-screen px-6 py-16 text-white font-display bg-verse-bg">
      <div className="absolute top-16 left-10 pixel-cloud blur-[2px] animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-24 right-20 pixel-cloud scale-150 opacity-20 blur-[4px] animate-[float_8s_ease-in-out_infinite_reverse]"></div>

      <header className="relative z-10 flex items-center justify-between max-w-6xl mx-auto mb-12">
        <div>
          <p className="text-purple-200 text-xs tracking-[0.3em] uppercase font-pixel">Global Rankings</p>
          <h1 className="text-3xl md:text-4xl font-pixel text-white mt-2" style={{ textShadow: "4px 4px 0 #4c1d95" }}>
            LEADERBOARD
          </h1>
        </div>
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </Link>
      </header>

      <main className="relative z-10 max-w-6xl mx-auto">
        {loading ? (
          <div className="glass-card p-12 text-center">
            <div className="text-xl text-purple-200">Loading leaderboard...</div>
          </div>
        ) : error ? (
          <div className="glass-card p-12 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="arena-btn px-6 py-2 text-sm font-pixel"
            >
              Retry
            </button>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <div className="text-purple-200">No players yet. Be the first!</div>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="p-6 border-b border-purple-500/30">
              <div className="grid grid-cols-12 gap-4 text-xs uppercase tracking-[0.2em] text-purple-300 font-pixel">
                <div className="col-span-2">Rank</div>
                <div className="col-span-6">Player</div>
                <div className="col-span-4 text-right">Score</div>
              </div>
            </div>

            <div className="divide-y divide-purple-500/20">
              {leaderboard.map((entry, idx) => {
                const medalColor =
                  entry.rank === 1
                    ? "text-yellow-400"
                    : entry.rank === 2
                      ? "text-gray-300"
                      : entry.rank === 3
                        ? "text-orange-400"
                        : "text-purple-300";

                const bgColor =
                  entry.rank === 1
                    ? "bg-yellow-500/10 border-l-4 border-yellow-400"
                    : entry.rank === 2
                      ? "bg-gray-400/5 border-l-4 border-gray-300"
                      : entry.rank === 3
                        ? "bg-orange-500/5 border-l-4 border-orange-400"
                        : "";

                return (
                  <div
                    key={entry.id}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 items-center transition-colors hover:bg-purple-500/5 ${bgColor}`}
                  >
                    <div className={`col-span-2 font-pixel text-lg ${medalColor}`}>
                      #{entry.rank}
                      {entry.rank === 1 && " 🏆"}
                      {entry.rank === 2 && " 🥈"}
                      {entry.rank === 3 && " 🥉"}
                    </div>
                    <div className="col-span-6">
                      <p className="font-pixel text-white">{entry.username}</p>
                      <p className="text-xs text-purple-300/60">
                        Joined {new Date(entry.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="col-span-4 text-right">
                      <p className="font-pixel text-xl text-verse-accent">{entry.score}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
