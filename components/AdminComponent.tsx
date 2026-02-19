"use client";

import { useEffect, useState } from "react";
import UserManagement from "./admin/UserManagement";
import TeamManagement from "./admin/TeamManagement";
import GameManagement from "./admin/GameManagement";
import AdminStats from "./admin/AdminStats";
import WordleAdmin from "./admin/WordleAdmin";

type Tab = "stats" | "users" | "teams" | "games" ;

export default function AdminComponent() {
  const [activeTab, setActiveTab] = useState<Tab>("stats");
  const [stats, setStats] = useState({ users: 0, teams: 0, games: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch("/api/admin/stats");
        if (response.ok) {
          const data = await response.json();
          setStats(data);
        }
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      }
    };

    fetchStats();
  }, []);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "stats", label: "Dashboard", icon: "📊" },
    { id: "users", label: "Users", icon: "👥" },
    { id: "teams", label: "Teams", icon: "🏆" },
    { id: "games", label: "Games", icon: "🎮" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0b2e] to-[#4a1c6e] text-white">
      {/* Header */}
      <header className="border-b border-white/20 sticky top-0 z-40 bg-black/40 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-white/60 text-sm mt-1">Manage all games, users, and teams</p>
            </div>
            <button
              onClick={() => {
                fetch("/api/logout", { method: "POST" });
                window.location.href = "/login";
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
            >
              Logout
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-2 overflow-x-auto pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-verse-light/40 border border-white/40 text-white"
                    : "bg-white/10 border border-white/20 text-white/70 hover:text-white hover:bg-white/20"
                }`}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "stats" && <AdminStats stats={stats} />}
        {activeTab === "users" && <UserManagement />}
        {activeTab === "teams" && <TeamManagement />}
        {activeTab === "games" && <GameManagement />}
        {activeTab === "wordle" && <WordleAdmin />}
      </main>
    </div>
  );
}
