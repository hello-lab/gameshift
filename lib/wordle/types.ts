// === WORDLE GAME TYPES ===

export type GamePhase = "LOBBY" | "WORD_ACTIVE" | "WORD_RESOLUTION" | "TRANSITION" | "FINAL_SCORING" | "END";

export type TileState = "correct" | "present" | "absent" | "empty" | "tbd";

export type GlitchType =
  | "COLOR_SWAP"
  | "DELAYED_FEEDBACK"
  | "FAKE_LETTER"
  | "LETTER_MUTATION"
  | "LENGTH_SHIFT"
  | "PHANTOM_GREEN"
  | "REVERSE_COLORS"
  | "INVISIBLE_TILE";

export type GlitchTier = "minor" | "medium" | "chaos" | "psychological";

export interface Glitch {
  type: GlitchType;
  tier: GlitchTier;
  name: string;
  description: string;
}

export interface TileFeedback {
  letter: string;
  state: TileState;
  glitched?: boolean;
}

export interface GuessResult {
  guess: string;
  trueFeedback: TileFeedback[];
  displayFeedback: TileFeedback[];
  activeGlitches: GlitchType[];
}

export interface TeamState {
  id: string;
  name: string;
  color: string;
  score: number;
  currentGuesses: GuessResult[];
  solved: boolean;
  solvedInGuesses?: number;
  currentInput: string;
  isJoined: boolean;
}

export interface WordRound {
  wordIndex: number;
  word: string;
  length: number;
  maxGuesses: number;
  activeGlitches: GlitchType[];
  tier: GlitchTier;
  timeLimit: number;
  baseScore: number;
}

export interface GameState {
  phase: GamePhase;
  currentRound: WordRound | null;
  roundIndex: number;
  totalRounds: number;
  teams: TeamState[];
  activeTeamIndex: number;
  timeRemaining: number;
  showLeaderboard: boolean;
  wordsCompleted: number;
}

export const SCORING = {
  GUESS_1: 100,
  GUESS_2: 80,
  GUESS_3: 60,
  GUESS_4: 40,
  GUESS_5_PLUS: 20,
  UNSOLVED: 0,
  ALL_SOLVED_BONUS: 150,
  FINAL_WORD_BASE: 200,
} as const;
