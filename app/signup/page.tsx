"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Signup() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const response = await fetch("/api/signup", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    email,
                    username,
                    password,
                }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setError(data.error || "Signup failed");
                return;
            }

            router.push("/login");
        } catch {
            setError("Network error. Please try again.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden px-6 pixel-bg text-white selection:bg-purple-500/30 font-display">
            <div className="absolute top-20 left-10 pixel-cloud blur-[2px] animate-[float_6s_ease-in-out_infinite]"></div>
            <div className="absolute bottom-40 right-20 pixel-cloud scale-150 opacity-10 blur-[4px] animate-[float_8s_ease-in-out_infinite_reverse]"></div>

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

            <div className="glass-card w-full max-w-[420px] p-8 relative z-10 shadow-2xl">
                <div className="absolute -top-1 -left-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -bottom-1 -left-1 w-2 h-2 bg-purple-300"></div>
                <div className="absolute -bottom-1 -right-1 w-2 h-2 bg-purple-300"></div>

                <div className="text-center mb-8">
                    <h1 className="text-2xl md:text-3xl font-pixel text-white mb-4 leading-relaxed tracking-wider" style={{ textShadow: "4px 4px 0 #4c1d95" }}>PLAYER CREATE</h1>
                    <p className="text-purple-200/80 text-sm font-medium tracking-wide">REGISTER YOUR PROFILE</p>
                </div>

                <form className="space-y-5" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-purple-300 ml-1 font-display">Email</label>
                        <input
                            className="pixel-input w-full h-12 px-4 text-white placeholder:text-purple-300/30"
                            placeholder="pilot@verse.gg"
                            type="email"
                            value={email}
                            onChange={(event) => setEmail(event.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-purple-300 ml-1 font-display">Player ID</label>
                        <input
                            className="pixel-input w-full h-12 px-4 text-white placeholder:text-purple-300/30"
                            placeholder="Your handle"
                            type="text"
                            value={username}
                            onChange={(event) => setUsername(event.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-widest text-purple-300 ml-1 font-display">Secret Key</label>
                        <div className="relative group">
                            <input
                                className="pixel-input w-full h-12 px-4 text-white placeholder:text-purple-300/30"
                                placeholder="••••••••"
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(event) => setPassword(event.target.value)}
                                required
                            />
                            <button
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 hover:text-purple-200 transition-colors"
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? "Hide password" : "Show password"}
                            >
                                <span className="material-symbols-outlined text-xl">visibility</span>
                            </button>
                        </div>
                    </div>

                    {error ? (
                        <p className="text-sm text-pink-200 bg-pink-500/10 border border-pink-400/30 px-4 py-2">
                            {error}
                        </p>
                    ) : null}

                    <button
                        className="arena-btn w-full h-12 flex items-center justify-center gap-3 text-white font-pixel text-sm tracking-wide group relative overflow-hidden disabled:opacity-60"
                        type="submit"
                        disabled={isLoading}
                    >
                        <span className="relative z-10">{isLoading ? "CREATING..." : "CREATE PLAYER"}</span>
                        <span className="material-symbols-outlined relative z-10 animate-pulse">bolt</span>
                    </button>
                </form>
            </div>

            <div className="mt-8 text-center relative z-10">
                <Link className="text-xs font-bold text-purple-400 hover:text-purple-200 transition-colors uppercase tracking-wide font-pixel text-[10px]" href="/login">
                    &lt; BACK TO LOGIN /&gt;
                </Link>
            </div>

            <div className="h-8"></div>
        </div>
    );
}
