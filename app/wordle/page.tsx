import Link from "next/link";

export default function WordlePage() {
    return (
        <div className="bg-pixel-stars text-white overflow-hidden flex flex-col font-pixel min-h-screen">
            {/* Floating Icons */}
            <div className="fixed top-20 left-4 opacity-40 pointer-events-none animate-float z-0 hidden sm:block">
                <span className="material-symbols-outlined text-6xl text-pixel-light" style={{ fontVariationSettings: "'FILL' 1" }}>vpn_key</span>
            </div>
            <div className="fixed bottom-40 right-4 opacity-40 pointer-events-none animate-float z-0 hidden sm:block" style={{ animationDelay: "1.5s" }}>
                <span className="material-symbols-outlined text-6xl text-pixel-light" style={{ fontVariationSettings: "'FILL' 1" }}>toys</span>
            </div>

            {/* Header */}
            <div className="relative z-10 flex-none bg-pixel-dark/90 border-b-4 border-black pb-2">
                <div className="bg-primary text-white font-pixel text-center py-3 text-[10px] sm:text-xs tracking-widest uppercase flex items-center justify-center gap-3 overflow-hidden">
                    <span className="material-symbols-outlined text-sm animate-bounce">error</span>
                    <span className="glitch-text">SYSTEM MALFUNCTION</span>
                    <span className="material-symbols-outlined text-sm animate-bounce">error</span>
                </div>
                <div className="flex items-center px-4 pt-4 justify-between">
                    <Link href="/" className="text-white flex size-12 items-center justify-center bg-pixel-purple border-2 border-white/20 pixel-btn cursor-pointer active:bg-pixel-light" role="button">
                        <span className="material-symbols-outlined">menu</span>
                    </Link>
                    <div className="flex flex-col items-center">
                        <h1 className="text-white text-lg sm:text-2xl leading-none text-center drop-shadow-[4px_4px_0_rgba(0,0,0,1)]">
                            GAME<span className="text-primary">VERSE</span>
                        </h1>
                        <span className="text-[8px] sm:text-[10px] text-pixel-light tracking-widest uppercase mt-2 bg-black/40 px-2 py-1 rounded">Wordle Finale</span>
                    </div>
                    <div className="flex items-center justify-end">
                        <div className="flex items-center gap-2 bg-accent-yellow text-black border-2 border-black px-3 py-2 text-[8px] sm:text-[10px] uppercase tracking-wider pixel-btn">
                            <span className="material-symbols-outlined text-sm">stars</span>
                            <span>Finalist</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Game Area */}
            <div className="flex-1 overflow-y-auto flex flex-col items-center justify-start py-6 relative w-full max-w-md mx-auto px-4 z-10">

                {/* Stats */}
                <div className="w-full flex gap-4 mb-6">
                    <div className="flex flex-1 flex-col items-center justify-center bg-pixel-sky border-2 border-primary shadow-pixel-card p-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                        <span className="text-[8px] text-pixel-light uppercase mb-1 font-sans font-bold tracking-wider">Rank</span>
                        <span className="text-xl font-pixel text-white drop-shadow-md">#02</span>
                    </div>
                    <div className="flex flex-1 flex-col items-center justify-center bg-pixel-sky border-2 border-accent-yellow shadow-pixel-card p-2 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-white/20"></div>
                        <span className="text-[8px] text-pixel-light uppercase mb-1 font-sans font-bold tracking-wider">Time</span>
                        <span className="text-xl font-pixel text-accent-yellow font-terminal tracking-widest text-3xl tabular-nums">00:45</span>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-5 gap-2 w-full max-w-[340px] p-4 bg-black/30 rounded-xl border-4 border-pixel-purple/50">
                    {/* Row 1 */}
                    <div className="aspect-square pixel-cell bg-accent-yellow text-black border-2 border-black">G</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">H</div>
                    <div className="aspect-square pixel-cell bg-accent-green text-black border-2 border-black">O</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">S</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">T</div>

                    {/* Row 2 */}
                    <div className="aspect-square pixel-cell bg-accent-yellow text-black border-2 border-black">G</div>
                    <div className="aspect-square pixel-cell bg-accent-green text-black border-2 border-black">R</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">I</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">N</div>
                    <div className="aspect-square pixel-cell bg-pixel-dark text-white/40 border-2 border-white/10">D</div>

                    {/* Row 3 - Current Guess */}
                    <div className="aspect-square pixel-cell bg-primary text-white border-2 border-white animate-pulse">G</div>
                    <div className="aspect-square pixel-cell bg-primary text-white border-2 border-white animate-pulse">R</div>
                    <div className="aspect-square pixel-cell bg-primary text-white border-2 border-white animate-pulse">O</div>
                    <div className="aspect-square pixel-cell bg-pixel-sky border-2 border-white/30"></div>
                    <div className="aspect-square pixel-cell bg-pixel-sky border-2 border-white/30"></div>

                    {/* Empty Rows */}
                    {[...Array(15)].map((_, i) => (
                        <div key={i} className="aspect-square pixel-cell bg-black/40 border-2 border-white/5"></div>
                    ))}
                </div>

                {/* Legend */}
                <div className="mt-6 flex items-center justify-center gap-6 py-2 px-4 bg-black/40 border-2 border-pixel-purple/30 rounded shadow-lg">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-accent-yellow border border-white/50"></div>
                        <span className="text-[8px] font-pixel text-white uppercase">Correct</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 bg-accent-green border border-white/50"></div>
                        <span className="text-[8px] font-pixel text-white uppercase">Wrong Pos</span>
                    </div>
                </div>
            </div>

            {/* Keyboard */}
            <div className="flex-none w-full bg-pixel-dark border-t-4 border-black pb-safe pt-4 px-1 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] z-20">
                <div className="w-full max-w-lg mx-auto flex flex-col gap-2 mb-2">
                    {/* Row 1 */}
                    <div className="flex w-full gap-1 justify-center px-1">
                        {['Q', 'W', 'E'].map(key => (
                            <button key={key} className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">{key}</button>
                        ))}
                        <button className="h-12 flex-1 rounded bg-accent-green border-b-4 border-r-2 border-black/50 text-black font-pixel text-[10px] active:border-b-0 active:translate-y-1">R</button>
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">T</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">Y</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">U</button>
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">I</button>
                        <button className="h-12 flex-1 rounded bg-accent-green border-b-4 border-r-2 border-black/50 text-black font-pixel text-[10px] active:border-b-0 active:translate-y-1">O</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">P</button>
                    </div>

                    {/* Row 2 */}
                    <div className="flex w-full gap-1 justify-center px-3">
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">A</button>
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">S</button>
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">D</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">F</button>
                        <button className="h-12 flex-1 rounded bg-accent-yellow border-b-4 border-r-2 border-black/50 text-black font-pixel text-[10px] active:border-b-0 active:translate-y-1">G</button>
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">H</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">J</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">K</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">L</button>
                    </div>

                    {/* Row 3 */}
                    <div className="flex w-full gap-1 justify-center px-1">
                        <button className="h-12 px-3 rounded bg-primary border-b-4 border-r-2 border-black/50 text-white font-pixel text-[8px] uppercase active:border-b-0 active:translate-y-1">ENTER</button>
                        {['Z', 'X', 'C', 'V', 'B'].map(key => (
                            <button key={key} className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">{key}</button>
                        ))}
                        <button className="h-12 flex-1 rounded bg-gray-700 border-b-4 border-r-2 border-black/50 text-white/30 font-pixel text-[10px] cursor-not-allowed">N</button>
                        <button className="h-12 flex-1 rounded bg-pixel-purple border-b-4 border-r-2 border-black/50 text-white font-pixel text-[10px] active:border-b-0 active:translate-y-1">M</button>
                        <button className="h-12 px-3 rounded bg-pixel-sky border-b-4 border-r-2 border-black/50 text-white font-bold flex items-center justify-center active:border-b-0 active:translate-y-1">
                            <span className="material-symbols-outlined text-lg">backspace</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Floating Alert */}
            <div className="fixed top-36 left-1/2 -translate-x-1/2 w-max max-w-[90%] z-50">
                <div className="bg-black text-primary border-4 border-primary px-4 py-4 shadow-[8px_8px_0_rgba(0,0,0,0.5)] flex items-center gap-3 animate-float relative">
                    <div className="absolute -top-1 -left-1 w-2 h-2 bg-white"></div>
                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-white"></div>
                    <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-white"></div>
                    <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-white"></div>
                    <span className="material-symbols-outlined text-2xl animate-pulse">dangerous</span>
                    <div className="flex flex-col">
                        <span className="text-[10px] font-pixel text-white uppercase mb-1">System Error</span>
                        <span className="text-xs font-pixel text-primary uppercase">Entry Rejected</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
