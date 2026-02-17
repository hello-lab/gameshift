import Link from "next/link";

export default function Login() {
    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 pixel-bg text-white selection:bg-purple-500/30 font-display">
            {/* Background Elements */}
            <div className="absolute top-20 left-10 pixel-cloud blur-[2px] animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-40 right-20 pixel-cloud scale-150 opacity-10 blur-[4px] animate-[float_8s_ease-in-out_infinite_reverse]"></div>

            <div className="absolute top-1/4 right-10 opacity-40 animate-[float_8s_ease-in-out_infinite_reverse]">
                <div className="w-8 h-16 bg-pink-400 rotate-45 border-4 border-pink-600 shadow-[0_0_20px_rgba(236,72,153,0.5)]"></div>
            </div>

            <div className="absolute bottom-1/3 left-10 opacity-40 animate-[float_6s_ease-in-out_infinite]">
                <div className="w-10 h-10 rounded-full bg-blue-400 border-4 border-blue-600 shadow-[0_0_20px_rgba(59,130,246,0.5)] relative">
                    <div className="absolute -top-4 left-3 w-4 h-6 bg-slate-700 border-2 border-slate-900"></div>
                </div>
            </div>

            {/* Header */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-6 z-10">
                <div className="flex items-center gap-3">
                    <div className="size-10 bg-purple-900 border-2 border-purple-500 flex items-center justify-center shadow-pixel-sm">
                        <span className="material-symbols-outlined text-purple-300 text-xl">sports_esports</span>
                    </div>
                    <span className="text-sm font-pixel text-purple-200 tracking-widest uppercase" style={{ textShadow: "2px 2px 0 #000" }}>Game Verse</span>
                </div>
                <Link href="/" className="text-white/60 hover:text-white transition-colors">
                    <span className="material-symbols-outlined">close</span>
                </Link>
            </div>

            {/* Glass Card */}
            <div className="glass-card w-full max-w-[400px] p-8 relative z-10 shadow-2xl">
                {/* Corner Decors */}
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-300"></div>

                <div className="text-center mb-10">
                    <h1 className="text-2xl md:text-3xl font-pixel text-white mb-4 leading-relaxed tracking-wider" style={{ textShadow: "4px 4px 0 #4c1d95" }}>GAME VERSE</h1>
                    <p className="text-purple-200/80 text-sm font-medium tracking-wide">PLAYER LOGIN INITIALIZED</p>
                </div>

                <div className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-purple-300 ml-1 font-display">Player ID / Team</label>
                        <div className="relative group">
                            <input
                                className="pixel-input w-full h-14 px-5 text-white placeholder:text-purple-300/30 transition-all duration-200 font-medium tracking-wider"
                                placeholder="INSERT COIN OR ID"
                                type="text"
                            />
                            <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 group-focus-within:text-purple-200 transition-colors">
                                videogame_asset
                            </span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-purple-300 ml-1 font-display">Secret Key</label>
                        <div className="relative group">
                            <input
                                className="pixel-input w-full h-14 px-5 text-white placeholder:text-purple-300/30 transition-all duration-200 font-medium tracking-wider"
                                placeholder="••••••••"
                                type="password"
                            />
                            <button className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors">
                                <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                        </div>
                    </div>

                    <div className="pt-6">
                        <Link href="/battleship" className="w-full">
                            <button className="arena-btn w-full h-14 flex items-center justify-center gap-3 text-white font-pixel text-sm tracking-wide group relative overflow-hidden">
                                <span className="relative z-10">ENTER THE ARENA</span>
                                <span className="material-symbols-outlined relative z-10 animate-pulse">bolt</span>
                            </button>
                        </Link>
                    </div>

                    <div className="flex flex-col items-center gap-6 pt-4">
                        <div className="flex items-center w-full gap-4 opacity-60">
                            <div className="h-1 bg-purple-900/50 flex-1 border-b border-purple-500/30"></div>
                            <span className="text-[10px] font-bold text-purple-300 uppercase tracking-[0.2em] font-display">OR CONTINUE WITH</span>
                            <div className="h-1 bg-purple-900/50 flex-1 border-b border-purple-500/30"></div>
                        </div>

                        <button className="flex items-center gap-3 text-purple-200 hover:text-white transition-colors py-2 group bg-purple-900/40 px-6 py-3 border-2 border-purple-500/30 hover:border-purple-400 hover:bg-purple-800/60 shadow-pixel-sm">
                            <span className="material-symbols-outlined text-xl">qr_code_2</span>
                            <span className="text-xs font-bold uppercase tracking-wider font-display">Scan Quest QR</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 text-center relative z-10">
                <a className="text-xs font-bold text-purple-400 hover:text-purple-200 transition-colors uppercase tracking-wide font-pixel text-[10px]" href="#">
                    &lt; HELP & OPTIONS /&gt;
                </a>
            </div>

            <div className="h-8"></div>
        </div>
    );
}
