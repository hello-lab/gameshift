"use client";

import { useEffect, useState, useCallback } from "react";
import { useClientGameEngine } from "@/lib/wordle/useGameEngine";
import type { GamePhase, TileFeedback } from "@/lib/wordle/types";
import Link from "next/link";

export default function WordleGameClient({ teamId, teamName, teamColor }: { teamId: string; teamName: string; teamColor: string }) {
  const { gameState, updateTeamInput, submitGuess, joinTeam } = useClientGameEngine({
    initialTeams: [
      {
        id: teamId,
        name: teamName,
        color: teamColor,
        score: 0,
        currentGuesses: [],
        solved: false,
        currentInput: "",
        isJoined: true,
      },
    ],
    myTeamId: teamId,
  });
  const { phase, teams, currentRound, timeRemaining, wordsCompleted, totalRounds } = gameState;
  const [cachedRound, setCachedRound] = useState(currentRound);

  // Cache the last valid round
  useEffect(() => {
    if (currentRound) {
      setCachedRound(currentRound);
    }
  }, [currentRound]);

  // Use cached round if current is null (during transitions)
  const displayRound = currentRound || cachedRound;

  const myTeam = teams.find((t) => t.id === teamId);
  const [hasJoinedOnce, setHasJoinedOnce] = useState(false);

  // Join team on mount
  useEffect(() => {
    if (!hasJoinedOnce) {
      joinTeam(teamId);
      setHasJoinedOnce(true);
    }
  }, [teamId, hasJoinedOnce, joinTeam]);

  // Physical keyboard handler
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (phase !== "WORD_ACTIVE" || !currentRound || !myTeam || myTeam.solved) return;
      if (myTeam.currentGuesses.length >= currentRound.maxGuesses) return;

      if (e.key === "Enter") {
        submitGuess(teamId);
      } else if (e.key === "Backspace") {
        updateTeamInput(teamId, myTeam.currentInput.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && myTeam.currentInput.length < currentRound.length) {
        updateTeamInput(teamId, myTeam.currentInput + e.key.toUpperCase());
      }
    },
    [phase, currentRound, myTeam, teamId, submitGuess, updateTeamInput]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (!myTeam) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4 block">sync</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Connecting...</h2>
          <p className="text-pixel-light text-sm">Joining game session</p>
        </div>
      </div>
    );
  }

  // Skip LOBBY waiting and go straight to game (game auto-starts)

  // Final Results
  if (phase === "END" || (phase === "FINAL_SCORING" && !currentRound)) {
    const sorted = [...teams].sort((a, b) => b.score - a.score);
    const myRank = sorted.findIndex((t) => t.id === teamId) + 1;

    return (
      <div className="min-h-screen bg-pixel-stars flex items-center justify-center p-4 scanlines">
        <div className="text-center space-y-6">
          <h1 className="text-4xl font-pixel text-accent-yellow">GAME OVER</h1>
          <div className="space-y-2">
            <p className="text-pixel-light text-sm">YOUR SCORE</p>
            <p className="text-5xl font-pixel text-accent-yellow">{myTeam.score}</p>
            <p className="text-lg text-pixel-light">RANK #{myRank}</p>
          </div>
          <Link
            href="/team"
            className="inline-block px-6 py-3 bg-accent-yellow border-2 border-black text-black font-pixel hover:bg-accent-green transition-colors shadow-[4px_4px_0_#000]"
          >
            Back to Lobby
          </Link>
        </div>
      </div>
    );
  }

  // Check if we have round data
  if (!displayRound) {
    // Shouldn't happen in normal flow
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars p-4">
        <div className="max-w-md text-center bg-pixel-dark/90 border-4 border-accent-yellow p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-6xl text-accent-yellow mb-4 block">sync</span>
          <h2 className="text-2xl font-pixel text-accent-yellow mb-4">Loading...</h2>
          <p className="text-pixel-light text-sm">Starting game</p>
        </div>
      </div>
    );
  }

  const isInputDisabled = myTeam.solved || myTeam.currentGuesses.length >= displayRound.maxGuesses || phase !== "WORD_ACTIVE";

  return (
    <div className="min-h-screen bg-pixel-stars flex flex-col scanlines">
      {/* Header */}
      <div className="flex-none bg-pixel-dark/90 border-b-4 border-black pb-2">
        <div className="bg-primary text-white font-pixel text-center py-2 text-[10px] tracking-widest uppercase">
          <span className="glitch-text">GLITCH WORDLE</span>
        </div>
        <div className="flex items-center px-4 pt-3 justify-between">
          <Link href="/team" className="text-white flex size-10 items-center justify-center bg-pixel-purple border-2 border-white/20 pixel-btn cursor-pointer">
            <span className="material-symbols-outlined text-xl">menu</span>
          </Link>
          <div className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full" style={{ backgroundColor: teamColor }} />
              <span className="font-pixel text-white text-sm">{teamName}</span>
            </div>
            <p className="text-[10px] text-pixel-light tracking-widest uppercase mt-1">Team Mode</p>
          </div>
          <div className="text-right">
            <p className="text-[8px] text-pixel-light uppercase">Score</p>
            <p className="font-pixel text-accent-yellow text-lg">{myTeam.score}</p>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-start py-6 px-4 overflow-y-auto">
        {/* Word info */}
        <div className="flex flex-col items-center gap-2 mb-8">
          <span className="text-[10px] text-pixel-light uppercase tracking-widest">WORD {wordsCompleted + 1} / {totalRounds}</span>
          <div className="flex gap-1">
            {Array.from({ length: displayRound.length }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-pixel-light/40" />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="mb-6">
          <p className="text-[10px] text-pixel-light uppercase tracking-widest mb-1">Time</p>
          <div className={`font-arcade text-2xl tabular-nums tracking-widest ${
            timeRemaining < 15 ? "text-red-500 animate-pulse" : "text-accent-yellow"
          }`}>
            {formatTime(timeRemaining)}
          </div>
        </div>

        {/* Solved message */}
        {myTeam.solved && (
          <div className="mb-6 bg-accent-green/20 border-2 border-accent-green rounded-lg px-4 py-3 text-center">
            <p className="font-pixel text-accent-green">SOLVED IN {myTeam.solvedInGuesses} GUESSES</p>
            <p className="text-xs text-pixel-light mt-1">WAITING FOR OTHERS...</p>
          </div>
        )}

        {/* Guess Grid */}
        <div className="mb-8">
          <GuessGrid
            guesses={myTeam.currentGuesses}
            currentInput={myTeam.currentInput}
            wordLength={displayRound.length}
            maxGuesses={displayRound.maxGuesses}
            solved={myTeam.solved}
          />
        </div>

        {/* Legend */}
        {myTeam.currentGuesses.length > 0 && (
          <div className="mb-8 flex items-center justify-center gap-6 py-2 px-4 bg-black/40 border-2 border-pixel-purple/30 rounded">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent-yellow border border-white/50"></div>
              <span className="text-[8px] font-pixel text-white uppercase">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-accent-green border border-white/50"></div>
              <span className="text-[8px] font-pixel text-white uppercase">Wrong Pos</span>
            </div>
          </div>
        )}
      </div>

      {/* Keyboard */}
      <div className="flex-none w-full bg-pixel-dark border-t-4 border-black pb-safe pt-4 px-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        <div className="w-full max-w-lg mx-auto flex flex-col gap-2 mb-2">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex w-full gap-1 justify-center px-1">
              {row.map((key) => (
                <button
                  key={key}
                  onClick={() => {
                    if (key === "ENTER") {
                      submitGuess(teamId);
                    } else if (key === "⌫") {
                      updateTeamInput(teamId, myTeam.currentInput.slice(0, -1));
                    } else {
                      if (myTeam.currentInput.length < displayRound.length) {
                        updateTeamInput(teamId, myTeam.currentInput + key);
                      }
                    }
                  }}
                  disabled={isInputDisabled && key !== "ENTER"}
                  className={`h-12 rounded transition-all active:translate-y-1 ${
                    key === "ENTER" || key === "⌫"
                      ? "px-3 bg-primary border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] uppercase active:border-b-0 disabled:opacity-40"
                      : "flex-1 bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 disabled:opacity-40"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function GuessGrid({
  guesses,
  currentInput,
  wordLength,
  maxGuesses,
  solved,
}: {
  guesses: { displayFeedback: TileFeedback[] }[];
  currentInput: string;
  wordLength: number;
  maxGuesses: number;
  solved: boolean;
}) {
  const rows: TileFeedback[][] = [];

  for (const guess of guesses) {
    rows.push(guess.displayFeedback);
  }

  if (!solved && guesses.length < maxGuesses) {
    const inputTiles: TileFeedback[] = [];
    for (let i = 0; i < wordLength; i += 1) {
      inputTiles.push({
        letter: currentInput[i] ?? "",
        state: currentInput[i] ? "tbd" : "empty",
      });
    }
    rows.push(inputTiles);
  }

  while (rows.length < maxGuesses) {
    rows.push(
      Array.from({ length: wordLength }, () => ({
        letter: "",
        state: "empty" as const,
      }))
    );
  }

  return (
    <div className="flex flex-col gap-1.5 items-center">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((tile, ti) => (
            <Tile key={ti} feedback={tile} delay={ri === guesses.length - 1 ? ti : 0} isCurrentRow={ri === guesses.length} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Tile({ feedback, delay, isCurrentRow }: { feedback: TileFeedback; delay: number; isCurrentRow: boolean }) {
  const stateClasses: Record<string, string> = {
    correct: "bg-accent-green text-black border-accent-green",
    present: "bg-accent-yellow text-black border-accent-yellow",
    absent: "bg-pixel-dark/80 border-pixel-light/40 text-pixel-light/60",
    empty: "bg-pixel-dark/40 border-pixel-light/20 text-pixel-light/30",
    tbd: "bg-pixel-dark/60 border-pixel-light/40 text-pixel-light",
  };

  return (
    <div
      className={`wordle-cell w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-sm font-bold text-lg sm:text-xl uppercase transition-all ${
        stateClasses[feedback.state]
      } ${isCurrentRow && feedback.letter ? "animate-tile-pop" : ""} ${
        feedback.state !== "empty" && feedback.state !== "tbd" ? "animate-tile-reveal" : ""
      } ${feedback.glitched ? "animate-glitch-skew" : ""}`}
      style={{ animationDelay: `${delay * 100}ms` }}
    >
      {feedback.letter}
    </div>
  );
}

function formatTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}
