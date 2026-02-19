import { useState } from 'react';
import { TeamState, GlitchType } from '@/game/types';

interface AdminPanelProps {
  roundIndex: number;
  totalRounds: number;
  phase: string;
  word?: string;
  activeGlitches?: GlitchType[];
  teams?: TeamState[];
  onStartGame: () => void;
  onSkipWord: () => void;
  onLockInputs: () => void;
  onNextWord: () => void;
  onEndGame: () => void;
  onSetNextWord?: (word: string) => void;
  onSetFirstWord?: (word: string) => void;
  onToggleGlitch?: (glitch: GlitchType) => void;
}

const ALL_GLITCHES: GlitchType[] = [
  'COLOR_SWAP', 'DELAYED_FEEDBACK', 'FAKE_LETTER',
  'LETTER_MUTATION', 'LENGTH_SHIFT', 'PHANTOM_GREEN',
  'REVERSE_COLORS', 'INVISIBLE_TILE'
];

export function AdminPanel({
  roundIndex, totalRounds, phase, word, activeGlitches = [], teams,
  onStartGame, onSkipWord, onLockInputs, onNextWord, onEndGame,
  onSetNextWord, onSetFirstWord, onToggleGlitch
}: AdminPanelProps) {
  const [nextWordInput, setNextWordInput] = useState('');
  const [firstWordInput, setFirstWordInput] = useState('');

  const allTeamsJoined = teams ? (teams.length === 6 && teams.every(t => t.isJoined)) : true;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-3 z-50 shadow-up-lg">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">

        {/* LEFT: INFO */}
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-xs font-bold text-primary">
            PHASE: {phase}
          </span>
          {word && (
            <span className="text-xs text-destructive font-bold">
              WORD: {word}
            </span>
          )}
        </div>

        {/* CENTER: CONTROLS */}
        <div className="flex items-center gap-6">

          {/* FIRST WORD SETTER (LOBBY ONLY) */}
          {phase === 'LOBBY' && onSetFirstWord && (
            <div className="flex items-center gap-2 border-r border-border pr-4">
              <input
                className="h-7 w-32 bg-background border border-border px-2 text-xs uppercase"
                placeholder="FIRST WORD..."
                value={firstWordInput}
                onChange={(e) => setFirstWordInput(e.target.value)}
              />
              <AdminBtn
                onClick={() => {
                  onSetFirstWord(firstWordInput);
                  setFirstWordInput('');
                }}
                label="SET START"
              />
            </div>
          )}

          {/* NEXT WORD SETTER (GAME ACTIVE) */}
          {phase !== 'LOBBY' && phase !== 'END' && onSetNextWord && (
            <div className="flex items-center gap-2 border-r border-border pr-4">
              <input
                className="h-7 w-32 bg-background border border-border px-2 text-xs uppercase"
                placeholder="NEXT WORD..."
                value={nextWordInput}
                onChange={(e) => setNextWordInput(e.target.value)}
              />
              <AdminBtn
                onClick={() => {
                  onSetNextWord(nextWordInput);
                  setNextWordInput('');
                }}
                label="SET NEXT"
              />
            </div>
          )}

          {/* GLITCH TOGGLES */}
          {(phase === 'WORD_ACTIVE' || phase === 'WORD_RESOLUTION') && onToggleGlitch && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 max-w-[400px] border-r border-border pr-4">
              {ALL_GLITCHES.map(g => (
                <label key={g} className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                  <input
                    type="checkbox"
                    className="accent-primary w-3 h-3"
                    checked={activeGlitches.includes(g)}
                    onChange={() => onToggleGlitch(g)}
                  />
                  <span className="text-[10px] uppercase">{g.replace('_', ' ')}</span>
                </label>
              ))}
            </div>
          )}

          {/* GAME FLOW BUTTONS */}
          <div className="flex gap-2">
            {phase === 'LOBBY' && (
              <AdminBtn
                onClick={onStartGame}
                label={allTeamsJoined ? "START GAME" : "WAITING FOR TEAMS"}
                variant={allTeamsJoined ? "primary" : undefined}
                disabled={!allTeamsJoined}
              />
            )}
            {phase === 'WORD_ACTIVE' && (
              <>
                <AdminBtn onClick={onSkipWord} label="SKIP WORD" />
                <AdminBtn onClick={onLockInputs} label="LOCK INPUTS" />
              </>
            )}
            {phase === 'WORD_RESOLUTION' && (
              <AdminBtn onClick={onNextWord} label="NEXT WORD" variant="primary" />
            )}
            {(phase === 'FINAL_SCORING' || phase === 'END') && (
              <AdminBtn onClick={onEndGame} label="END" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminBtn({ onClick, label, variant, disabled }: { onClick: () => void; label: string; variant?: 'primary'; disabled?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-sm border transition-all whitespace-nowrap
        ${disabled
          ? 'border-border bg-muted/50 text-muted-foreground/50 cursor-not-allowed'
          : variant === 'primary'
            ? 'border-primary bg-primary/20 text-primary hover:bg-primary/30'
            : 'border-border bg-muted text-muted-foreground hover:bg-muted/80'
        }
      `}
    >
      {label}
    </button>
  );
}
