"use client";

import { useEffect, useMemo, useState } from "react";
import { useHostGameEngine } from "@/lib/wordle/useGameEngine";
import { buildWordleTeams } from "@/lib/wordle/teamUtils";
import type { GamePhase, GlitchType, TeamState, TileFeedback, WordRound } from "@/lib/wordle/types";

const ALL_GLITCHES: GlitchType[] = [
  "COLOR_SWAP",
  "DELAYED_FEEDBACK",
  "FAKE_LETTER",
  "LETTER_MUTATION",
  "LENGTH_SHIFT",
  "PHANTOM_GREEN",
  "REVERSE_COLORS",
  "INVISIBLE_TILE",
];

const PHASE_LABELS: Record<GamePhase, string> = {
  LOBBY: "Lobby",
  WORD_ACTIVE: "Word Live",
  WORD_RESOLUTION: "Resolution",
  TRANSITION: "Leaderboard",
  FINAL_SCORING: "Final Scores",
  END: "Complete",
};

export default function WordleAdmin() {
  const [seedTeams, setSeedTeams] = useState<TeamState[]>([]);
  const [teamsError, setTeamsError] = useState("");

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        const response = await fetch("/api/team/leaderboard");
        if (!response.ok) {
          throw new Error("Failed to load teams");
        }
        const data = await response.json();
        const seeds = (data.leaderboard || []).map((team: { id: string; name: string; score?: number }) => ({
          id: team.id,
          name: team.name,
          score: team.score ?? 0,
        }));
        setSeedTeams(buildWordleTeams(seeds));
      } catch (error) {
        console.error("Failed to load Wordle teams:", error);
        setTeamsError("Unable to load teams. Using fallback teams.");
      }
    };

    fetchTeams();
  }, []);

  const {
    gameState,
    startGame,
    setActiveTeam,
    nextWord,
    continueFromLeaderboard,
    skipWord,
    lockInputs,
    endGame,
    setNextWord,
    setFirstWord,
    toggleGlitch,
    joinAllTeams,
  } = useHostGameEngine({ initialTeams: seedTeams.length > 0 ? seedTeams : undefined });

  const {
    phase,
    teams,
    activeTeamIndex,
    currentRound,
    timeRemaining,
    roundIndex,
    totalRounds,
    wordsCompleted,
  } = gameState;

  const [nextWordInput, setNextWordInput] = useState("");
  const [firstWordInput, setFirstWordInput] = useState("");

  const activeTeam = teams[activeTeamIndex];
  const allTeamsJoined = teams.length === 6 && teams.every((team) => team.isJoined);

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => b.score - a.score);
  }, [teams]);

  useEffect(() => {
    // Auto-start game when all teams are joined
    if (phase === "LOBBY" && allTeamsJoined) {
      const timer = setTimeout(() => {
        startGame();
      }, 500); // Small delay for UX
      return () => clearTimeout(timer);
    }
  }, [allTeamsJoined, phase, startGame]);

  return (
    <div className="space-y-6">
      {teamsError && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {teamsError}
        </div>
      )}
      <div className="flex flex-col gap-4 rounded-xl border border-verse-purple/40 bg-black/30 p-6 shadow-[6px_6px_0_#000]">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-pixel text-white">Wordle Host Control</h2>
            <p className="text-sm text-verse-light">Live session controls and team status</p>
          </div>
          <div className="flex flex-wrap gap-2 text-[10px] font-arcade uppercase tracking-widest text-verse-light">
            <StatusChip label="Phase" value={PHASE_LABELS[phase]} />
            <StatusChip label="Round" value={`${roundIndex + 1}/${totalRounds}`} />
            <StatusChip label="Teams" value={`${teams.filter((team) => team.isJoined).length}/${teams.length}`} />
            <StatusChip label="Timer" value={formatTime(timeRemaining)} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-verse-purple/40 bg-verse-dark/70 p-6 shadow-[6px_6px_0_#000]">
          {phase === "LOBBY" && <LobbyOverview teams={teams} />}
          {(phase === "TRANSITION" || phase === "FINAL_SCORING") && (
            <LeaderboardView
              teams={sortedTeams}
              title={phase === "FINAL_SCORING" ? "Final Results" : "Current Standings"}
              subtitle={
                phase === "FINAL_SCORING" ? "System breach resolved." : `After ${wordsCompleted} words`
              }
            />
          )}
          {phase === "WORD_RESOLUTION" && currentRound && (
            <ResolutionView round={currentRound} teams={teams} />
          )}
          {phase === "END" && <FinalView teams={sortedTeams} />}
          {phase === "WORD_ACTIVE" && currentRound && (
            <ActiveRoundView
              round={currentRound}
              activeTeam={activeTeam}
              wordsCompleted={wordsCompleted}
              totalRounds={totalRounds}
              timeRemaining={timeRemaining}
            />
          )}
        </div>

        <div className="rounded-xl border border-verse-purple/40 bg-black/30 p-6 shadow-[6px_6px_0_#000]">
          <h3 className="text-lg font-pixel text-white mb-4">Teams</h3>
          <div className="space-y-2">
            {teams.map((team, index) => (
              <button
                key={team.id}
                onClick={() => setActiveTeam(index)}
                className={`w-full flex items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  index === activeTeamIndex
                    ? "border-accent-yellow bg-verse-purple/40 text-white"
                    : "border-verse-purple/40 bg-black/30 text-verse-light hover:bg-verse-purple/20"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
                  <span className="font-arcade uppercase tracking-wide">{team.name}</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  {team.solved && <span className="text-accent-green">Solved</span>}
                  <span className="font-semibold text-white">{team.score}</span>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-verse-purple/40 bg-verse-dark/80 p-6 shadow-[6px_6px_0_#000]">
        <h3 className="text-lg font-pixel text-white mb-4">Session Controls</h3>
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              {phase === "LOBBY" && (
                <>
                  <ControlButton
                    label="Start Game"
                    onClick={startGame}
                  />
                  {!allTeamsJoined && (
                    <ControlButton
                      label="Join All Teams"
                      onClick={joinAllTeams}
                      variant="ghost"
                    />
                  )}
                </>
              )}
              {phase === "WORD_ACTIVE" && (
                <>
                  <ControlButton label="Skip Word" onClick={skipWord} variant="ghost" />
                  <ControlButton label="Lock Inputs" onClick={lockInputs} variant="ghost" />
                </>
              )}
              {phase === "WORD_RESOLUTION" && (
                <ControlButton label="Next Word" onClick={nextWord} />
              )}
              {phase === "TRANSITION" && (
                <ControlButton label="Continue" onClick={continueFromLeaderboard} />
              )}
              {phase === "FINAL_SCORING" && (
                <ControlButton label="End Game" onClick={endGame} />
              )}
              {phase === "END" && (
                <ControlButton label="End Session" onClick={endGame} variant="ghost" />
              )}
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-verse-purple/40 bg-black/30 p-3">
                <label className="text-xs font-arcade uppercase tracking-widest text-verse-light">Set first word</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={firstWordInput}
                    onChange={(event) => setFirstWordInput(event.target.value)}
                    placeholder="e.g. CRISP"
                    className="flex-1 rounded-md border border-verse-purple/40 bg-verse-dark/80 px-3 py-2 text-xs uppercase text-white focus:outline-none focus:border-accent-yellow"
                  />
                  <ControlButton
                    label="Set"
                    onClick={() => {
                      setFirstWord(firstWordInput);
                      setFirstWordInput("");
                    }}
                    variant="ghost"
                  />
                </div>
              </div>

              <div className="rounded-lg border border-verse-purple/40 bg-black/30 p-3">
                <label className="text-xs font-arcade uppercase tracking-widest text-verse-light">Set next word</label>
                <div className="mt-2 flex gap-2">
                  <input
                    value={nextWordInput}
                    onChange={(event) => setNextWordInput(event.target.value)}
                    placeholder="e.g. SPHINX"
                    className="flex-1 rounded-md border border-verse-purple/40 bg-verse-dark/80 px-3 py-2 text-xs uppercase text-white focus:outline-none focus:border-accent-yellow"
                  />
                  <ControlButton
                    label="Queue"
                    onClick={() => {
                      setNextWord(nextWordInput);
                      setNextWordInput("");
                    }}
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-verse-purple/40 bg-black/30 p-3">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-pixel text-white">Glitch Toggles</h4>
              <span className="text-[10px] text-verse-light">Active: {currentRound?.activeGlitches.length ?? 0}</span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-[10px] text-verse-light">
              {ALL_GLITCHES.map((glitch) => (
                <label key={glitch} className="flex items-center gap-2 rounded-md border border-verse-purple/40 bg-black/30 px-2 py-1">
                  <input
                    type="checkbox"
                    className="accent-yellow-400"
                    checked={currentRound?.activeGlitches.includes(glitch) ?? false}
                    onChange={() => toggleGlitch(glitch)}
                    disabled={phase !== "WORD_ACTIVE" && phase !== "WORD_RESOLUTION"}
                  />
                  <span className="uppercase">{glitch.replace(/_/g, " ")}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-verse-purple/40 bg-black/30 px-3 py-1 text-[10px] text-verse-light">
      <span className="text-white">{label}:</span> {value}
    </div>
  );
}

function ControlButton({
  label,
  onClick,
  disabled,
  variant = "primary",
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "ghost";
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md border px-4 py-2 text-xs font-arcade uppercase tracking-widest transition-colors ${
        disabled
          ? "cursor-not-allowed border-white/10 bg-white/5 text-white/40"
          : variant === "primary"
          ? "border-accent-yellow bg-accent-yellow text-black hover:bg-accent-green"
          : "border-verse-purple/50 bg-verse-purple/30 text-white hover:bg-verse-purple/50"
      }`}
    >
      {label}
    </button>
  );
}

function LobbyOverview({ teams }: { teams: TeamState[] }) {
  return (
    <div>
      <h3 className="text-xl font-pixel text-white">Awaiting Teams</h3>
      <p className="text-sm text-verse-light mb-6">Invite teams to join before starting the round.</p>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {teams.map((team) => (
          <div
            key={team.id}
            className={`rounded-lg border px-3 py-3 text-center text-xs uppercase tracking-widest ${
              team.isJoined
                ? "border-accent-green bg-accent-green/20 text-white"
                : "border-verse-purple/40 bg-black/30 text-verse-light"
            }`}
          >
            <div className="font-arcade">{team.name}</div>
            <div className="mt-2 text-[10px]">
              {team.isJoined ? "Ready" : "Waiting"}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function LeaderboardView({ teams, title, subtitle }: { teams: TeamState[]; title: string; subtitle?: string }) {
  return (
    <div>
      <h3 className="text-xl font-pixel text-white">{title}</h3>
      {subtitle && <p className="text-xs text-verse-light mb-4">{subtitle}</p>}
      <div className="space-y-2">
        {teams.map((team, index) => (
          <div
            key={team.id}
            className={`flex items-center justify-between rounded-lg border px-3 py-2 ${
              index === 0
                ? "border-accent-yellow bg-verse-purple/40 text-white"
                : "border-verse-purple/40 bg-black/30 text-verse-light"
            }`}
          >
            <div className="flex items-center gap-3">
              <span className="text-xs font-arcade">#{index + 1}</span>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
              <span className="text-xs font-arcade uppercase tracking-wide">{team.name}</span>
            </div>
            <span className="text-sm font-semibold text-white">{team.score}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ResolutionView({ round, teams }: { round: WordRound; teams: TeamState[] }) {
  const solvers = teams.filter((team) => team.solved);

  return (
    <div>
      <h3 className="text-xl font-pixel text-white">Word {round.wordIndex + 1} Resolved</h3>
      <p className="text-sm text-verse-light mb-4">Answer: <span className="text-accent-yellow">{round.word}</span></p>
      <div className="space-y-2">
        {solvers.length === 0 && <p className="text-sm text-verse-light">No team solved this word.</p>}
        {solvers.map((team) => (
          <div key={team.id} className="flex items-center justify-between rounded-lg border border-verse-purple/40 bg-black/30 px-3 py-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: team.color }} />
              <span className="text-xs font-arcade uppercase tracking-wide text-white">{team.name}</span>
            </div>
            <span className="text-xs text-accent-green">{team.solvedInGuesses} guesses</span>
          </div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2 text-[10px] text-verse-light">
        {round.activeGlitches.length === 0 && <span>No glitches active</span>}
        {round.activeGlitches.map((glitch) => (
          <span key={glitch} className="rounded-full border border-verse-purple/40 bg-black/30 px-2 py-1">
            {glitch.replace(/_/g, " ")}
          </span>
        ))}
      </div>
    </div>
  );
}

function FinalView({ teams }: { teams: TeamState[] }) {
  const winner = teams[0];
  return (
    <div className="text-center">
      <h3 className="text-2xl font-pixel text-white">Session Complete</h3>
      {winner && (
        <p className="mt-3 text-sm text-verse-light">
          Winner: <span className="text-accent-yellow">{winner.name}</span> with {winner.score} pts
        </p>
      )}
    </div>
  );
}

function ActiveRoundView({
  round,
  activeTeam,
  wordsCompleted,
  totalRounds,
  timeRemaining,
}: {
  round: WordRound;
  activeTeam: TeamState;
  wordsCompleted: number;
  totalRounds: number;
  timeRemaining: number;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs text-verse-light uppercase tracking-widest">Active Round</p>
          <h3 className="text-xl font-pixel text-white">Word {wordsCompleted + 1} / {totalRounds}</h3>
          <p className="text-xs text-verse-light">Length {round.length} · {round.maxGuesses} guesses</p>
        </div>
        <div className="rounded-lg border border-verse-purple/40 bg-black/30 px-4 py-3 text-center">
          <p className="text-[10px] text-verse-light uppercase">Time</p>
          <p className="text-lg font-arcade text-white">{formatTime(timeRemaining)}</p>
        </div>
      </div>

      <div className="rounded-lg border border-verse-purple/40 bg-black/30 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-3 w-3 rounded-full" style={{ backgroundColor: activeTeam.color }} />
            <span className="text-xs font-arcade uppercase tracking-widest text-white">{activeTeam.name}</span>
          </div>
          {activeTeam.solved && <span className="text-xs text-accent-green">Solved in {activeTeam.solvedInGuesses}</span>}
        </div>

        <div className="mt-4 flex justify-center">
          <GuessGrid
            guesses={activeTeam.currentGuesses}
            currentInput={activeTeam.currentInput}
            wordLength={round.length}
            maxGuesses={round.maxGuesses}
            solved={activeTeam.solved}
          />
        </div>
      </div>
    </div>
  );
}

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
    <div className="flex flex-col gap-2">
      {rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex gap-2">
          {row.map((tile, tileIndex) => (
            <Tile key={tileIndex} feedback={tile} />
          ))}
        </div>
      ))}
    </div>
  );
}

function Tile({ feedback }: { feedback: TileFeedback }) {
  const stateClasses: Record<string, string> = {
    correct: "bg-accent-green text-black border-black",
    present: "bg-accent-yellow text-black border-black",
    absent: "bg-verse-dark text-verse-light border-verse-purple/60",
    empty: "bg-black/30 text-verse-light border-verse-purple/40",
    tbd: "bg-black/40 text-verse-light border-verse-cyan/70",
  };

  return (
    <div
      className={`wordle-cell h-12 w-12 border-2 text-center text-sm font-arcade uppercase ${
        stateClasses[feedback.state]
      }`}
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
