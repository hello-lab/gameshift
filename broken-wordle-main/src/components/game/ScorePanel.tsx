import { TeamState } from '@/game/types';

interface ScorePanelProps {
  teams: TeamState[];
  activeTeamIndex: number;
  onSelectTeam: (index: number) => void;
}

export function ScorePanel({ teams, activeTeamIndex, onSelectTeam }: ScorePanelProps) {
  const sorted = [...teams].sort((a, b) => b.score - a.score);

  return (
    <div className="flex flex-col gap-2">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-1">Teams</h3>
      {teams.map((team, i) => (
        <button
          key={team.id}
          onClick={() => onSelectTeam(i)}
          className={`
            flex items-center justify-between gap-3
            px-3 py-2 rounded-sm text-sm
            border transition-all duration-200
            ${i === activeTeamIndex
              ? 'border-primary bg-primary/10 text-glow'
              : 'border-border bg-card hover:bg-muted/50'
            }
          `}
        >
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: team.color }}
            />
            <span className="font-medium text-xs">{team.name}</span>
          </div>
          <div className="flex items-center gap-2">
            {team.solved && <span className="text-tile-correct text-xs">✓</span>}
            <span className="font-bold tabular-nums">{team.score}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
