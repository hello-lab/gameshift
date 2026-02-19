import { GlitchType, TileFeedback } from './types';

/**
 * Core principle: TRUE feedback is generated first,
 * then passed through glitch modifiers.
 */

export function generateTrueFeedback(guess: string, word: string): TileFeedback[] {
  const feedback: TileFeedback[] = [];
  const wordArr = word.split('');
  const guessArr = guess.split('');
  const used = new Array(word.length).fill(false);

  // First pass: exact matches
  for (let i = 0; i < guessArr.length; i++) {
    if (i < wordArr.length && guessArr[i] === wordArr[i]) {
      feedback[i] = { letter: guessArr[i], state: 'correct' };
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
  for (let i = 0; i < guessArr.length; i++) {
    if (feedback[i]) continue;
    const idx = wordArr.findIndex((l, j) => l === guessArr[i] && !used[j]);
    if (idx !== -1) {
      feedback[i] = { letter: guessArr[i], state: 'present' };
      used[idx] = true;
    } else {
      feedback[i] = { letter: guessArr[i], state: 'absent' };
    }
  }

  return feedback;
}

export function applyGlitches(
  trueFeedback: TileFeedback[],
  glitches: GlitchType[]
): TileFeedback[] {
  let feedback = trueFeedback.map(t => ({ ...t }));

  for (const glitch of glitches) {
    feedback = applyGlitch(feedback, glitch);
  }

  return feedback;
}

function applyGlitch(feedback: TileFeedback[], glitch: GlitchType): TileFeedback[] {
  const result = feedback.map(t => ({ ...t }));

  switch (glitch) {
    case 'COLOR_SWAP': {
      // Randomly swap one green to yellow or yellow to green
      const swappable = result
        .map((t, i) => ({ t, i }))
        .filter(({ t }) => t.state === 'correct' || t.state === 'present');
      if (swappable.length > 0) {
        const pick = swappable[Math.floor(Math.random() * swappable.length)];
        result[pick.i] = {
          ...result[pick.i],
          state: result[pick.i].state === 'correct' ? 'present' : 'correct',
          glitched: true,
        };
      }
      break;
    }

    case 'FAKE_LETTER': {
      // Mark one absent letter as present
      const absents = result.map((t, i) => ({ t, i })).filter(({ t }) => t.state === 'absent');
      if (absents.length > 0) {
        const pick = absents[Math.floor(Math.random() * absents.length)];
        result[pick.i] = { ...result[pick.i], state: 'present', glitched: true };
      }
      break;
    }

    case 'LETTER_MUTATION': {
      // Change the displayed letter on one tile (but keep the state)
      const idx = Math.floor(Math.random() * result.length);
      const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      let newChar = result[idx].letter;
      while (newChar === result[idx].letter) {
        newChar = chars[Math.floor(Math.random() * chars.length)];
      }
      result[idx] = { ...result[idx], letter: newChar, glitched: true };
      break;
    }

    case 'PHANTOM_GREEN': {
      // Show a random absent tile as green
      const absents = result.map((t, i) => ({ t, i })).filter(({ t }) => t.state === 'absent');
      if (absents.length > 0) {
        const pick = absents[Math.floor(Math.random() * absents.length)];
        result[pick.i] = { ...result[pick.i], state: 'correct', glitched: true };
      }
      break;
    }

    case 'REVERSE_COLORS': {
      // All greens become absent, absents become green
      for (let i = 0; i < result.length; i++) {
        if (result[i].state === 'correct') {
          result[i] = { ...result[i], state: 'absent', glitched: true };
        } else if (result[i].state === 'absent') {
          result[i] = { ...result[i], state: 'correct', glitched: true };
        }
      }
      break;
    }

    case 'INVISIBLE_TILE': {
      // One tile shows as empty/blank
      const idx = Math.floor(Math.random() * result.length);
      result[idx] = { ...result[idx], letter: ' ', state: 'empty', glitched: true };
      break;
    }

    case 'DELAYED_FEEDBACK':
    case 'LENGTH_SHIFT':
      // These are handled at the UI layer, not in feedback
      break;
  }

  return result;
}
