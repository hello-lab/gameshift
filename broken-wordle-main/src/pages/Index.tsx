import { useEffect, useCallback } from 'react';
import { useGameEngine } from '@/game/useGameEngine';
import { GuessGrid } from '@/components/game/GuessGrid';
import { Keyboard } from '@/components/game/Keyboard';
import { Timer } from '@/components/game/Timer';
import { ScorePanel } from '@/components/game/ScorePanel';
import { WordHeader } from '@/components/game/WordHeader';
import { AdminPanel } from '@/components/game/AdminPanel';
import { LobbyScreen } from '@/components/game/LobbyScreen';
import { Leaderboard } from '@/components/game/Leaderboard';
import { ResolutionScreen } from '@/components/game/ResolutionScreen';

const Index = () => {
  const {
    gameState,
    startGame,
    setActiveTeam,
    updateTeamInput,
    submitGuess,
    nextWord,
    continueFromLeaderboard,
    skipWord,
    lockInputs,
    endGame,
  } = useGameEngine();

  const { phase, teams, activeTeamIndex, currentRound, timeRemaining, roundIndex, totalRounds, wordsCompleted } = gameState;
  const activeTeam = teams[activeTeamIndex];

  // Physical keyboard handler
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (phase !== 'WORD_ACTIVE' || !currentRound || activeTeam.solved) return;
    if (activeTeam.currentGuesses.length >= currentRound.maxGuesses) return;

    if (e.key === 'Enter') {
      submitGuess(activeTeam.id);
    } else if (e.key === 'Backspace') {
      updateTeamInput(activeTeam.id, activeTeam.currentInput.slice(0, -1));
    } else if (/^[a-zA-Z]$/.test(e.key) && activeTeam.currentInput.length < currentRound.length) {
      updateTeamInput(activeTeam.id, activeTeam.currentInput + e.key.toUpperCase());
    }
  }, [phase, currentRound, activeTeam, submitGuess, updateTeamInput]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // LOBBY
  if (phase === 'LOBBY') {
    return (
      <>
        <LobbyScreen onStart={startGame} />
        <AdminPanel
          roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
          onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
          onNextWord={nextWord} onEndGame={endGame}
        />
      </>
    );
  }

  // TRANSITION / LEADERBOARD
  if (phase === 'TRANSITION' || phase === 'FINAL_SCORING') {
    return (
      <>
        <Leaderboard
          teams={teams}
          title={phase === 'FINAL_SCORING' ? 'FINAL RESULTS' : 'STANDINGS'}
          subtitle={phase === 'FINAL_SCORING' ? 'The system has been defeated.' : `After ${wordsCompleted} words`}
          onContinue={phase === 'FINAL_SCORING' ? endGame : continueFromLeaderboard}
          isFinal={phase === 'FINAL_SCORING'}
        />
        <AdminPanel
          roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
          onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
          onNextWord={nextWord} onEndGame={endGame}
        />
      </>
    );
  }

  // END
  if (phase === 'END') {
    const winner = [...teams].sort((a, b) => b.score - a.score)[0];
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-background scanlines">
        <h1 className="text-5xl font-extrabold text-glow mb-4">GAME OVER</h1>
        <p className="text-xl text-secondary text-glow-secondary mb-2">{winner.name} WINS</p>
        <p className="text-3xl font-bold text-primary text-glow">{winner.score} PTS</p>
      </div>
    );
  }

  // WORD RESOLUTION
  if (phase === 'WORD_RESOLUTION' && currentRound) {
    return (
      <>
        <ResolutionScreen round={currentRound} teams={teams} onNext={nextWord} />
        <AdminPanel
          roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
          word={currentRound.word}
          onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
          onNextWord={nextWord} onEndGame={endGame}
        />
      </>
    );
  }

  // WORD ACTIVE
  if (!currentRound) return null;

  const isInputDisabled = activeTeam.solved || activeTeam.currentGuesses.length >= currentRound.maxGuesses;

  return (
    <div className="min-h-screen bg-background flex flex-col scanlines">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <WordHeader round={currentRound} wordsCompleted={wordsCompleted} totalRounds={totalRounds} />
        <Timer timeRemaining={timeRemaining} total={currentRound.timeLimit} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex">
        {/* Game area */}
        <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 pb-24">
          {activeTeam.solved && (
            <div className="text-tile-correct text-glow font-bold text-lg animate-tile-pop">
              ✓ SOLVED IN {activeTeam.solvedInGuesses} GUESSES
            </div>
          )}

          <GuessGrid
            guesses={activeTeam.currentGuesses}
            currentInput={activeTeam.currentInput}
            wordLength={currentRound.length}
            maxGuesses={currentRound.maxGuesses}
            solved={activeTeam.solved}
          />

          <Keyboard
            onKey={(k) => {
              if (activeTeam.currentInput.length < currentRound.length) {
                updateTeamInput(activeTeam.id, activeTeam.currentInput + k);
              }
            }}
            onEnter={() => submitGuess(activeTeam.id)}
            onBackspace={() => updateTeamInput(activeTeam.id, activeTeam.currentInput.slice(0, -1))}
            disabled={isInputDisabled}
          />
        </div>

        {/* Score sidebar */}
        <div className="w-56 border-l border-border p-4 hidden md:block">
          <ScorePanel teams={teams} activeTeamIndex={activeTeamIndex} onSelectTeam={setActiveTeam} />
        </div>
      </div>

      {/* Admin */}
      <AdminPanel
        roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
        word={currentRound.word}
        onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
        onNextWord={nextWord} onEndGame={endGame}
      />
    </div>
  );
};

export default Index;
