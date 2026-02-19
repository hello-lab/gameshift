import { WordRound, TeamState } from '@/game/types';

interface ResolutionScreenProps {
  round: WordRound;
  teams: TeamState[];
  onNext: () => void;
}

export function ResolutionScreen({ round, teams, onNext }: ResolutionScreenProps) {
  const solvers = teams.filter(t => t.solved);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 scanlines">
      <div className="max-w-md w-full text-center">
        <span className="text-xs text-muted-foreground uppercase tracking-widest">Word {round.wordIndex + 1} Complete</span>
        <h2 className="text-4xl font-extrabold text-glow mt-2 mb-6 tracking-widest">
          {round.word}
        </h2>

        {solvers.length > 0 ? (
          <div className="mb-6">
            <p className="text-xs text-muted-foreground mb-3">Solved by:</p>
            <div className="flex flex-col gap-2">
              {solvers.map(t => (
                <div key={t.id} className="flex items-center justify-between px-4 py-2 border border-tile-correct/30 rounded-sm bg-tile-correct/5">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <span className="text-sm text-tile-correct font-bold">{t.solvedInGuesses} guesses</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-destructive text-sm mb-6">No team solved this word.</p>
        )}

        <div className="flex flex-wrap gap-1 justify-center mb-6">
          {round.activeGlitches.map(g => (
            <span key={g} className="text-[10px] px-2 py-1 rounded bg-muted text-muted-foreground border border-border">
              {g.replace(/_/g, ' ')}
            </span>
          ))}
          {round.activeGlitches.length === 0 && (
            <span className="text-[10px] text-muted-foreground">No glitches active</span>
          )}
        </div>
      </div>
    </div>
  );
}
