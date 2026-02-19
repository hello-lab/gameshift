"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { GameState, TeamState, GuessResult, GlitchType } from "./types";
import { generateRounds } from "./words";
import { generateTrueFeedback, applyGlitches } from "./glitchEngine";
import { calculateWordScore } from "./scoring";
import { gameComm, ClientAction } from "./gameCommunication";

const DEFAULT_TEAMS: TeamState[] = [
  {
    id: "1",
    name: "TEAM ALPHA",
    color: "hsl(150 80% 50%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
  {
    id: "2",
    name: "TEAM BETA",
    color: "hsl(185 70% 45%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
  {
    id: "3",
    name: "TEAM GAMMA",
    color: "hsl(45 90% 55%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
  {
    id: "4",
    name: "TEAM DELTA",
    color: "hsl(280 60% 55%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
  {
    id: "5",
    name: "TEAM EPSILON",
    color: "hsl(0 75% 55%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
  {
    id: "6",
    name: "TEAM ZETA",
    color: "hsl(30 85% 55%)",
    score: 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  },
];

const buildInitialState = (teams: TeamState[] = DEFAULT_TEAMS): GameState => ({
  phase: "LOBBY",
  currentRound: null,
  roundIndex: 0,
  totalRounds: 20,
  teams: teams.map((t) => ({ ...t, isJoined: true })),
  activeTeamIndex: 0,
  timeRemaining: 360,
  showLeaderboard: false,
  wordsCompleted: 0,
});

type UseGameEngineOptions = {
  initialTeams?: TeamState[];
  myTeamId?: string;
};

export function useClientGameEngine(options: UseGameEngineOptions = {}) {
  const { initialTeams, myTeamId } = options;
  const [gameState, setGameState] = useState<GameState>(() => buildInitialState(initialTeams));
  const hasSyncedTeams = useRef(false);
  const myTeamRef = useRef(initialTeams?.find((t) => t.id === myTeamId));

  useEffect(() => {
    const unsubscribe = gameComm.subscribe((msg) => {
      if (msg.type === "STATE_UPDATE") {
        setGameState((prev) => {
          // Merge state intelligently - preserve my team data
          const newState = msg.payload;
          if (myTeamRef.current) {
            const myTeamInNew = newState.teams.find((t) => t.id === myTeamRef.current!.id);
            // If my team is found in host state, use it; otherwise keep my cached version
            if (myTeamInNew) {
              return newState;
            }
          }
          return newState;
        });
      }
    });
    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!initialTeams || initialTeams.length === 0 || hasSyncedTeams.current) return;
    setGameState((prev) => ({
      ...prev,
      teams: initialTeams,
      activeTeamIndex: 0,
    }));
    hasSyncedTeams.current = true;
  }, [initialTeams]);

  const updateTeamInput = useCallback((teamId: string, input: string) => {
    gameComm.sendClientAction({ type: "UPDATE_INPUT", teamId, input });
  }, []);

  const submitGuess = useCallback((teamId: string) => {
    gameComm.sendClientAction({ type: "SUBMIT_GUESS", teamId });
  }, []);

  const joinTeam = useCallback((teamId: string) => {
    gameComm.sendClientAction({ type: "JOIN", teamId });
  }, []);

  return {
    gameState,
    updateTeamInput,
    submitGuess,
    joinTeam,
  };
}

export function useHostGameEngine(options: UseGameEngineOptions = {}) {
  const { initialTeams } = options;
  const rounds = useRef(generateRounds());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gameState, setGameState] = useState<GameState>(() => buildInitialState(initialTeams));
  const hasSyncedTeams = useRef(false);

  useEffect(() => {
    gameComm.sendStateUpdate(gameState);
  }, [gameState]);

  const stateRef = useRef(gameState);
  useEffect(() => {
    stateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    if (!initialTeams || initialTeams.length === 0 || hasSyncedTeams.current) return;
    setGameState((prev) => {
      if (prev.phase !== "LOBBY" || prev.currentRound) return prev;
      return {
        ...prev,
        teams: initialTeams.map((t) => ({ ...t, isJoined: true })),
        activeTeamIndex: 0,
      };
    });
    hasSyncedTeams.current = true;
  }, [initialTeams]);

  useEffect(() => {
    const unsubscribe = gameComm.subscribe((msg) => {
      if (msg.type === "CLIENT_ACTION") {
        handleClientAction(msg.action);
      }
    });
    return unsubscribe;
  }, []);

  const handleClientAction = useCallback((action: ClientAction) => {
    switch (action.type) {
      case "UPDATE_INPUT":
        _updateTeamInput(action.teamId, action.input);
        break;
      case "SUBMIT_GUESS":
        _submitGuess(action.teamId);
        break;
      case "JOIN":
        setGameState((prev) => ({
          ...prev,
          teams: prev.teams.map((team) => (team.id === action.teamId ? { ...team, isJoined: true } : team)),
        }));
        break;
    }
  }, []);

  // Timer disabled - no countdown
  // useEffect(() => {
  //   if (gameState.phase === "WORD_ACTIVE" && gameState.timeRemaining > 0) {
  //     timerRef.current = setInterval(() => {
  //       setGameState((prev) => {
  //         if (prev.timeRemaining <= 1) {
  //           return { ...prev, timeRemaining: 0, phase: "WORD_RESOLUTION" };
  //         }
  //         return { ...prev, timeRemaining: prev.timeRemaining - 1 };
  //       });
  //     }, 1000);
  //   }
  //   return () => {
  //     if (timerRef.current) clearInterval(timerRef.current);
  //   };
  // }, [gameState.phase, gameState.timeRemaining]);

  const _updateTeamInput = useCallback((teamId: string, input: string) => {
    setGameState((prev) => ({
      ...prev,
      teams: prev.teams.map((team) =>
        team.id === teamId ? { ...team, currentInput: input.toUpperCase() } : team
      ),
    }));
  }, []);

  const _submitGuess = useCallback((teamId: string) => {
    setGameState((prev) => {
      const round = prev.currentRound;
      if (!round) return prev;

      const team = prev.teams.find((t) => t.id === teamId);
      if (!team || team.solved || team.currentGuesses.length >= round.maxGuesses) return prev;

      const guess = team.currentInput.toUpperCase();
      if (guess.length !== round.length) return prev;

      const trueFeedback = generateTrueFeedback(guess, round.word);
      const displayFeedback = applyGlitches(trueFeedback, round.activeGlitches);
      const solved = trueFeedback.every((tile) => tile.state === "correct");

      const result: GuessResult = {
        guess,
        trueFeedback,
        displayFeedback,
        activeGlitches: round.activeGlitches,
      };

      const updatedTeams = prev.teams.map((t) => {
        if (t.id !== teamId) return t;
        const newGuesses = [...t.currentGuesses, result];
        const wordScore = solved ? calculateWordScore(true, newGuesses.length, round.baseScore) : 0;
        return {
          ...t,
          currentGuesses: newGuesses,
          currentInput: "",
          solved,
          solvedInGuesses: solved ? newGuesses.length : undefined,
          score: t.score + wordScore,
        };
      });

      const allDone = updatedTeams.every(
        (t) => t.solved || t.currentGuesses.length >= round.maxGuesses
      );

      // Auto-advance to next word when all teams are done
      if (allDone) {
        const nextIndex = prev.roundIndex + 1;
        if (nextIndex >= rounds.current.length) {
          return {
            ...prev,
            teams: updatedTeams,
            phase: "FINAL_SCORING",
            showLeaderboard: true,
          };
        }

        const nextRound = rounds.current[nextIndex];
        return {
          ...prev,
          teams: updatedTeams.map((team) => ({
            ...team,
            currentGuesses: [],
            solved: false,
            solvedInGuesses: undefined,
            currentInput: "",
          })),
          phase: "WORD_ACTIVE",
          currentRound: nextRound,
          roundIndex: nextIndex,
          timeRemaining: 99999,
          showLeaderboard: false,
          wordsCompleted: nextIndex,
        };
      }

      return {
        ...prev,
        teams: updatedTeams,
        phase: prev.phase,
      };
    });
  }, []);

  const startGame = useCallback(() => {
    const round = rounds.current[0];
    setGameState((prev) => ({
      ...prev,
      phase: "WORD_ACTIVE",
      currentRound: round,
      roundIndex: 0,
      timeRemaining: round.timeLimit,
      teams: prev.teams.map((team) => ({
        ...team,
        currentGuesses: [],
        solved: false,
        currentInput: "",
      })),
    }));
  }, []);

  const setActiveTeam = useCallback((index: number) => {
    setGameState((prev) => ({ ...prev, activeTeamIndex: index }));
  }, []);

  const nextWord = useCallback(() => {
    setGameState((prev) => {
      const nextIndex = prev.roundIndex + 1;
      if (nextIndex >= rounds.current.length) {
        return { ...prev, phase: "FINAL_SCORING", showLeaderboard: true };
      }

      // Skip TRANSITION phase - go straight to next word
      const round = rounds.current[nextIndex];
      return {
        ...prev,
        phase: "WORD_ACTIVE",
        currentRound: round,
        roundIndex: nextIndex,
        timeRemaining: 99999,
        showLeaderboard: false,
        wordsCompleted: nextIndex,
        teams: prev.teams.map((team) => ({
          ...team,
          currentGuesses: [],
          solved: false,
          solvedInGuesses: undefined,
          currentInput: "",
        })),
      };
    });
  }, []);

  const continueFromLeaderboard = useCallback(() => {
    setGameState((prev) => {
      const actualNext = prev.phase === "TRANSITION" ? prev.roundIndex + 1 : prev.roundIndex + 1;

      if (actualNext >= rounds.current.length) {
        return { ...prev, phase: "FINAL_SCORING" };
      }

      const round = rounds.current[actualNext];
      return {
        ...prev,
        phase: "WORD_ACTIVE",
        currentRound: round,
        roundIndex: actualNext,
        timeRemaining: 99999,
        showLeaderboard: false,
        teams: prev.teams.map((team) => ({
          ...team,
          currentGuesses: [],
          solved: false,
          solvedInGuesses: undefined,
          currentInput: "",
        })),
      };
    });
  }, []);

  const skipWord = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: "WORD_RESOLUTION" }));
  }, []);

  const lockInputs = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: "WORD_RESOLUTION" }));
  }, []);

  const endGame = useCallback(() => {
    setGameState((prev) => ({ ...prev, phase: "END" }));
  }, []);

  const setNextWord = useCallback(
    (newWord: string) => {
      const text = newWord.toUpperCase().trim();
      if (!text) return;

      const nextIndex = gameState.roundIndex + 1;
      if (rounds.current[nextIndex]) {
        rounds.current[nextIndex] = {
          ...rounds.current[nextIndex],
          word: text,
          length: text.length,
        };
      }
    },
    [gameState.roundIndex]
  );

  const setFirstWord = useCallback((word: string) => {
    const text = word.toUpperCase().trim();
    if (!text) return;
    if (rounds.current[0]) {
      rounds.current[0] = {
        ...rounds.current[0],
        word: text,
        length: text.length,
      };
    }
  }, []);

  const toggleGlitch = useCallback((glitch: GlitchType) => {
    setGameState((prev) => {
      if (!prev.currentRound) return prev;

      const currentGlitches = prev.currentRound.activeGlitches;
      const isActive = currentGlitches.includes(glitch);
      const newGlitches = isActive
        ? currentGlitches.filter((g) => g !== glitch)
        : [...currentGlitches, glitch];

      const updatedRound = { ...prev.currentRound, activeGlitches: newGlitches };

      return {
        ...prev,
        currentRound: updatedRound,
      };
    });
  }, []);

  const joinAllTeams = useCallback(() => {
    setGameState((prev) => ({
      ...prev,
      teams: prev.teams.map((team) => ({ ...team, isJoined: true })),
    }));
  }, []);

  return {
    gameState,
    startGame,
    setActiveTeam,
    updateTeamInput: _updateTeamInput,
    submitGuess: _submitGuess,
    nextWord,
    continueFromLeaderboard,
    skipWord,
    lockInputs,
    endGame,
    setNextWord,
    setFirstWord,
    toggleGlitch,
    joinAllTeams,
  };
}
