"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type TeamInfo = {
  id: string;
  name: string;
};

export default function WordleGame() {
  const [teamInfo, setTeamInfo] = useState<TeamInfo | null>(null);
  const [teamScore, setTeamScore] = useState(0);
  const [leaderboard, setLeaderboard] = useState<Array<{ name: string; score: number }>>([]);

  useEffect(() => {
    const fetchTeamInfo = async () => {
      try {
        const response = await fetch("/api/team/status", { cache: "no-store" });
        if (response.ok) {
          const data = await response.json();
          if (data.team) {
            setTeamInfo({ id: data.team.id, name: data.team.name });
            setTeamScore(data.teamScore || 0);
          }
        }
      } catch (error) {
        console.error("Failed to fetch team info:", error);
      }
    };

    fetchTeamInfo();
  }, []);

  if (!teamInfo) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars">
        <div className="text-center">
          <div className="text-2xl font-pixel text-accent-yellow mb-4">Loading...</div>
          <div className="text-sm text-pixel-light">Fetching team information</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-pixel-stars text-white overflow-hidden flex flex-col font-pixel min-h-screen">
      {/* Floating Icons */}
      <div className="fixed top-20 left-4 opacity-40 pointer-events-none animate-float z-0 hidden sm:block">
        <span className="material-symbols-outlined text-6xl text-pixel-light" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
      </div>
      <div className="fixed bottom-40 right-4 opacity-40 pointer-events-none animate-float z-0 hidden sm:block" style={{ animationDelay: "1.5s" }}>
        <span className="material-symbols-outlined text-6xl text-pixel-light" style={{ fontVariationSettings: "'FILL' 1" }}>toys</span>
      </div>

      {/* Header */}
      <div className="relative z-10 flex-none bg-pixel-dark/90 border-b-4 border-black pb-2">
        <div className="bg-primary text-white font-pixel text-center py-3 text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center gap-3 overflow-hidden">
          <span className="material-symbols-outlined text-sm animate-bounce">error</span>
          <span className="glitch-text">TEAM COMPETITION MODE</span>
          <span className="material-symbols-outlined text-sm animate-bounce">error</span>
        </div>
        <div className="flex items-center px-4 pt-4 justify-between">
          <Link href="/" className="text-white flex size-12 items-center justify-center bg-pixel-purple border-2 border-white/20 pixel-btn cursor-pointer active:bg-pixel-light" role="button">
            <span className="material-symbols-outlined">menu</span>
          </Link>
          <div className="flex flex-col items-center">
            <h1 className="text-white text-lg sm:text-2xl leading-none text-center drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
              GAME<span className="text-primary">VERSE</span>
            </h1>
            <span className="text-[8px] sm:text-[10px] text-pixel-light tracking-widest uppercase mt-2 bg-black/40 px-2 py-1 rounded">Wordle Battle</span>
          </div>
          <div className="flex items-center justify-end">
            <div className="flex items-center gap-2 bg-accent-yellow text-black border-2 border-black px-3 py-2 text-[8px] sm:text-[10px] uppercase tracking-wider pixel-btn">
              <span className="material-symbols-outlined text-sm">groups</span>
              <span>{teamInfo.name}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-6 relative w-full max-w-4xl mx-auto px-4 z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
          {/* Main Game Area */}
          <div className="lg:col-span-2">
            {/* Stats */}
            <div className="w-full flex gap-4 mb-6">
              <div className="flex flex-1 flex-col items-center justify-center bg-pixel-sky border-2 border-primary shadow-pixel-card p-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                <span className="text-[8px] text-pixel-light uppercase mb-1 font-sans font-bold tracking-wider">Team Score</span>
                <span className="text-2xl font-pixel text-white drop-shadow-md">{teamScore}</span>
              </div>
              <div className="flex flex-1 flex-col items-center justify-center bg-pixel-sky border-2 border-accent-yellow shadow-pixel-card p-3 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                <span className="text-[8px] text-pixel-light uppercase mb-1 font-sans font-bold tracking-wider">Time</span>
                <span className="text-2xl font-pixel text-accent-yellow font-terminal tracking-widest tabular-nums">00:00</span>
              </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-5 gap-2 w-full max-w-[340px] mx-auto p-4 bg-black/30 rounded-xl border-4 border-pixel-purple/50">
              {/* Demo rows - to be replaced with actual game logic */}
              {[...Array(30)].map((_, i) => (
                <div key={i} className="aspect-square pixel-cell bg-black/40 border-2 border-white/5 flex items-center justify-center text-white/30"></div>
              ))}
            </div>

            {/* Legend */}
            <div className="mt-6 flex items-center justify-center gap-6 py-2 px-4 bg-black/40 border-2 border-pixel-purple/30 rounded shadow-lg">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-yellow border border-white/50"></div>
                <span className="text-[8px] font-pixel text-white uppercase">Correct</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-accent-green border border-white/50"></div>
                <span className="text-[8px] font-pixel text-white uppercase">Wrong Pos</span>
              </div>
            </div>
          </div>

          {/* Team Leaderboard */}
          <div className="lg:col-span-1">
            <div className="bg-black/60 border-4 border-accent-yellow p-4 shadow-[8px_8px_0_#000]">
              <h3 className="text-accent-yellow font-pixel text-lg mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">leaderboard</span>
                TEAM RANKINGS
              </h3>
              <div className="space-y-2">
                <div className="bg-pixel-purple/50 border-2 border-accent-yellow p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl font-pixel text-accent-yellow">1</span>
                    <span className="font-pixel text-white">{teamInfo.name}</span>
                  </div>
                  <span className="font-pixel text-accent-yellow">{teamScore}</span>
                </div>
                {leaderboard.slice(0, 5).map((team, index) => (
                  <div key={index} className="bg-pixel-sky/30 border border-pixel-light/30 p-2 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg font-pixel text-pixel-light">{index + 2}</span>
                      <span className="font-pixel text-white text-sm">{team.name}</span>
                    </div>
                    <span className="font-pixel text-pixel-light text-sm">{team.score}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 p-3 bg-primary/20 border border-primary rounded">
                <p className="text-[10px] text-pixel-light">
                  <span className="material-symbols-outlined text-xs align-middle">info</span> Complete words to earn points for your team!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Keyboard */}
      <div className="flex-none w-full bg-pixel-dark border-t-4 border-black pb-safe pt-4 px-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2 mb-2">
          {/* Row 1 */}
          <div className="flex w-full gap-1 justify-center px-1">
            {['Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P'].map(key => (
              <button key={key} className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">{key}</button>
            ))}
          </div>

          {/* Row 2 */}
          <div className="flex w-full gap-1 justify-center px-3">
            {['A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L'].map(key => (
              <button key={key} className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">{key}</button>
            ))}
          </div>

          {/* Row 3 */}
          <div className="flex w-full gap-1 justify-center px-1">
            <button className="h-12 px-3 rounded bg-primary border-b-4 border-r-2 border-black/50 text-white font-pixel text-[8px] uppercase active:border-b-0 active:translate-y-1">ENTER</button>
            {['Z', 'X', 'C', 'V', 'B', 'N', 'M'].map(key => (
              <button key={key} className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">{key}</button>
            ))}
            <button className="h-12 px-3 rounded bg-pixel-sky border-b-4 border-r-2 border-black/50 text-white font-bold flex items-center justify-center active:border-b-0 active:translate-y-1">
              <span className="material-symbols-outlined text-lg">backspace</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
