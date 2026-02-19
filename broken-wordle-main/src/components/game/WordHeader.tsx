import { GlitchTier, WordRound } from '@/game/types';

interface WordHeaderProps {
  round: WordRound;
  wordsCompleted: number;
  totalRounds: number;
}

const tierLabels: Record<GlitchTier, { label: string; class: string }> = {
  minor: { label: 'MINOR GLITCHES', class: 'text-primary' },
  medium: { label: 'MEDIUM GLITCHES', class: 'text-tile-present text-glow-warning' },
  chaos: { label: '⚡ CHAOS MODE ⚡', class: 'text-destructive text-glow-danger animate-flicker' },
  psychological: { label: '🧠 PSYCHOLOGICAL', class: 'text-destructive text-glow-danger animate-glitch-skew' },
};

export function WordHeader({ round, wordsCompleted, totalRounds }: WordHeaderProps) {
  const tier = tierLabels[round.tier];

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center gap-3">
        <span className="text-xs text-muted-foreground tracking-widest uppercase">Word</span>
        <span className="text-2xl font-bold text-glow">{wordsCompleted + 1}/{totalRounds}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-xs font-semibold tracking-wider ${tier.class}`}>
          {tier.label}
        </span>
        <span className="text-xs text-muted-foreground">
          • {round.length} letters • {round.maxGuesses} guesses
        </span>
      </div>
      {round.activeGlitches.length > 0 && round.tier !== 'psychological' && (
        <div className="flex gap-1 mt-1">
          {round.activeGlitches.map(g => (
            <span key={g} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground border border-border">
              {g.replace(/_/g, ' ')}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
