"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type UserProfile = {
  sub: string;
  email: string;
  username: string;
};

type UserStats = {
  email: string;
  username: string;
  score: number;
  createdAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/users/me", {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setStats(data.stats);
        setLoading(false);
      } else if (response.status === 401) {
        router.push("/login");
      } else {
        setError("Failed to load profile");
        setLoading(false);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      setError("Failed to load profile");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/logout", {
        method: "POST",
        credentials: "include",
      });
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-verse-bg text-verse-light">
        <div className="text-2xl font-pixel">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const createdDate = stats?.createdAt
    ? new Date(stats.createdAt).toLocaleDateString()
    : "Unknown";

  return (
    <div
      className="overflow-hidden min-h-screen w-full flex flex-col bg-verse-bg text-verse-light font-arcade"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(42, 27, 78, 0.9), rgba(24, 16, 45, 0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <header className="shrink-0 flex items-center justify-between p-4 bg-verse-dark/90 border-b-4 border-verse-purple">
        <Link href="/" className="text-verse-light hover:text-white">
          <span className="material-symbols-outlined">arrow_back_ios</span>
        </Link>
        <h1 className="text-2xl font-pixel text-verse-accent">PLAYER PROFILE</h1>
        <div className="w-6"></div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md space-y-4">
          {/* Profile Card */}
          <div className="bg-black/40 border-4 border-verse-purple p-6">
            <div className="text-center mb-6">
              <div className="inline-block p-4 bg-verse-purple/20 border-2 border-verse-purple rounded-full mb-4">
                <span className="material-symbols-outlined text-4xl text-verse-accent">account_circle</span>
              </div>
              <h2 className="text-2xl font-pixel text-verse-accent">{user.username}</h2>
              <p className="text-xs text-verse-light/70 mt-1">{user.email}</p>
            </div>

            {error && (
              <div className="bg-verse-pink/10 border border-verse-pink p-3 mb-4 rounded text-xs text-verse-pink">
                {error}
              </div>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-verse-purple/10 border-2 border-verse-purple/50 p-3 text-center">
                <div className="text-xs text-verse-light/70 font-arcade mb-1">TOTAL SCORE</div>
                <div className="text-2xl font-pixel text-verse-accent">{stats?.score || 0}</div>
              </div>

              <div className="bg-verse-cyan/10 border-2 border-verse-cyan/50 p-3 text-center">
                <div className="text-xs text-verse-light/70 font-arcade mb-1">MEMBER SINCE</div>
                <div className="text-sm font-pixel text-verse-cyan">{createdDate}</div>
              </div>
            </div>

            {/* Account Info */}
            <div className="bg-black/30 border-2 border-verse-light/20 p-4 mb-6 space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-verse-light/70">Account ID:</span>
                <span className="text-verse-accent font-pixel">{user.sub.slice(0, 12)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-verse-light/70">Email:</span>
                <span className="text-verse-light/90 font-pixel truncate">{user.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-verse-light/70">Member Since:</span>
                <span className="text-verse-light/90 font-pixel">{createdDate}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Link
                href="/battleship"
                className="block text-center py-2 px-4 bg-gradient-to-r from-verse-purple to-verse-accent text-black font-pixel text-sm uppercase tracking-widest hover:shadow-lg transition-all border-2 border-verse-accent"
              >
                Play Battleship
              </Link>
              <button
                onClick={handleLogout}
                className="w-full py-2 px-4 bg-verse-pink/20 border-2 border-verse-pink text-verse-pink font-pixel text-sm uppercase tracking-widest hover:bg-verse-pink/30 transition-all"
              >
                Logout
              </button>
            </div>
          </div>

          {/* Footer Info */}
          <div className="text-center text-xs text-verse-light/50 space-y-1">
            <p>🎮 Welcome to GameShift</p>
            <p>Earn points by playing and competing</p>
          </div>
        </div>
      </main>
    </div>
  );
}
