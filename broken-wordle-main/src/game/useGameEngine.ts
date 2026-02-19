import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, TeamState, WordRound, GuessResult, GlitchType } from './types';
import { generateRounds } from './words';
import { generateTrueFeedback, applyGlitches } from './glitchEngine';
import { calculateWordScore } from './scoring';
import { gameComm, ClientAction } from './gameCommunication';

const DEFAULT_TEAMS: TeamState[] = [
  { id: '1', name: 'TEAM ALPHA', color: 'hsl(150 80% 50%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
  { id: '2', name: 'TEAM BETA', color: 'hsl(185 70% 45%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
  { id: '3', name: 'TEAM GAMMA', color: 'hsl(45 90% 55%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
  { id: '4', name: 'TEAM DELTA', color: 'hsl(280 60% 55%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
  { id: '5', name: 'TEAM EPSILON', color: 'hsl(0 75% 55%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
  { id: '6', name: 'TEAM ZETA', color: 'hsl(30 85% 55%)', score: 0, currentGuesses: [], solved: false, currentInput: '', isJoined: false },
];

const INITIAL_STATE: GameState = {
  phase: 'LOBBY',
  currentRound: null,
  roundIndex: 0,
  totalRounds: 10,
  teams: DEFAULT_TEAMS,
  activeTeamIndex: 0,
  timeRemaining: 360,
  showLeaderboard: false,
  wordsCompleted: 0,
};

// --- CLIENT HOOK ---
export function useClientGameEngine() {
  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  useEffect(() => {
    // Subscribe to state updates from the host
    const unsubscribe = gameComm.subscribe((msg) => {
      if (msg.type === 'STATE_UPDATE') {
        setGameState(msg.payload);
      }
    });
    return unsubscribe;
  }, []);

  const updateTeamInput = useCallback((teamId: string, input: string) => {
    // Optimistic update (optional, but skipping/relying on host for now to keep source of truth simple)
    // Actually, sending every keystroke might be heavy, but let's try it for responsiveness for other viewers
    gameComm.sendClientAction({ type: 'UPDATE_INPUT', teamId, input });
  }, []);

  const submitGuess = useCallback((teamId: string) => {
    gameComm.sendClientAction({ type: 'SUBMIT_GUESS', teamId });
  }, []);

  const joinTeam = useCallback((teamId: string) => {
    gameComm.sendClientAction({ type: 'JOIN', teamId });
  }, []);

  return {
    gameState,
    updateTeamInput,
    submitGuess,
    joinTeam
  };
}

// --- HOST HOOK ---
export function useHostGameEngine() {
  const rounds = useRef(generateRounds());
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [gameState, setGameState] = useState<GameState>(INITIAL_STATE);

  // Broadcast state whenever it changes
  useEffect(() => {
    gameComm.sendStateUpdate(gameState);
  }, [gameState]);

  // Listen for client actions
  useEffect(() => {
    const unsubscribe = gameComm.subscribe((msg) => {
      if (msg.type === 'CLIENT_ACTION') {
        handleClientAction(msg.action);
      }
    });
    return unsubscribe;
  }, [gameState]); // Dependency on gameState might be needed if handleClientAction closes over it
  // Actually, handleClientAction needs latest state.
  // Better approach: use functional state updates where possible, or ref if needed.
  // But since we have many handlers, let's keep it simple: 
  // We need to act on the LATEST state. 
  // The subscription effect needs to withstand re-renders or we use a ref for state access.

  // Ref for latest state to avoid effect re-subscription spam
  const stateRef = useRef(gameState);
  useEffect(() => { stateRef.current = gameState; }, [gameState]);

  const handleClientAction = useCallback((action: ClientAction) => {
    const currentState = stateRef.current;

    switch (action.type) {
      case 'UPDATE_INPUT':
        _updateTeamInput(action.teamId, action.input);
        break;
      case 'SUBMIT_GUESS':
        _submitGuess(action.teamId);
        break;
      case 'JOIN':
        setGameState(prev => ({
          ...prev,
          teams: prev.teams.map(t => t.id === action.teamId ? { ...t, isJoined: true } : t)
        }));
        break;
    }
  }, []);


  // Timer
  useEffect(() => {
    if (gameState.phase === 'WORD_ACTIVE' && gameState.timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setGameState(prev => {
          if (prev.timeRemaining <= 1) {
            return { ...prev, timeRemaining: 0, phase: 'WORD_RESOLUTION' };
          }
          return { ...prev, timeRemaining: prev.timeRemaining - 1 };
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameState.phase, gameState.timeRemaining]);

  const _updateTeamInput = useCallback((teamId: string, input: string) => {
    setGameState(prev => ({
      ...prev,
      teams: prev.teams.map(t =>
        t.id === teamId ? { ...t, currentInput: input.toUpperCase() } : t
      ),
    }));
  }, []);

  const _submitGuess = useCallback((teamId: string) => {
    setGameState(prev => {
      const round = prev.currentRound;
      if (!round) return prev;

      const team = prev.teams.find(t => t.id === teamId);
      if (!team || team.solved || team.currentGuesses.length >= round.maxGuesses) return prev;

      const guess = team.currentInput.toUpperCase();
      if (guess.length !== round.length) return prev;

      const trueFeedback = generateTrueFeedback(guess, round.word);
      const displayFeedback = applyGlitches(trueFeedback, round.activeGlitches);
      const solved = trueFeedback.every(t => t.state === 'correct');

      const result: GuessResult = {
        guess,
        trueFeedback,
        displayFeedback,
        activeGlitches: round.activeGlitches,
      };

      const updatedTeams = prev.teams.map(t => {
        if (t.id !== teamId) return t;
        const newGuesses = [...t.currentGuesses, result];
        const wordScore = solved ? calculateWordScore(true, newGuesses.length, round.baseScore) : 0;
        return {
          ...t,
          currentGuesses: newGuesses,
          currentInput: '',
          solved,
          solvedInGuesses: solved ? newGuesses.length : undefined,
          score: t.score + wordScore,
        };
      });

      // Check if all teams solved or maxed out
      const allDone = updatedTeams.every(
        t => t.solved || t.currentGuesses.length >= round.maxGuesses
      );

      return {
        ...prev,
        teams: updatedTeams,
        phase: allDone ? 'WORD_RESOLUTION' : prev.phase,
      };
    });
  }, []);

  // Public Host Actions
  const startGame = useCallback(() => {
    const round = rounds.current[0];
    setGameState(prev => ({
      ...prev,
      phase: 'WORD_ACTIVE',
      currentRound: round,
      roundIndex: 0,
      timeRemaining: round.timeLimit,
      teams: prev.teams.map(t => ({ ...t, currentGuesses: [], solved: false, currentInput: '' })),
    }));
  }, []);

  const setActiveTeam = useCallback((index: number) => {
    setGameState(prev => ({ ...prev, activeTeamIndex: index }));
  }, []);

  const nextWord = useCallback(() => {
    setGameState(prev => {
      const nextIndex = prev.roundIndex + 1;
      if (nextIndex >= rounds.current.length) {
        return { ...prev, phase: 'FINAL_SCORING', showLeaderboard: true };
      }

      // Show leaderboard every 2 words
      if ((nextIndex) % 2 === 0 && !prev.showLeaderboard) {
        return { ...prev, phase: 'TRANSITION', showLeaderboard: true, wordsCompleted: nextIndex };
      }

      const round = rounds.current[nextIndex];
      return {
        ...prev,
        phase: 'WORD_ACTIVE',
        currentRound: round,
        roundIndex: nextIndex,
        timeRemaining: round.timeLimit,
        showLeaderboard: false,
        wordsCompleted: nextIndex,
        teams: prev.teams.map(t => ({ ...t, currentGuesses: [], solved: false, solvedInGuesses: undefined, currentInput: '' })),
      };
    });
  }, []);

  const continueFromLeaderboard = useCallback(() => {
    setGameState(prev => {
      const nextIndex = prev.roundIndex + (prev.phase === 'TRANSITION' ? 0 : 1);
      const actualNext = prev.phase === 'TRANSITION' ? prev.roundIndex + 1 : nextIndex;

      if (actualNext >= rounds.current.length) {
        return { ...prev, phase: 'FINAL_SCORING' };
      }

      const round = rounds.current[actualNext];
      return {
        ...prev,
        phase: 'WORD_ACTIVE',
        currentRound: round,
        roundIndex: actualNext,
        timeRemaining: round.timeLimit,
        showLeaderboard: false,
        teams: prev.teams.map(t => ({ ...t, currentGuesses: [], solved: false, solvedInGuesses: undefined, currentInput: '' })),
      };
    });
  }, []);

  const skipWord = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'WORD_RESOLUTION' }));
  }, []);

  const lockInputs = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'WORD_RESOLUTION' }));
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => ({ ...prev, phase: 'END' }));
  }, []);

  // Custom Word injection
  const setNextWord = useCallback((newWord: string) => {
    // Modifies the NEXT round in the rounds ref
    const text = newWord.toUpperCase().trim();
    if (!text) return;

    const nextIndex = gameState.roundIndex + 1;
    // Note: this modifies the game plan on the fly.
    // We need to create a new round object.
    const currentTier = rounds.current[nextIndex]?.tier || 'minor'; // fallback
    // Simple way: just patch the word of the next round if it exists, or push a new one
    if (rounds.current[nextIndex]) {
      rounds.current[nextIndex] = {
        ...rounds.current[nextIndex],
        word: text,
        length: text.length
      };
    } else {
      // If we are at the end, maybe extend? 
      // For now let's assume valid next index.
    }
  }, [gameState.roundIndex]);

  const setFirstWord = useCallback((word: string) => {
    const text = word.toUpperCase().trim();
    if (!text) return;
    if (rounds.current[0]) {
      rounds.current[0] = {
        ...rounds.current[0],
        word: text,
        length: text.length
      };
    }
  }, []);

  const toggleGlitch = useCallback((glitch: GlitchType) => {
    setGameState(prev => {
      if (!prev.currentRound) return prev;

      const currentGlitches = prev.currentRound.activeGlitches;
      const isActive = currentGlitches.includes(glitch);

      const newGlitches = isActive
        ? currentGlitches.filter(g => g !== glitch)
        : [...currentGlitches, glitch];

      const updatedRound = { ...prev.currentRound, activeGlitches: newGlitches };

      return {
        ...prev,
        currentRound: updatedRound
      };
    });
  }, []);

  return {
    gameState,
    startGame,
    setActiveTeam,
    updateTeamInput: _updateTeamInput, // Expose for local testing/host overrides
    submitGuess: _submitGuess,         // Expose for local testing/host overrides
    nextWord,
    continueFromLeaderboard,
    skipWord,
    lockInputs,
    endGame,

    setNextWord,
    setFirstWord,
    toggleGlitch
  };
}
