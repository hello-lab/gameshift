import { TeamState } from '@/game/types';

export function LobbyScreen({ onStart, teams }: { onStart: () => void; teams: TeamState[] }) {
  const allJoined = teams.length === 6 && teams.every(t => t.isJoined);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background scanlines p-4">
      <div className="text-center max-w-4xl w-full">
        <h1 className="text-5xl sm:text-7xl font-extrabold text-glow mb-2 tracking-tight">
          BROKEN
        </h1>
        <h2 className="text-3xl sm:text-5xl font-bold text-secondary text-glow-secondary mb-8 tracking-tight">
          WORDLE
        </h2>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {teams.map(team => (
            <div
              key={team.id}
              className={`
                        p-4 border rounded-sm transition-all duration-500
                        ${team.isJoined
                  ? 'border-primary bg-primary/10 text-primary shadow-glow'
                  : 'border-muted-foreground/30 text-muted-foreground opacity-50'
                }
                    `}
            >
              <div className="font-bold text-sm tracking-widest">{team.name}</div>
              <div className="text-xs mt-1 font-mono">
                {team.isJoined ? 'READY' : 'WAITING...'}
              </div>
            </div>
          ))}
        </div>

        <div className="text-xs text-muted-foreground uppercase tracking-[0.3em] mb-8">
          ─── Finale ───
        </div>

        <button
          onClick={onStart}
          disabled={!allJoined}
          className={`
            px-8 py-3 font-bold uppercase tracking-widest rounded-sm transition-all text-sm
            ${allJoined
              ? 'bg-primary text-primary-foreground hover:bg-primary/90 animate-pulse-glow cursor-pointer'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
            }
          `}
        >
          {allJoined ? '[ INITIALIZE ]' : '[ AWAITING TEAMS ]'}
        </button>
      </div>
    </div>
  );
}
