import { SCORING, TeamState } from "./types";

export function calculateWordScore(solved: boolean, guessCount: number, baseScore: number): number {
  if (!solved) return SCORING.UNSOLVED;

  const ratio = baseScore / 100;
  if (guessCount === 1) return SCORING.GUESS_1 * ratio;
  if (guessCount === 2) return SCORING.GUESS_2 * ratio;
  if (guessCount === 3) return SCORING.GUESS_3 * ratio;
  if (guessCount === 4) return SCORING.GUESS_4 * ratio;
  return SCORING.GUESS_5_PLUS * ratio;
}

export function calculateAllSolvedBonus(teams: TeamState[], totalRounds: number): number {
  void teams;
  void totalRounds;
  return SCORING.ALL_SOLVED_BONUS;
}
