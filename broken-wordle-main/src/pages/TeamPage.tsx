import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useClientGameEngine } from '@/game/useGameEngine';
import { GuessGrid } from '@/components/game/GuessGrid';
import { Keyboard } from '@/components/game/Keyboard';
import { Timer } from '@/components/game/Timer';
import { WordHeader } from '@/components/game/WordHeader';
import { TeamState } from '@/game/types';

const TeamPage = () => {
    const {
        gameState,
        updateTeamInput,
        submitGuess,
        joinTeam
    } = useClientGameEngine();

    const [searchParams] = useSearchParams();
    const [myTeamId, setMyTeamId] = useState<string | null>(() => {
        return searchParams.get('teamId') || sessionStorage.getItem('glitchy_wordle_team_id');
    });

    // Sync myTeamId changes to Host and sessionStorage
    useEffect(() => {
        if (myTeamId) {
            sessionStorage.setItem('glitchy_wordle_team_id', myTeamId);
            joinTeam(myTeamId);
        }
    }, [myTeamId, joinTeam]);

    // Update if URL changes
    useEffect(() => {
        const tid = searchParams.get('teamId');
        if (tid) setMyTeamId(tid);
    }, [searchParams]);

    // If we can support URL param for teamId, that would be cool too, but local state is fine for now.

    const { phase, teams, currentRound, timeRemaining, wordsCompleted, totalRounds } = gameState;
    const myTeam = teams.find(t => t.id === myTeamId);

    if (!myTeamId) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center scanlines p-4">
                <h1 className="text-4xl font-extrabold text-glow mb-8">SELECT TEAM</h1>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {teams.map(team => (
                        <button
                            key={team.id}
                            onClick={() => {
                                setMyTeamId(team.id);
                                joinTeam(team.id);
                            }}
                            disabled={team.isJoined}
                            className={`
                                p-6 border transition-all rounded-md flex flex-col items-center gap-2 group
                                ${team.isJoined
                                    ? 'border-muted-foreground/30 bg-muted/10 opacity-50 cursor-not-allowed'
                                    : 'border-border bg-card/50 hover:bg-card hover:border-primary'
                                }
                            `}
                        >
                            <div
                                className="w-12 h-12 rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] group-hover:scale-110 transition-transform"
                                style={{ backgroundColor: team.color, borderColor: team.color }}
                            />
                            <span className="font-bold text-lg text-foreground group-hover:text-primary">{team.name}</span>
                        </button>
                    ))}
                </div>
            </div>
        );
    }

    // Waiting for Host to start
    if (phase === 'LOBBY') {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center scanlines p-4">
                <h1 className="text-2xl text-muted-foreground mb-4">WAITING FOR HOST...</h1>
                <div
                    className="w-24 h-24 rounded-full border-4 shadow-[0_0_30px_rgba(0,0,0,0.5)] animate-pulse"
                    style={{ backgroundColor: myTeam.color, borderColor: myTeam.color }}
                />
                <h2 className="text-4xl font-extrabold text-glow mt-6" style={{ color: myTeam.color }}>{myTeam.name}</h2>
                <p className="mt-4 text-xs text-muted-foreground">PREPARE YOUR MIND</p>
            </div>
        );
    }

    // Final Results
    if (phase === 'END' || (phase === 'FINAL_SCORING' && !currentRound)) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center scanlines p-4">
                <h1 className="text-4xl text-foreground mb-4">GAME OVER</h1>
                <div className="text-2xl mb-4">
                    SCORE: <span style={{ color: myTeam.color }}>{myTeam.score}</span>
                </div>

                {/* Simple Rank Display */}
                {(() => {
                    const sorted = [...teams].sort((a, b) => b.score - a.score);
                    const rank = sorted.findIndex(t => t.id === myTeam.id) + 1;
                    return <div className="text-xl text-muted-foreground">YOU PLACED #{rank}</div>
                })()}
            </div>
        );
    }

    // Check if we have round data - if not (e.g., transition), show status
    if (!currentRound) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center scanlines p-4">
                <h1 className="text-xl text-muted-foreground mb-2">NEXT ROUND LOADING...</h1>
                {phase === 'TRANSITION' && <div className="text-sm text-primary">LEADERBOARD ON MAIN SCREEN</div>}
            </div>
        );
    }

    const isInputDisabled = myTeam.solved || myTeam.currentGuesses.length >= currentRound.maxGuesses || phase !== 'WORD_ACTIVE';

    return (
        <div className="min-h-screen bg-background flex flex-col scanlines">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: myTeam.color }} />
                    <span className="font-bold text-sm hidden md:inline">{myTeam.name}</span>
                </div>
                <Timer timeRemaining={timeRemaining} total={currentRound.timeLimit} />
            </div>

            {/* Main content */}
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-4 pb-4">

                <div className="flex flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">WORD {wordsCompleted + 1} / {totalRounds}</span>
                    <div className="flex gap-1">
                        {Array.from({ length: currentRound.length }).map((_, i) => (
                            <div key={i} className="w-2 h-2 rounded-full bg-muted-foreground/30" />
                        ))}
                    </div>
                </div>

                {myTeam.solved ? (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="text-tile-correct text-glow font-bold text-2xl animate-tile-pop">
                            ✓ WORD SOLVED
                        </div>
                        <p className="text-muted-foreground text-sm">WAITING FOR OTHERS...</p>
                    </div>
                ) : (
                    <GuessGrid
                        guesses={myTeam.currentGuesses}
                        currentInput={myTeam.currentInput}
                        wordLength={currentRound.length}
                        maxGuesses={currentRound.maxGuesses}
                        solved={myTeam.solved}
                    />
                )}

                <div className="w-full max-w-md mt-auto">
                    <Keyboard
                        onKey={(k) => {
                            if (myTeam.currentInput.length < currentRound.length) {
                                updateTeamInput(myTeam.id, myTeam.currentInput + k);
                            }
                        }}
                        onEnter={() => submitGuess(myTeam.id)}
                        onBackspace={() => updateTeamInput(myTeam.id, myTeam.currentInput.slice(0, -1))}
                        disabled={isInputDisabled}
                    />
                </div>
            </div>
        </div>
    );
};

export default TeamPage;
