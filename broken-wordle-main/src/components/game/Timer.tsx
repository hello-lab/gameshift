interface TimerProps {
  timeRemaining: number;
  total: number;
}

export function Timer({ timeRemaining, total }: TimerProps) {
  const minutes = Math.floor(timeRemaining / 60);
  const seconds = timeRemaining % 60;
  const pct = (timeRemaining / total) * 100;
  const isLow = timeRemaining < 60;
  const isCritical = timeRemaining < 15;

  return (
    <div className="flex flex-col items-center gap-1">
      <span
        className={`
          text-3xl font-bold tabular-nums tracking-wider
          ${isCritical ? 'text-destructive text-glow-danger animate-flicker' : isLow ? 'text-tile-present text-glow-warning' : 'text-foreground text-glow'}
        `}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </span>
      <div className="w-32 h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={`h-full transition-all duration-1000 rounded-full ${
            isCritical ? 'bg-destructive' : isLow ? 'bg-tile-present' : 'bg-primary'
          }`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
