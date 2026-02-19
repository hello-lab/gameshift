import { GuessResult, TileFeedback } from '@/game/types';
import { Tile } from './Tile';

interface GuessGridProps {
  guesses: GuessResult[];
  currentInput: string;
  wordLength: number;
  maxGuesses: number;
  solved: boolean;
}

export function GuessGrid({ guesses, currentInput, wordLength, maxGuesses, solved }: GuessGridProps) {
  const rows: (TileFeedback[] | null)[] = [];

  // Completed guesses
  for (const g of guesses) {
    rows.push(g.displayFeedback);
  }

  // Current input row (if not solved and under limit)
  if (!solved && guesses.length < maxGuesses) {
    const inputTiles: TileFeedback[] = [];
    for (let i = 0; i < wordLength; i++) {
      inputTiles.push({
        letter: currentInput[i] ?? '',
        state: currentInput[i] ? 'tbd' : 'empty',
      });
    }
    rows.push(inputTiles);
  }

  // Empty rows
  while (rows.length < maxGuesses) {
    const emptyRow: TileFeedback[] = Array.from({ length: wordLength }, () => ({
      letter: '',
      state: 'empty' as const,
    }));
    rows.push(emptyRow);
  }

  return (
    <div className="flex flex-col gap-1.5 items-center">
      {rows.map((row, ri) => (
        <div key={ri} className="flex gap-1.5">
          {row?.map((tile, ti) => (
            <Tile
              key={ti}
              feedback={tile}
              delay={ri === guesses.length - 1 ? ti : 0}
              isCurrentRow={ri === guesses.length}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
