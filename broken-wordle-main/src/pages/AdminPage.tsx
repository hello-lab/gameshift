import { useEffect, useCallback } from 'react';
import { useHostGameEngine } from '@/game/useGameEngine';
import { GuessGrid } from '@/components/game/GuessGrid';
import { Timer } from '@/components/game/Timer';
import { ScorePanel } from '@/components/game/ScorePanel';
import { WordHeader } from '@/components/game/WordHeader';
import { AdminPanel } from '@/components/game/AdminPanel';
import { LobbyScreen } from '@/components/game/LobbyScreen';
import { Leaderboard } from '@/components/game/Leaderboard';
import { ResolutionScreen } from '@/components/game/ResolutionScreen';

const AdminPage = () => {
    const {
        gameState,
        startGame,
        setActiveTeam,
        // updateTeamInput, // Admin doesn't type for teams anymore, usually
        // submitGuess,    // Admin doesn't submit guesses
        nextWord,
        continueFromLeaderboard,
        skipWord,
        lockInputs,
        endGame,
        setNextWord,
        setFirstWord,
        toggleGlitch
    } = useHostGameEngine();

    const { phase, teams, activeTeamIndex, currentRound, timeRemaining, roundIndex, totalRounds, wordsCompleted } = gameState;
    const activeTeam = teams[activeTeamIndex];

    // Admin View: We probably want to see *everything* or allow cycling through teams.
    // For now, let's keep the layout where we see one team at a time (Projector Mode)
    // but maybe we should default to Leaderboard or a Grid of all teams?
    // Let's stick to the Projector Mode style for the big screen.

    // LOBBY
    if (phase === 'LOBBY') {
        return (
            <>
                <LobbyScreen onStart={startGame} teams={teams} />
                <AdminPanel
                    roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
                    onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
                    onNextWord={nextWord} onEndGame={endGame}
                    onSetNextWord={setNextWord}
                    onSetFirstWord={setFirstWord}
                    teams={teams}
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
                    onSetNextWord={setNextWord}
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
                <AdminPanel
                    roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
                    onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
                    onNextWord={nextWord} onEndGame={endGame}
                    onSetNextWord={setNextWord}
                />
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
                    onSetNextWord={setNextWord}
                />
            </>
        );
    }

    // WORD ACTIVE
    if (!currentRound) return null;

    return (
        <div className="min-h-screen bg-background flex flex-col scanlines">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <WordHeader round={currentRound} wordsCompleted={wordsCompleted} totalRounds={totalRounds} />
                <Timer timeRemaining={timeRemaining} total={currentRound.timeLimit} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex">
                {/* Game area - Spectator View of Active Team */}
                <div className="flex-1 flex flex-col items-center justify-center gap-6 p-4 pb-24">
                    <h2 className="text-xl text-glow" style={{ color: activeTeam.color }}>
                        WATCHING: {activeTeam.name}
                    </h2>

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

                    {/* No Keyboard for Admin */}
                </div>

                {/* Score sidebar - Admin can switch views */}
                <div className="w-56 border-l border-border p-4 hidden md:block">
                    <ScorePanel teams={teams} activeTeamIndex={activeTeamIndex} onSelectTeam={setActiveTeam} />
                </div>
            </div>

            {/* Admin */}
            <AdminPanel
                roundIndex={roundIndex} totalRounds={totalRounds} phase={phase}
                word={currentRound?.word} // Use safe access or ensure currentRound is valid when needed
                activeGlitches={currentRound?.activeGlitches}
                onStartGame={startGame} onSkipWord={skipWord} onLockInputs={lockInputs}
                onNextWord={nextWord} onEndGame={endGame}
                onSetNextWord={setNextWord}
                onSetFirstWord={setFirstWord}
                onToggleGlitch={toggleGlitch}
            />
        </div>
    );
};

export default AdminPage;
