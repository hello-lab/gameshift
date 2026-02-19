"use client";

import { useEffect, useState, useCallback } from "react";
import type { TileFeedback } from "@/lib/wordle/types";
import { generateRounds } from "@/lib/wordle/words";
import { generateTrueFeedback, applyGlitches } from "@/lib/wordle/glitchEngine";

interface GameRound {
  word: string;
  length: number;
  activeGlitches: string[];
  baseScore: number;
}

export default function WordleGameSimple({ teamId, teamName }: { teamId?: string; teamName?: string }) {
  const allRounds = useState(() => generateRounds())[0];
  const [availableRounds, setAvailableRounds] = useState<GameRound[]>([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [currentRound, setCurrentRound] = useState<GameRound | null>(null);
  const [guesses, setGuesses] = useState<{ displayFeedback: TileFeedback[] }[]>([]);
  const [currentInput, setCurrentInput] = useState("");
  const [solved, setSolved] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [lastPointsEarned, setLastPointsEarned] = useState(0);
  const [completedWords, setCompletedWords] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch completed words on mount
  useEffect(() => {
    fetch("/api/wordle/completed")
      .then((res) => res.json())
      .then((data) => {
        const completed = data.completedWords || [];
        setCompletedWords(completed);
        // Filter out completed words
        const available = allRounds.filter(
          (round: GameRound) => !completed.includes(round.word)
        );
        setAvailableRounds(available);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error fetching completed words:", err);
        setAvailableRounds(allRounds);
        setLoading(false);
      });
  }, [allRounds]);

  // Initialize first round
  useEffect(() => {
    if (roundIndex < availableRounds.length) {
      const round = availableRounds[roundIndex];
      setCurrentRound({
        word: round.word,
        length: round.length,
        activeGlitches: round.activeGlitches,
        baseScore: round.baseScore,
      });
      setGuesses([]);
      setCurrentInput("");
      setSolved(false);
    } else {
      setGameOver(true);
    }
  }, [roundIndex, availableRounds]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!currentRound || solved || gameOver) return;

      if (e.key === "Enter") {
        handleSubmitGuess();
      } else if (e.key === "Backspace") {
        setCurrentInput((prev) => prev.slice(0, -1));
      } else if (/^[a-zA-Z]$/.test(e.key) && currentInput.length < currentRound.length) {
        setCurrentInput((prev) => prev + e.key.toUpperCase());
      }
    },
    [currentRound, currentInput, solved, gameOver]
  );

  const handleSubmitGuess = useCallback(() => {
    if (!currentRound || currentInput.length !== currentRound.length) return;

    const guess = currentInput.toUpperCase();
    const trueFeedback = generateTrueFeedback(guess, currentRound.word);
    const displayFeedback = applyGlitches(trueFeedback, currentRound.activeGlitches as any);
    const isCorrect = trueFeedback.every((tile) => tile.state === "correct");

    const newGuess = { displayFeedback };
    const newGuesses = [...guesses, newGuess];
    const guessCount = newGuesses.length;

    // Calculate points per guess - decreasing points for more guesses
    const partialPoints = isCorrect ? Math.max(currentRound.baseScore - (guessCount - 1) * 15, 10) : 0;

    if (isCorrect) {
      // Solved! Add points and move to next word
      const newScore = score + partialPoints;
      setScore(newScore);
      setLastPointsEarned(partialPoints);
      setSolved(true);

      // Save score to team leader's account immediately
      if (teamId && partialPoints > 0) {
        fetch("/api/wordle/scores", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ points: partialPoints, word: currentRound.word }),
        })
          .then((res) => {
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            return res.json();
          })
          .then((data) => {
            console.log(`✓ Added ${partialPoints} points to leader. Leader total: ${data.userScore}`);
          })
          .catch((err) => console.error("❌ Error saving score:", err));
      }

      // Auto-advance to next word after 1 second
      setTimeout(() => {
        setRoundIndex((prev) => prev + 1);
      }, 1000);
    } else {
      setGuesses(newGuesses);
      setCurrentInput("");
      setLastPointsEarned(0);

      // Check if out of guesses
      if (newGuesses.length >= 6) {
        // Out of guesses, advance after 2 seconds
        setTimeout(() => {
          setRoundIndex((prev) => prev + 1);
        }, 2000);
      }
    }
  }, [currentRound, currentInput, score, guesses, teamId, availableRounds, roundIndex]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars">
        <p className="text-2xl font-pixel text-accent-yellow">LOADING...</p>
      </div>
    );
  }

  if (!currentRound || availableRounds.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-pixel-stars">
        <div className="text-center">
          <h1 className="text-6xl font-pixel text-accent-yellow mb-4">GLITCH WORDLE</h1>
          {teamName && <p className="text-lg text-verse-light mb-6">TEAM: {teamName}</p>}
          <p className="text-2xl font-pixel text-accent-green mb-2">FINAL SCORE</p>
          <p className="text-5xl font-pixel text-accent-yellow mb-4">{score} POINTS</p>
          {completedWords.length === allRounds.length ? (
            <p className="text-pixel-light">All {allRounds.length} words completed!</p>
          ) : (
            <p className="text-pixel-light">You've completed {completedWords.length} words.<br/>Come back tomorrow for more!</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-pixel-stars flex flex-col p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-pixel text-accent-yellow mb-2">GLITCH WORDLE</h1>
        {teamName && <p className="text-sm text-verse-light mb-4 uppercase">{teamName} - LEADER</p>}
        <div className="flex justify-center gap-8">
          <div>
            <p className="text-xs text-pixel-light">WORD</p>
            <p className="text-2xl font-pixel text-white">{roundIndex + 1}/{availableRounds.length}</p>
          </div>
          <div>
            <p className="text-xs text-pixel-light">LEADER SCORE</p>
            <p className="text-2xl font-pixel text-accent-yellow">{score}</p>
          </div>
          {lastPointsEarned > 0 && (
            <div>
              <p className="text-xs text-accent-green">+{lastPointsEarned}</p>
            </div>
          )}
        </div>
      </div>

      {/* Game Area */}
      <div className="flex-1 flex flex-col items-center justify-center gap-8">
        {/* Guess Grid */}
        <GuessGrid
          guesses={guesses}
          currentInput={currentInput}
          wordLength={currentRound.length}
          solved={solved}
        />

        {/* Keyboard */}
        <div className="w-full max-w-2xl">
          <Keyboard
            onKeyPress={(key) => {
              if (key === "ENTER") {
                handleSubmitGuess();
              } else if (key === "⌫") {
                setCurrentInput((prev) => prev.slice(0, -1));
              } else if (currentInput.length < currentRound.length) {
                setCurrentInput((prev) => prev + key);
              }
            }}
          />
        </div>

        {/* Status */}
        {solved && (
          <div>
            <p className="text-xl font-pixel text-accent-green">✓ CORRECT!</p>
            {lastPointsEarned > 0 && <p className="text-sm text-accent-yellow mt-2">+{lastPointsEarned} TEAM POINTS</p>}
          </div>
        )}
        {guesses.length >= 6 && !solved && <p className="text-xl font-pixel text-red-500">✗ OUT OF GUESSES</p>}
      </div>
    </div>
  );
}

function GuessGrid({
  guesses,
  currentInput,
  wordLength,
  solved,
}: {
  guesses: { displayFeedback: TileFeedback[] }[];
  currentInput: string;
  wordLength: number;
  solved: boolean;
}) {
  const rows: TileFeedback[][] = [];

  for (const guess of guesses) {
    rows.push(guess.displayFeedback);
  }

  // Add current input row if not empty
  if (currentInput.length > 0) {
    const currentRow = Array.from({ length: wordLength }).map((_, i) => ({
      letter: currentInput[i] || "",
      state: "tbd" as const,
      glitched: false,
    }));
    rows.push(currentRow);
  }

  // Pad to 6 rows
  while (rows.length < 6) {
    rows.push(Array.from({ length: wordLength }).map(() => ({ letter: "", state: "empty" as const, glitched: false })));
  }

  return (
    <div className="flex flex-col gap-1.5">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row.map((tile, ti) => (
            <Tile key={ti} feedback={tile} delay={ri === guesses.length ? ti : 0} isCurrentRow={ri === guesses.length} />
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
      className={`w-12 h-12 sm:w-14 sm:h-14 border-2 rounded-sm font-bold text-lg sm:text-xl uppercase transition-all ${
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

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

function Keyboard({ onKeyPress }: { onKeyPress: (key: string) => void }) {
  return (
    <div className="space-y-2">
      {KEYBOARD_ROWS.map((row, ri) => (
        <div key={ri} className="flex justify-center gap-1.5 flex-wrap">
          {row.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
              className={`font-pixel text-[10px] uppercase transition-all active:translate-y-1 ${
                key === "ENTER" || key === "⌫"
                  ? "px-3 h-12 bg-primary border-b-4 border-r-2 border-black/50 text-white active:border-b-0"
                  : "flex-1 min-w-8 h-12 bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white active:border-b-0"
              }`}
            >
              {key}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
