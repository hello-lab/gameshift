import type { TeamState } from "./types";

type TeamSeed = {
  id: string;
  name: string;
  score?: number;
};

const TEAM_COLORS = [
  "hsl(150 80% 50%)",
  "hsl(185 70% 45%)",
  "hsl(45 90% 55%)",
  "hsl(280 60% 55%)",
  "hsl(0 75% 55%)",
  "hsl(30 85% 55%)",
  "hsl(210 70% 55%)",
  "hsl(330 70% 60%)",
];

export function buildWordleTeams(seeds: TeamSeed[]): TeamState[] {
  return seeds.map((team, index) => ({
    id: team.id,
    name: team.name,
    color: TEAM_COLORS[index % TEAM_COLORS.length],
    score: team.score ?? 0,
    currentGuesses: [],
    solved: false,
    currentInput: "",
    isJoined: false,
  }));
}
