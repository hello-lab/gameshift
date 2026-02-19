// === GAME TYPES ===

export type GamePhase = 'LOBBY' | 'WORD_ACTIVE' | 'WORD_RESOLUTION' | 'TRANSITION' | 'FINAL_SCORING' | 'END';

export type TileState = 'correct' | 'present' | 'absent' | 'empty' | 'tbd';

export type GlitchType =
  | 'COLOR_SWAP'       // Swaps green↔yellow randomly
  | 'DELAYED_FEEDBACK' // Shows feedback after a delay
  | 'FAKE_LETTER'      // Adds a fake correct letter
  | 'LETTER_MUTATION'  // Changes a letter in feedback
  | 'LENGTH_SHIFT'     // Shows wrong word length (display only)
  | 'PHANTOM_GREEN'    // Shows a random green that isn't real
  | 'REVERSE_COLORS'   // All colors reversed
  | 'INVISIBLE_TILE';  // One tile shows as blank

export type GlitchTier = 'minor' | 'medium' | 'chaos' | 'psychological';

export interface Glitch {
  type: GlitchType;
  tier: GlitchTier;
  name: string;
  description: string;
}

export interface TileFeedback {
  letter: string;
  state: TileState;
  glitched?: boolean; // Was this tile modified by a glitch?
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
  timeLimit: number; // seconds
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

// Scoring constants
export const SCORING = {
  GUESS_1: 10,
  GUESS_2: 8,
  GUESS_3: 6,
  GUESS_4: 4,
  GUESS_5_PLUS: 2,
  UNSOLVED: 0,
  ALL_SOLVED_BONUS: 15,
  FINAL_WORD_BASE: 20,
} as const;
