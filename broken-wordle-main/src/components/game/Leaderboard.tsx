import { TeamState } from '@/game/types';

interface LeaderboardProps {
  teams: TeamState[];
  title: string;
  subtitle?: string;
  onContinue: () => void;
  isFinal?: boolean;
}

export function Leaderboard({ teams, title, subtitle, onContinue, isFinal }: LeaderboardProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-8 scanlines">
      <div className="max-w-md w-full">
        <h1 className="text-3xl font-bold text-center text-glow mb-1">{title}</h1>
        {subtitle && <p className="text-sm text-muted-foreground text-center mb-8">{subtitle}</p>}

        <div className="flex flex-col gap-3 mb-8">
          {sorted.map((team, i) => (
            <div
              key={team.id}
              className={`
                flex items-center justify-between px-4 py-3 rounded-sm border
                transition-all duration-500
                ${i === 0 ? 'border-primary bg-primary/10 box-glow' : 'border-border bg-card'}
              `}
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className={`text-lg font-bold ${i === 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                  #{i + 1}
                </span>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: team.color }}
                />
                <span className="font-semibold text-sm">{team.name}</span>
              </div>
              <span className={`text-xl font-bold tabular-nums ${i === 0 ? 'text-primary text-glow' : ''}`}>
                {team.score}
              </span>
            </div>
          ))}
        </div>

        <button
          onClick={onContinue}
          className="w-full py-3 rounded-sm bg-primary text-primary-foreground font-bold text-sm uppercase tracking-widest hover:bg-primary/90 transition-all animate-pulse-glow"
        >
          {isFinal ? '[ END GAME ]' : '[ CONTINUE ]'}
        </button>
      </div>
    </div>
  );
}
