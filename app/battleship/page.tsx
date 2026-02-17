import Link from "next/link";

export default function BattleshipPage() {
    return (
        <div
            className="overflow-hidden h-screen w-full flex flex-col bg-verse-bg text-verse-light font-arcade"
            style={{
                backgroundImage: `linear-gradient(to bottom, rgba(42, 27, 78, 0.9), rgba(24, 16, 45, 0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
            }}
        >
            <header className="shrink-0 flex flex-col gap-3 p-3 bg-verse-dark/90 border-b-4 border-verse-purple z-10">
                <div className="flex items-center justify-between">
                    <Link href="/" className="text-verse-light hover:text-white">
                        <span className="material-symbols-outlined">arrow_back_ios</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="px-2 py-1 bg-verse-bg border-2 border-verse-light flex items-center gap-2 shadow-[2px_2px_0_#000]">
                            <span className="text-[14px] text-verse-pink font-pixel uppercase">Lvl</span>
                            <span className="text-lg font-pixel text-white">7</span>
                        </div>
                        <div className="flex items-center gap-2 bg-black/40 px-3 py-1 border border-verse-cyan/30 rounded-none">
                            <div className="w-2 h-2 bg-verse-cyan animate-pulse"></div>
                            <span className="text-sm font-arcade tracking-widest text-verse-cyan uppercase">ONLINE</span>
                        </div>
                    </div>
                    <button className="text-verse-light hover:text-white">
                        <span className="material-symbols-outlined">grid_view</span>
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-4 mt-1 px-1">
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-arcade text-verse-light">PLAYERS</span>
                            <span className="text-sm font-pixel text-verse-accent">5/5</span>
                        </div>
                        <div className="flex gap-1 h-3">
                            <div className="pixel-heart"></div>
                            <div className="pixel-heart"></div>
                            <div className="pixel-heart"></div>
                            <div className="pixel-heart"></div>
                            <div className="pixel-heart"></div>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <div className="flex justify-between items-end mb-1">
                            <span className="text-sm font-arcade text-verse-light">FLEET HP</span>
                            <span className="text-sm font-pixel text-verse-pink">98%</span>
                        </div>
                        <div className="h-3 w-full bg-black border border-white/20 p-[1px]">
                            <div className="h-full bg-verse-pink w-[98%] shadow-[inset_0_-2px_0_rgba(0,0,0,0.3)]"></div>
                        </div>
                    </div>
                </div>
            </header>

            <div className="shrink-0 bg-gradient-to-r from-verse-purple to-verse-bg py-2 border-b-2 border-black flex items-center justify-center gap-3 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-white/10"></div>
                <span className="material-symbols-outlined text-verse-accent text-sm animate-bounce">star</span>
                <p className="text-xs font-pixel text-white uppercase tracking-widest drop-shadow-md">Phase 1: Start</p>
                <span className="material-symbols-outlined text-verse-accent text-sm animate-bounce">star</span>
            </div>

            <main className="flex-1 flex flex-col relative overflow-hidden">
                <div className="shrink-0 p-4 pb-2 flex justify-center">
                    <div className="flex gap-4 w-full max-w-sm">
                        <button className="flex-1 py-3 px-2 btn-retro flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">videogame_asset</span>
                            <span className="font-pixel text-[10px] leading-none mt-1">BATTLE</span>
                        </button>
                        <button className="flex-1 py-3 px-2 btn-retro-secondary flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-sm">castle</span>
                            <span className="font-pixel text-[10px] leading-none mt-1">BASE</span>
                        </button>
                    </div>
                </div>

                <p className="text-center text-verse-cyan/70 font-arcade text-lg tracking-wider animate-pulse mb-2">
                    &lt; SYSTEM SYNCED &gt;
                </p>

                <div className="flex-1 overflow-y-auto flex items-center justify-center p-2">
                    <div className="relative w-full max-w-[360px] aspect-square pixel-box p-3">
                        <div className="absolute top-0 left-8 right-3 h-6 flex justify-between items-end pb-1 text-sm text-verse-light/60 font-arcade">
                            <span>1</span><span>2</span><span>3</span><span>4</span><span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span>10</span>
                        </div>
                        <div className="absolute top-8 bottom-3 left-0 w-6 flex flex-col justify-between items-end pr-1 text-sm text-verse-light/60 font-arcade">
                            <span>A</span><span>B</span><span>C</span><span>D</span><span>E</span><span>F</span><span>G</span><span>H</span><span>I</span><span>J</span>
                        </div>

                        <div className="ml-6 mt-6 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] grid grid-cols-10 grid-rows-10 gap-[1px] bg-verse-dark border-2 border-verse-purple/50">
                            {/* Row 1/A */}
                            <div className="grid-cell"></div>
                            <div className="grid-cell"><div className="w-1.5 h-1.5 bg-white/10"></div></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell">
                                <div className="team-avatar-pixel border-2 border-yellow-500 text-yellow-600 bg-yellow-100">D</div>
                            </div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>

                            {/* Row 2/B */}
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell bg-verse-cyan/20"></div>
                            <div className="grid-cell">
                                <div className="spark-hit absolute z-0"></div>
                                <div className="team-avatar-pixel border-2 border-verse-purple text-verse-purple bg-purple-100 scale-90 relative z-10">B</div>
                            </div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"><div className="w-1.5 h-1.5 bg-white/10"></div></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>

                            {/* Row 3/C */}
                            <div className="grid-cell"></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell">
                                <div className="team-avatar-pixel border-2 border-pink-500 text-pink-600 bg-pink-100">G</div>
                            </div>
                            <div className="grid-cell bg-verse-cyan/20"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>

                            {/* Row 4/D */}
                            <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>

                            {/* Row 5/E */}
                            <div className="grid-cell"></div><div className="grid-cell"></div><div className="grid-cell"></div>
                            <div className="grid-cell">
                                <div className="team-avatar-pixel border-2 border-cyan-500 text-cyan-600 bg-cyan-100">A</div>
                            </div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell relative"><div className="spark-hit"></div></div>
                            <div className="grid-cell"></div>
                            <div className="grid-cell"></div>

                            {/* Row 6-10 F-J (50 cells) */}
                            {[...Array(50)].map((_, i) => (
                                <div key={i} className="grid-cell"></div>
                            ))}
                        </div>

                        <div className="absolute top-0 left-0 w-3 h-3 border-t-4 border-l-4 border-verse-accent"></div>
                        <div className="absolute top-0 right-0 w-3 h-3 border-t-4 border-r-4 border-verse-accent"></div>
                        <div className="absolute bottom-0 left-0 w-3 h-3 border-b-4 border-l-4 border-verse-accent"></div>
                        <div className="absolute bottom-0 right-0 w-3 h-3 border-b-4 border-r-4 border-verse-accent"></div>
                    </div>
                </div>

                <div className="shrink-0 max-h-[25vh] flex flex-col border-t-4 border-verse-purple bg-verse-dark relative z-20 shadow-[0_-4px_10px_rgba(0,0,0,0.5)]">
                    <div className="px-4 py-2 border-b-2 border-verse-purple/30 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-2 text-verse-pink">
                            <span className="material-symbols-outlined text-sm">terminal</span>
                            <span className="text-sm font-pixel tracking-wider">QUEST LOG</span>
                        </div>
                        <span className="text-xs text-verse-light/50 font-arcade animate-pulse">LIVE_FEED</span>
                    </div>
                    <div className="overflow-y-auto p-4 space-y-3 font-arcade text-lg leading-tight">
                        <div className="flex gap-2 text-white items-start">
                            <span className="text-verse-light/50 text-base mt-[2px]">&gt;</span>
                            <span>Team Beta cast <span className="text-verse-accent">FIREBALL</span> at B5! It's super effective!</span>
                        </div>
                        <div className="flex gap-2 text-white/70 items-start">
                            <span className="text-verse-light/50 text-base mt-[2px]">&gt;</span>
                            <span>Team Delta scouting Sector A6...</span>
                        </div>
                        <div className="flex gap-2 text-white/70 items-start">
                            <span className="text-verse-light/50 text-base mt-[2px]">&gt;</span>
                            <span>Team Alpha spell <span className="text-verse-cyan">fizzled</span> at H2.</span>
                        </div>
                        <div className="flex gap-2 text-white/40 items-start">
                            <span className="text-verse-light/50 text-base mt-[2px]">&gt;</span>
                            <span className="text-verse-purple">Room synchronization stable.</span>
                        </div>
                    </div>
                </div>
            </main>

            <nav className="shrink-0 flex gap-2 border-t-4 border-verse-purple bg-verse-dark px-4 pb-6 pt-3 z-30 shadow-2xl">
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-accent group" href="#">
                    <div className="w-10 h-8 flex items-center justify-center bg-verse-accent/10 rounded border-2 border-transparent group-hover:border-verse-accent transition-all">
                        <span className="material-symbols-outlined text-2xl">radar</span>
                    </div>
                    <p className="text-[10px] font-pixel mt-1">RADAR</p>
                </a>
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-light/50 group hover:text-white transition-colors" href="#">
                    <div className="w-10 h-8 flex items-center justify-center bg-white/5 rounded border-2 border-transparent group-hover:border-white transition-all">
                        <span className="material-symbols-outlined text-2xl">swords</span>
                    </div>
                    <p className="text-[10px] font-pixel mt-1">FLEET</p>
                </a>
                <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-light/50 group hover:text-white transition-colors" href="#">
                    <div className="w-10 h-8 flex items-center justify-center bg-white/5 rounded border-2 border-transparent group-hover:border-white transition-all">
                        <span className="material-symbols-outlined text-2xl">groups</span>
                    </div>
                    <p className="text-[10px] font-pixel mt-1">PARTY</p>
                </a>
            </nav>
        </div>
    );
}
