"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type TeamMember = {
  id: string;
  username: string;
  role: "leader" | "member";
};

type TeamPayload = {
  id: string;
  name: string;
  inviteCode: string;
  maxMembers: number;
  members: TeamMember[];
};

type ViewerPayload = {
  id: string;
  role: "leader" | "member";
};

type StatusResponse = {
  team: TeamPayload | null;
  viewer?: ViewerPayload;
};

export default function TeamRegisterPage() {
  const [status, setStatus] = useState<"loading" | "ready" | "unauth">("loading");
  const [team, setTeam] = useState<TeamPayload | null>(null);
  const [viewer, setViewer] = useState<ViewerPayload | null>(null);
  const [teamName, setTeamName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const refreshStatus = async () => {
    setError("");
    try {
      const response = await fetch("/api/team/status", { cache: "no-store" });
      if (response.status === 401) {
        setStatus("unauth");
        setTeam(null);
        setViewer(null);
        return;
      }

      const data = (await response.json()) as StatusResponse;
      setTeam(data.team ?? null);
      setViewer(data.viewer ?? null);
      setStatus("ready");
    } catch {
      setError("Unable to load team status.");
      setStatus("ready");
    }
  };

  useEffect(() => {
    refreshStatus();
  }, []);

  const handleCreate = async () => {
    setError("");
    const trimmed = teamName.trim();
    if (!trimmed) {
      setError("Team name is required.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/team/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Team creation failed.");
        return;
      }

      setTeamName("");
      await refreshStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleJoin = async () => {
    setError("");
    const trimmed = inviteCode.trim();
    if (!trimmed) {
      setError("Invite code is required.");
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/team/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteCode: trimmed }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to join the team.");
        return;
      }

      setInviteCode("");
      await refreshStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleLeave = async () => {
    setError("");
    if (!window.confirm("Leave your current team?")) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/team/leave", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to leave the team.");
        return;
      }

      await refreshStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleDisband = async () => {
    setError("");
    if (!window.confirm("Disband the team for everyone?")) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/team/disband", { method: "POST" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to disband the team.");
        return;
      }

      await refreshStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const handleKick = async (memberId: string) => {
    setError("");
    if (!window.confirm("Kick this player from the team?")) {
      return;
    }

    setIsBusy(true);
    try {
      const response = await fetch("/api/team/kick", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setError(data.error || "Unable to kick player.");
        return;
      }

      await refreshStatus();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsBusy(false);
    }
  };

  const isLeader = viewer?.role === "leader";

  return (
    <div className="relative min-h-screen px-6 py-16 text-white pixel-bg font-display">
      <div className="absolute top-16 left-10 pixel-cloud blur-[2px] animate-[float_6s_ease-in-out_infinite]"></div>
      <div className="absolute bottom-24 right-20 pixel-cloud scale-150 opacity-20 blur-[4px] animate-[float_8s_ease-in-out_infinite_reverse]"></div>

      <header className="relative z-10 flex items-center justify-between max-w-5xl mx-auto mb-12">
        <div>
          <p className="text-purple-200 text-xs tracking-[0.3em] uppercase font-pixel">Squad Ops</p>
          <h1 className="text-3xl md:text-4xl font-pixel text-white mt-2" style={{ textShadow: "4px 4px 0 #4c1d95" }}>
            TEAM REGISTRATION
          </h1>
        </div>
        <Link href="/" className="text-white/60 hover:text-white transition-colors">
          <span className="material-symbols-outlined">close</span>
        </Link>
      </header>

      <main className="relative z-10 max-w-5xl mx-auto space-y-8">
        {status === "unauth" ? (
          <div className="glass-card p-8 text-center">
            <p className="text-purple-100">Login required to register a team.</p>
            <Link href="/login" className="arena-btn inline-flex mt-6 px-6 py-3 font-pixel text-sm">
              Go to Login
            </Link>
          </div>
        ) : null}

        {status === "loading" ? (
          <div className="glass-card p-8 text-center text-purple-200">Loading team status...</div>
        ) : null}

        {status === "ready" && team ? (
          <div className="glass-card p-8 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <p className="text-xs text-purple-300 uppercase tracking-[0.3em] font-pixel">Your Team</p>
                <h2 className="text-2xl font-pixel mt-2" style={{ textShadow: "3px 3px 0 #4c1d95" }}>
                  {team.name}
                </h2>
                <p className="text-purple-200 text-sm mt-2">Invite Code: <span className="text-white font-pixel tracking-widest">{team.inviteCode}</span></p>
                <p className="text-purple-200 text-xs mt-1">Members {team.members.length}/{team.maxMembers}</p>
              </div>
              <div className="flex flex-wrap gap-3">
                {isLeader ? (
                  <button className="arena-btn px-4 py-2 text-xs font-pixel" onClick={handleDisband} disabled={isBusy}>
                    Disband Team
                  </button>
                ) : (
                  <button className="arena-btn px-4 py-2 text-xs font-pixel" onClick={handleLeave} disabled={isBusy}>
                    Leave Team
                  </button>
                )}
              </div>
            </div>

            <div className="border-t border-purple-500/30 pt-6">
              <p className="text-xs uppercase tracking-[0.3em] text-purple-300 font-pixel mb-4">Roster</p>
              <div className="space-y-3">
                {team.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between bg-purple-900/30 border border-purple-500/30 px-4 py-3">
                    <div>
                      <p className="font-pixel text-sm text-white">{member.username}</p>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-purple-300">{member.role}</p>
                    </div>
                    {isLeader && member.role !== "leader" ? (
                      <button className="text-xs uppercase tracking-widest text-pink-300 hover:text-white" onClick={() => handleKick(member.id)}>
                        Kick
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : null}

        {status === "ready" && !team ? (
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="glass-card p-8 space-y-4">
              <h2 className="text-xl font-pixel" style={{ textShadow: "3px 3px 0 #4c1d95" }}>
                Create Squad
              </h2>
              <p className="text-sm text-purple-200">Form a party of up to five players.</p>
              <input
                className="pixel-input w-full h-12 px-4 text-white placeholder:text-purple-300/40"
                placeholder="Team name"
                value={teamName}
                onChange={(event) => setTeamName(event.target.value)}
              />
              <button className="arena-btn w-full h-12 text-sm font-pixel" onClick={handleCreate} disabled={isBusy}>
                Create Team
              </button>
            </div>

            <div className="glass-card p-8 space-y-4">
              <h2 className="text-xl font-pixel" style={{ textShadow: "3px 3px 0 #4c1d95" }}>
                Join Squad
              </h2>
              <p className="text-sm text-purple-200">Enter an invite code from your leader.</p>
              <input
                className="pixel-input w-full h-12 px-4 text-white placeholder:text-purple-300/40"
                placeholder="Invite code"
                value={inviteCode}
                onChange={(event) => setInviteCode(event.target.value.toUpperCase())}
              />
              <button className="arena-btn w-full h-12 text-sm font-pixel" onClick={handleJoin} disabled={isBusy}>
                Join Team
              </button>
            </div>
          </div>
        ) : null}

        {error ? (
          <div className="glass-card p-4 border border-pink-400/40 text-pink-200 text-sm">{error}</div>
        ) : null}
      </main>
    </div>
  );
}
