import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-x-hidden bg-[linear-gradient(to_bottom,#1a0b2e_0%,#4a1c6e_100%)]">
      {/* Stars Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="star top-[10%] left-[15%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "0s" }}></div>
        <div className="star top-[20%] right-[25%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "1s" }}></div>
        <div className="star top-[5%] right-[10%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "2s" }}></div>
        <div className="star top-[40%] left-[5%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "0.5s" }}></div>
        <div className="star top-[60%] right-[15%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "1.5s" }}></div>
        <div className="star bottom-[20%] left-[20%] animate-[twinkle_3s_infinite]" style={{ animationDelay: "2.5s" }}></div>
      </div>

      {/* Background Glows */}
      <div className="fixed top-[15%] -left-10 w-32 h-12 bg-white/10 rounded-full blur-xl z-0"></div>
      <div className="fixed top-[25%] -right-10 w-48 h-16 bg-verse-light/20 rounded-full blur-xl z-0"></div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 pt-8 pb-4 relative z-20">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-retro-gold text-2xl">videogame_asset</span>
          <span className="text-sm md:text-base tracking-widest text-white pixel-text-shadow">VERSE</span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-black/40 border-2 border-retro-gold/50">
            <span className="w-2 h-2 bg-red-500 animate-pulse"></span>
            <span className="text-[8px] md:text-[10px] uppercase text-retro-gold tracking-widest font-retro text-lg">LIVE EVENT</span>
          </div>
          <button className="material-symbols-outlined text-white hover:text-retro-gold transition-colors">menu</button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 py-10">
        {/* Floating Icons */}
        <div className="absolute top-[15%] left-[5%] text-4xl animate-[float_4s_ease-in-out_infinite] opacity-80" title="Key">🗝️</div>
        <div className="absolute top-[20%] right-[8%] text-3xl animate-[float_4s_ease-in-out_2s_infinite] opacity-80" title="Potion">🧪</div>
        <div className="absolute bottom-[25%] left-[8%] text-3xl animate-[float_4s_ease-in-out_2s_infinite] opacity-80" title="Chest">💎</div>
        <div className="absolute bottom-[30%] right-[5%] text-4xl animate-[float_4s_ease-in-out_infinite] opacity-80" title="Crystal">🔮</div>

        {/* Hero Section */}
        <div className="relative mb-12 transform scale-100 md:scale-110">
          <div className="bg-verse-light/20 p-2 rounded-lg backdrop-blur-sm border-4 border-white pixel-border shadow-[0_0_50px_rgba(157,78,221,0.5)]">
            <div className="bg-verse-purple/80 p-8 md:p-12 border-4 border-verse-dark flex flex-col items-center justify-center gap-4 min-w-[280px]">
              <div className="w-24 h-24 mb-2 relative">
                <div className="absolute inset-0 bg-retro-gold/20 blur-xl rounded-full"></div>
                <Image
                  className="object-contain relative z-10 animate-[float_4s_ease-in-out_infinite]"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCEJ9SWyrhKOF6tdhacz7r2a_9REVm5wF42Wq2AsHSGPrkLfE9A6-qn_DFM2q00rvIW7YWAPHY_C4YfR-cokiV-Oi_FTsxP3UJXYMbgkCod-XEMR4kt7E4iX5z6R8f8TGTQsMw_pa9KobdxKStVNGcWkxXU5JhP2LJOVDKb33J8HX1u3ewbD35HAF2WVmcsfC3tlNDwtu3DcZpxlwHpqbcNl17UAZZdtjaQoE7EvTMi-qg4J-r4xdGCYX6uUCHEk-ggiAl6-8h_yeW6"
                  alt="Pixel art treasure chest or game logo"
                  width={96}
                  height={96}
                  style={{ imageRendering: "pixelated" }}
                />
              </div>
              <div className="text-center space-y-2">
                <h1 className="text-3xl md:text-4xl text-white pixel-text-shadow leading-tight mb-2">
                  GAME<br />VERSE
                </h1>
                <div className="h-1 w-full bg-gradient-to-r from-transparent via-retro-gold to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-white/80 font-retro text-xl max-w-xs mb-8 leading-relaxed tracking-wide text-shadow-sm">
          Enter the pixel realm. Collect artifacts, unlock levels, and claim the ultimate treasure.
        </p>

        {/* Stats */}
        <div className="w-full max-w-sm bg-black/40 border-2 border-white/20 p-4 mb-10 backdrop-blur-sm">
          <div className="flex justify-between items-center text-center">
            <div>
              <div className="text-[8px] text-retro-gold mb-1 font-sans uppercase tracking-widest">LOOT POOL</div>
              <div className="text-lg text-retro-gold font-retro tracking-widest">$120K</div>
            </div>
            <div className="w-0.5 h-8 bg-white/10"></div>
            <div>
              <div className="text-[8px] text-retro-blue mb-1 font-sans uppercase tracking-widest">PLAYERS</div>
              <div className="text-lg text-white font-retro tracking-widest">14.2K</div>
            </div>
            <div className="w-0.5 h-8 bg-white/10"></div>
            <div>
              <div className="text-[8px] text-accent-pink mb-1 font-sans uppercase tracking-widest">TIME LEFT</div>
              <div className="text-lg text-accent-pink font-retro tracking-widest">04:22</div>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="w-full max-w-sm flex flex-col gap-4 mb-24">
          <Link href="/login" className="w-full py-4 bg-retro-blue text-white text-sm uppercase tracking-widest pixel-btn hover:bg-retro-blue/90 transition-all border-2 border-white/20 text-center">
            Start Game
          </Link>
          <button className="w-full py-4 bg-verse-purple/60 backdrop-blur-md text-white text-sm uppercase tracking-widest pixel-btn hover:bg-verse-purple/80 transition-all border-2 border-white/20">
            High Scores
          </button>
        </div>
      </main>

      {/* Navigation */}
      <nav className="fixed bottom-4 left-4 right-4 bg-verse-dark/90 border-2 border-white/20 rounded-xl px-2 py-3 z-30 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-around">
          <a className="flex flex-col items-center gap-1 text-retro-gold" href="#">
            <span className="material-symbols-outlined text-2xl">cottage</span>
            <span className="text-[8px] font-sans uppercase tracking-wider">Base</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" href="#">
            <span className="material-symbols-outlined text-2xl">sports_esports</span>
            <span className="text-[8px] font-sans uppercase tracking-wider">Quests</span>
          </a>
          <div className="relative -top-8">
            <button className="bg-gradient-to-b from-retro-blue to-blue-700 w-14 h-14 rounded-full border-4 border-verse-dark shadow-lg flex items-center justify-center text-white hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-3xl">play_arrow</span>
            </button>
          </div>
          <a className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" href="#">
            <span className="material-symbols-outlined text-2xl">leaderboard</span>
            <span className="text-[8px] font-sans uppercase tracking-wider">Rank</span>
          </a>
          <a className="flex flex-col items-center gap-1 text-white/40 hover:text-white transition-colors" href="#">
            <span className="material-symbols-outlined text-2xl">account_circle</span>
            <span className="text-[8px] font-sans uppercase tracking-wider">Hero</span>
          </a>
        </div>
      </nav>

      {/* Footer Gradient */}
      <div className="fixed bottom-0 left-0 right-0 h-32 opacity-30 pointer-events-none -z-10 bg-repeat-x" style={{ backgroundImage: "linear-gradient(to top, #2a0a40 0%, transparent 100%)" }}></div>
    </div>
  );
}
