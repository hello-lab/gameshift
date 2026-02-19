import { GlitchTier, GlitchType, WordRound } from "./types";

const WORD_LIST: string[] = [
  "PLANE",
  "CRISP",
  "BRAVE",
  "SLATE",
  "DWARF",
  "GHOUL",
  "SPHINX",
  "QUARTZ",
  "VORTEX",
  "CRYPT",
  "STORM",
  "FROST",
  "SHADY",
  "GHOST",
  "SWORD",
  "TOWER",
  "DREAM",
  "SWIFT",
  "FLAME",
  "ORBIT",
];

const TIER_CONFIG: Record<
  number,
  { tier: GlitchTier; glitches: GlitchType[]; maxGuesses: number; baseScore: number }
> = {
  0: { tier: "minor", glitches: [], maxGuesses: 8, baseScore: 100 },
  1: { tier: "minor", glitches: ["COLOR_SWAP"], maxGuesses: 7, baseScore: 100 },
  2: { tier: "minor", glitches: ["DELAYED_FEEDBACK"], maxGuesses: 7, baseScore: 100 },
  3: { tier: "medium", glitches: ["FAKE_LETTER", "DELAYED_FEEDBACK"], maxGuesses: 6, baseScore: 100 },
  4: { tier: "medium", glitches: ["LETTER_MUTATION", "COLOR_SWAP"], maxGuesses: 5, baseScore: 100 },
  5: { tier: "medium", glitches: ["FAKE_LETTER", "PHANTOM_GREEN"], maxGuesses: 5, baseScore: 100 },
  6: { tier: "chaos", glitches: ["COLOR_SWAP", "LETTER_MUTATION", "INVISIBLE_TILE"], maxGuesses: 5, baseScore: 100 },
  7: { tier: "chaos", glitches: ["REVERSE_COLORS", "FAKE_LETTER", "DELAYED_FEEDBACK"], maxGuesses: 4, baseScore: 100 },
  8: { tier: "chaos", glitches: ["PHANTOM_GREEN", "LETTER_MUTATION", "COLOR_SWAP", "INVISIBLE_TILE"], maxGuesses: 4, baseScore: 100 },
  9: { tier: "psychological", glitches: ["COLOR_SWAP", "FAKE_LETTER", "LETTER_MUTATION", "PHANTOM_GREEN", "REVERSE_COLORS"], maxGuesses: 3, baseScore: 200 },
  10: { tier: "minor", glitches: ["COLOR_SWAP"], maxGuesses: 8, baseScore: 100 },
  11: { tier: "minor", glitches: ["PHANTOM_GREEN"], maxGuesses: 7, baseScore: 100 },
  12: { tier: "medium", glitches: ["LETTER_MUTATION", "FAKE_LETTER"], maxGuesses: 6, baseScore: 100 },
  13: { tier: "medium", glitches: ["DELAYED_FEEDBACK", "FAKE_LETTER"], maxGuesses: 5, baseScore: 100 },
  14: { tier: "medium", glitches: ["COLOR_SWAP", "INVISIBLE_TILE"], maxGuesses: 5, baseScore: 100 },
  15: { tier: "chaos", glitches: ["REVERSE_COLORS", "LETTER_MUTATION", "PHANTOM_GREEN"], maxGuesses: 5, baseScore: 100 },
  16: { tier: "chaos", glitches: ["COLOR_SWAP", "FAKE_LETTER", "INVISIBLE_TILE", "DELAYED_FEEDBACK"], maxGuesses: 4, baseScore: 100 },
  17: { tier: "chaos", glitches: ["PHANTOM_GREEN", "LETTER_MUTATION", "REVERSE_COLORS"], maxGuesses: 4, baseScore: 100 },
  18: { tier: "chaos", glitches: ["COLOR_SWAP", "LETTER_MUTATION", "FAKE_LETTER", "PHANTOM_GREEN", "INVISIBLE_TILE"], maxGuesses: 4, baseScore: 100 },
  19: { tier: "psychological", glitches: ["COLOR_SWAP", "FAKE_LETTER", "LETTER_MUTATION", "PHANTOM_GREEN", "REVERSE_COLORS", "INVISIBLE_TILE"], maxGuesses: 3, baseScore: 200 },
};

export function generateRounds(): WordRound[] {
  return WORD_LIST.map((word, i) => {
    const config = TIER_CONFIG[i];
    return {
      wordIndex: i,
      word,
      length: word.length,
      maxGuesses: config.maxGuesses,
      activeGlitches: config.glitches,
      tier: config.tier,
      timeLimit: 360,
      baseScore: config.baseScore,
    };
  });
}
