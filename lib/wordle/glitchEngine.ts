import { GlitchType, TileFeedback } from "./types";

export function generateTrueFeedback(guess: string, word: string): TileFeedback[] {
  const feedback: TileFeedback[] = [];
  const wordArr = word.split("");
  const guessArr = guess.split("");
  const used = new Array(word.length).fill(false);

  for (let i = 0; i < guessArr.length; i += 1) {
    if (i < wordArr.length && guessArr[i] === wordArr[i]) {
      feedback[i] = { letter: guessArr[i], state: "correct" };
      used[i] = true;
    }
  }

  for (let i = 0; i < guessArr.length; i += 1) {
    if (feedback[i]) continue;
    const idx = wordArr.findIndex((l, j) => l === guessArr[i] && !used[j]);
    if (idx !== -1) {
      feedback[i] = { letter: guessArr[i], state: "present" };
      used[idx] = true;
    } else {
      feedback[i] = { letter: guessArr[i], state: "absent" };
    }
  }

  return feedback;
}

export function applyGlitches(trueFeedback: TileFeedback[], glitches: GlitchType[]): TileFeedback[] {
  let feedback = trueFeedback.map((tile) => ({ ...tile }));

  for (const glitch of glitches) {
    feedback = applyGlitch(feedback, glitch);
  }

  return feedback;
}

function applyGlitch(feedback: TileFeedback[], glitch: GlitchType): TileFeedback[] {
  const result = feedback.map((tile) => ({ ...tile }));

  switch (glitch) {
    case "COLOR_SWAP": {
      const swappable = result
        .map((tile, i) => ({ tile, i }))
        .filter(({ tile }) => tile.state === "correct" || tile.state === "present");
      if (swappable.length > 0) {
        const pick = swappable[Math.floor(Math.random() * swappable.length)];
        result[pick.i] = {
          ...result[pick.i],
          state: result[pick.i].state === "correct" ? "present" : "correct",
          glitched: true,
        };
      }
      break;
    }

    case "FAKE_LETTER": {
      const absents = result.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.state === "absent");
      if (absents.length > 0) {
        const pick = absents[Math.floor(Math.random() * absents.length)];
        result[pick.i] = { ...result[pick.i], state: "present", glitched: true };
      }
      break;
    }

    case "LETTER_MUTATION": {
      const idx = Math.floor(Math.random() * result.length);
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
      let newChar = result[idx].letter;
      while (newChar === result[idx].letter) {
        newChar = chars[Math.floor(Math.random() * chars.length)];
      }
      result[idx] = { ...result[idx], letter: newChar, glitched: true };
      break;
    }

    case "PHANTOM_GREEN": {
      const absents = result.map((tile, i) => ({ tile, i })).filter(({ tile }) => tile.state === "absent");
      if (absents.length > 0) {
        const pick = absents[Math.floor(Math.random() * absents.length)];
        result[pick.i] = { ...result[pick.i], state: "correct", glitched: true };
      }
      break;
    }

    case "REVERSE_COLORS": {
      for (let i = 0; i < result.length; i += 1) {
        if (result[i].state === "correct") {
          result[i] = { ...result[i], state: "absent", glitched: true };
        } else if (result[i].state === "absent") {
          result[i] = { ...result[i], state: "correct", glitched: true };
        }
      }
      break;
    }

    case "INVISIBLE_TILE": {
      const idx = Math.floor(Math.random() * result.length);
      result[idx] = { ...result[idx], letter: " ", state: "empty", glitched: true };
      break;
    }

    case "DELAYED_FEEDBACK":
    case "LENGTH_SHIFT":
      break;
  }

  return result;
}
