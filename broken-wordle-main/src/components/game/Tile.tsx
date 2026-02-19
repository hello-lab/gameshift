import { TileFeedback, TileState } from '@/game/types';

interface TileProps {
  feedback?: TileFeedback;
  delay?: number;
  isCurrentRow?: boolean;
}

const stateStyles: Record<TileState, React.CSSProperties> = {
  correct: { backgroundColor: '#22c55e', borderColor: '#22c55e', borderWidth: '2px', color: 'white' },
  present: { backgroundColor: '#eab308', borderColor: '#eab308', borderWidth: '2px', color: 'black' },
  absent: { backgroundColor: '#4b5563', borderColor: '#4b5563', borderWidth: '2px', color: '#a0a9b8' },
  empty: { backgroundColor: '#1f2937', borderColor: '#374151', borderWidth: '2px', color: 'inherit' },
  tbd: { backgroundColor: '#1f2937', borderColor: '#5b21b6', borderWidth: '2px', color: 'inherit' },
};

export function Tile({ feedback, delay = 0, isCurrentRow }: TileProps) {
  const state = feedback?.state ?? 'empty';
  const letter = feedback?.letter ?? '';
  const hasLetter = letter.trim().length > 0;

  return (
    <div
      className={`
        relative flex items-center justify-center
        w-12 h-12 sm:w-14 sm:h-14
        rounded-sm
        font-bold text-xl sm:text-2xl uppercase
        transition-all duration-300
        ${hasLetter && state === 'empty' ? 'animate-tile-pop' : ''}
        ${state !== 'empty' && state !== 'tbd' ? 'animate-tile-reveal' : ''}
        ${feedback?.glitched ? 'animate-glitch-skew' : ''}
      `}
      style={{
        ...stateStyles[state],
        animationDelay: `${delay * 100}ms`,
      }}
    >
      {letter}
      {feedback?.glitched && (
        <div className="absolute inset-0 bg-primary/10 animate-flicker rounded-sm pointer-events-none" />
      )}
    </div>
  );
}
