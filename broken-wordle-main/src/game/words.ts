import { GlitchTier, GlitchType, WordRound } from './types';

const WORD_LIST: string[] = [
  'PLANE',  // Word 1 - easy
  'CRISP',  // Word 2 - easy
  'BRAVE',  // Word 3 - easy
  'SLATE',  // Word 4 - medium
  'DWARF',  // Word 5 - medium
  'GHOUL',  // Word 6 - medium
  'SPHINX', // Word 7 - hard (6 letters)
  'QUARTZ', // Word 8 - hard (6 letters)
  'VORTEX', // Word 9 - hard (6 letters)
  'CRYPT',  // Word 10 - final (unknown length trap)
];

const TIER_CONFIG: Record<number, { tier: GlitchTier; glitches: GlitchType[]; maxGuesses: number; baseScore: number }> = {
  0: { tier: 'minor', glitches: [], maxGuesses: 8, baseScore: 10 },
  1: { tier: 'minor', glitches: ['COLOR_SWAP'], maxGuesses: 7, baseScore: 10 },
  2: { tier: 'minor', glitches: ['DELAYED_FEEDBACK'], maxGuesses: 7, baseScore: 10 },
  3: { tier: 'medium', glitches: ['FAKE_LETTER', 'DELAYED_FEEDBACK'], maxGuesses: 6, baseScore: 10 },
  4: { tier: 'medium', glitches: ['LETTER_MUTATION', 'COLOR_SWAP'], maxGuesses: 5, baseScore: 10 },
  5: { tier: 'medium', glitches: ['FAKE_LETTER', 'PHANTOM_GREEN'], maxGuesses: 5, baseScore: 10 },
  6: { tier: 'chaos', glitches: ['COLOR_SWAP', 'LETTER_MUTATION', 'INVISIBLE_TILE'], maxGuesses: 5, baseScore: 10 },
  7: { tier: 'chaos', glitches: ['REVERSE_COLORS', 'FAKE_LETTER', 'DELAYED_FEEDBACK'], maxGuesses: 4, baseScore: 10 },
  8: { tier: 'chaos', glitches: ['PHANTOM_GREEN', 'LETTER_MUTATION', 'COLOR_SWAP', 'INVISIBLE_TILE'], maxGuesses: 4, baseScore: 10 },
  9: { tier: 'psychological', glitches: ['COLOR_SWAP', 'FAKE_LETTER', 'LETTER_MUTATION', 'PHANTOM_GREEN', 'REVERSE_COLORS'], maxGuesses: 3, baseScore: 20 },
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
      timeLimit: 360, // 6 minutes
      baseScore: config.baseScore,
    };
  });
}
