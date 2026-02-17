import type { Metadata } from "next";
import { Press_Start_2P, VT323, Space_Grotesk } from "next/font/google";
import "./globals.css";

const pressStart2P = Press_Start_2P({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-pixel",
});

const vt323 = VT323({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-retro",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "Game Verse Landing Page",
  description: "Enter the pixel realm",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
      </head>
      <body
        className={`${pressStart2P.variable} ${vt323.variable} ${spaceGrotesk.variable} antialiased bg-verse-dark text-white font-pixel pb-28`}
      >
        <div className="min-h-screen flex flex-col">
          {children}
        </div>
        <nav className="fixed bottom-0 left-0 right-0 flex gap-2 border-t-4 border-verse-purple bg-verse-dark px-4 pb-6 pt-3 z-30 shadow-2xl">
          <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-accent group" href="/battleship">
            <div className="w-10 h-8 flex items-center justify-center bg-verse-accent/10 rounded border-2 border-transparent group-hover:border-verse-accent transition-all">
              <span className="material-symbols-outlined text-2xl">radar</span>
            </div>
            <p className="text-[10px] font-pixel mt-1">RADAR</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-light/50 group hover:text-white transition-colors" href="/wordle">
            <div className="w-10 h-8 flex items-center justify-center bg-white/5 rounded border-2 border-transparent group-hover:border-white transition-all">
              <span className="material-symbols-outlined text-2xl">abc</span>
            </div>
            <p className="text-[10px] font-pixel mt-1">WORDLE</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-light/50 group hover:text-white transition-colors" href="/team">
            <div className="w-10 h-8 flex items-center justify-center bg-white/5 rounded border-2 border-transparent group-hover:border-white transition-all">
              <span className="material-symbols-outlined text-2xl">groups</span>
            </div>
            <p className="text-[10px] font-pixel mt-1">PARTY</p>
          </a>
          <a className="flex flex-1 flex-col items-center justify-center gap-1 text-verse-light/50 group hover:text-white transition-colors" href="/login">
            <div className="w-10 h-8 flex items-center justify-center bg-white/5 rounded border-2 border-transparent group-hover:border-white transition-all">
              <span className="material-symbols-outlined text-2xl">account_circle</span>
            </div>
            <p className="text-[10px] font-pixel mt-1">PROFILE</p>
          </a>
        </nav>
      </body>
    </html>
  );
}
