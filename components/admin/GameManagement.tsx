"use client";

import { useEffect, useState } from "react";

interface Game {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  path: string;
  usersPlaying: number;
}

interface RoomSummary {
  roomId: string;
  turnCount: number;
  glitchPhase: number;
  status: string;
  phaseEndsAt: number | null;
  turnTeamId: string | null;
  teams: {
    teamId: string;
    hp: number;
    isAlive: boolean;
    score: number;
    isConnected: boolean;
  }[];
}

const AVAILABLE_GAMES = [
  {
    id: "battleship",
    name: "Battleship",
    description: "Classic naval combat strategy game",
    path: "/battleship",
  },
  {
    id: "wordle",
    name: "Wordle",
    description: "Guess the word ",
    path: "/wordle",
  },
];

export default function GameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [rooms, setRooms] = useState<RoomSummary[]>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState("");
  const [newRoomId, setNewRoomId] = useState("");
  const [currentPhase, setCurrentPhase] = useState<"battleship" | "wordle">("battleship");
  const [phaseLoading, setPhaseLoading] = useState(false);
  const [currentGlitchPhase, setCurrentGlitchPhase] = useState<number>(1);
  const [glitchPhaseLoading, setGlitchPhaseLoading] = useState(false);

  const GLITCH_PHASES = [
    { phase: 1, name: "Normal", desc: "Normal: Hit damages target" },
    { phase: 2, name: "Reflective Armor", desc: "Hit damages attacker" },
    { phase: 3, name: "Dual Damage", desc: "Hit damages both" },
    { phase: 4, name: "Shot Shift", desc: "Randomly shift coordinates" },
    { phase: 5, name: "Double or Nothing", desc: "2x score multiplier" },
  ];

  useEffect(() => {
    fetchGames();
    fetchRooms();
    fetchCurrentPhase();
    fetchCurrentGlitchPhase();
  }, []);

  const fetchCurrentGlitchPhase = async () => {
    try {
      const response = await fetch("/api/admin/glitch");
      if (response.ok) {
        const data = await response.json();
        setCurrentGlitchPhase(data.phase || 1);
      }
    } catch (error) {
      console.error("Error fetching glitch phase:", error);
    }
  };

  const updateGlitchPhase = async (glitchPhase: number) => {
    try {
      setGlitchPhaseLoading(true);
      const response = await fetch("/api/admin/glitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase: glitchPhase }),
      });
      if (response.ok) {
        const data = await response.json();
        setCurrentGlitchPhase(data.phase);
        setError("");
      } else {
        setError("Failed to update glitch phase");
      }
    } catch (error) {
      console.error("Error updating glitch phase:", error);
      setError("Failed to update glitch phase");
    } finally {
      setGlitchPhaseLoading(false);
    }
  };

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/games");
      if (response.ok) {
        const data = await response.json();
        setGames(data);
        setError("");
      } else {
        setGames(
          AVAILABLE_GAMES.map((game) => ({
            ...game,
            isActive: true,
            usersPlaying: 0,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching games:", error);
      setGames(
        AVAILABLE_GAMES.map((game) => ({
          ...game,
          isActive: true,
          usersPlaying: 0,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPhase = async () => {
    try {
      const response = await fetch("/api/admin/phase");
      if (response.ok) {
        const data = await response.json();
        setCurrentPhase(data.phase || "battleship");
      }
    } catch (error) {
      console.error("Error fetching phase:", error);
    }
  };

  const updatePhase = async (phase: "battleship" | "wordle") => {
    try {
      setPhaseLoading(true);
      const response = await fetch("/api/admin/phase", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });
      if (response.ok) {
        setCurrentPhase(phase);
        setError("");
      } else {
        setError("Failed to update game phase");
      }
    } catch (error) {
      console.error("Error updating phase:", error);
      setError("Failed to update game phase");
    } finally {
      setPhaseLoading(false);
    }
  };

  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await fetch("/api/admin/rooms", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data.rooms || []);
        setRoomsError("");
      } else {
        const data = await response.json().catch(() => ({}));
        setRoomsError(data?.error || "Failed to load rooms");
      }
    } catch (error) {
      console.error("Error fetching rooms:", error);
      setRoomsError("Failed to load rooms");
    } finally {
      setRoomsLoading(false);
    }
  };

  const createRoom = async () => {
    if (!newRoomId.trim()) {
      setRoomsError("Room ID is required");
      return;
    }

    try {
      const response = await fetch("/api/admin/rooms", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId: newRoomId.trim() }),
      });
      if (response.ok) {
        setNewRoomId("");
        setRoomsError("");
        await fetchRooms();
      } else {
        const data = await response.json().catch(() => ({}));
        setRoomsError(data?.error || "Failed to create room");
      }
    } catch (error) {
      console.error("Error creating room:", error);
      setRoomsError("Failed to create room");
    }
  };

  const startRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/start`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setRoomsError("");
        await fetchRooms();
      } else {
        const data = await response.json().catch(() => ({}));
        setRoomsError(data?.error || "Failed to start room");
      }
    } catch (error) {
      console.error("Error starting room:", error);
      setRoomsError("Failed to start room");
    }
  };

  const stopRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/admin/rooms/${roomId}/stop`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        setRoomsError("");
        await fetchRooms();
      } else {
        const data = await response.json().catch(() => ({}));
        setRoomsError(data?.error || "Failed to stop room");
      }
    } catch (error) {
      console.error("Error stopping room:", error);
      setRoomsError("Failed to stop room");
    }
  };

  const toggleGameStatus = async (gameId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/admin/games/${gameId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });
      if (response.ok) {
        setGames(
          games.map((g) =>
            g.id === gameId ? { ...g, isActive: !currentStatus } : g
          )
        );
        setError("");
      } else {
        setError("Failed to update game status");
      }
    } catch (error) {
      console.error("Error updating game status:", error);
      setError("Error updating game status");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-white">Loading games...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Game Phase Control */}
      <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              🎮 Game Phase Control
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Control which game is currently active for all players
            </p>
          </div>
          <div className="px-4 py-2 bg-black/40 border border-white/30 rounded-lg">
            <div className="text-xs text-white/60 uppercase tracking-wider">Current Phase</div>
            <div className="text-lg font-bold text-white capitalize">{currentPhase}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => updatePhase("battleship")}
            disabled={phaseLoading || currentPhase === "battleship"}
            className={`p-6 rounded-lg border-2 transition-all ${
              currentPhase === "battleship"
                ? "bg-blue-500/30 border-blue-400 shadow-lg shadow-blue-500/50"
                : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-blue-400/50"
            } ${phaseLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="text-4xl mb-2">⚓</div>
            <div className="text-xl font-bold mb-1">Battleship Phase</div>
            <div className="text-sm text-white/70">Teams compete in tactical naval combat</div>
            {currentPhase === "battleship" && (
              <div className="mt-3 px-3 py-1 bg-blue-500/50 rounded text-xs font-semibold uppercase">
                ✓ Active Now
              </div>
            )}
          </button>

          <button
            onClick={() => updatePhase("wordle")}
            disabled={phaseLoading || currentPhase === "wordle"}
            className={`p-6 rounded-lg border-2 transition-all ${
              currentPhase === "wordle"
                ? "bg-yellow-500/30 border-yellow-400 shadow-lg shadow-yellow-500/50"
                : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-yellow-400/50"
            } ${phaseLoading ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            <div className="text-4xl mb-2">📝</div>
            <div className="text-xl font-bold mb-1">Wordle Phase (FINAL)</div>
            <div className="text-sm text-white/70">Final word battle for the championship</div>
            {currentPhase === "wordle" && (
              <div className="mt-3 px-3 py-1 bg-yellow-500/50 rounded text-xs font-semibold uppercase">
                ✓ Active Now
              </div>
            )}
          </button>
        </div>

        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80">
          <div className="flex items-start gap-2">
            <span className="text-yellow-400">⚠️</span>
            <div>
              <strong>Note:</strong> Changing the phase will update which game players see as active. 
              Wordle is designated as the final championship phase.
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-indigo-500/20 to-violet-500/20 border-2 border-indigo-500/50 rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              ⚡ Glitch Phase Control
            </h2>
            <p className="text-white/60 text-sm mt-1">
              Control which glitch mechanic is active during battleship turns
            </p>
          </div>
          <div className="px-4 py-2 bg-black/40 border border-white/30 rounded-lg">
            <div className="text-xs text-white/60 uppercase tracking-wider">Current Glitch</div>
            <div className="text-lg font-bold text-indigo-300">Phase {currentGlitchPhase}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          {GLITCH_PHASES.map((glitch) => (
            <button
              key={glitch.phase}
              onClick={() => updateGlitchPhase(glitch.phase)}
              disabled={glitchPhaseLoading || currentGlitchPhase === glitch.phase}
              className={`p-4 rounded-lg border-2 transition-all text-center ${
                currentGlitchPhase === glitch.phase
                  ? "bg-indigo-500/30 border-indigo-400 shadow-lg shadow-indigo-500/50"
                  : "bg-white/5 border-white/20 hover:bg-white/10 hover:border-indigo-400/50"
              } ${glitchPhaseLoading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <div className="text-2xl mb-2">#{glitch.phase}</div>
              <div className="font-bold text-sm mb-1 text-white">{glitch.name}</div>
              <div className="text-xs text-white/70">{glitch.desc}</div>
              {currentGlitchPhase === glitch.phase && (
                <div className="mt-2 px-2 py-1 bg-indigo-500/50 rounded text-xs font-semibold uppercase">
                  ✓ Active
                </div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-4 p-4 bg-white/5 border border-white/10 rounded-lg text-sm text-white/80">
          <div className="flex items-start gap-2">
            <span className="text-indigo-400">ℹ️</span>
            <div>
              <strong>How Glitches Work:</strong> Admins can control which glitch is active. This affects damage calculations and mechanics for all active games until changed.
            </div>
          </div>
        </div>      </div>
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Game Management</h2>
          <p className="text-white/60">
            Total Games: {games.length} | Active: {games.filter((g) => g.isActive).length}
          </p>
        </div>
        <button
          onClick={fetchGames}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {games.map((game) => (
          <div
            key={game.id}
            className={`border rounded-lg p-6 transition-all ${
              game.isActive
                ? "bg-white/5 border-white/20"
                : "bg-red-500/5 border-red-500/30"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold">{game.name}</h3>
                <p className="text-white/60 text-sm">{game.description}</p>
              </div>
              <div
                className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                  game.isActive
                    ? "bg-green-500/20 text-green-400 border-green-500/50"
                    : "bg-red-500/20 text-red-400 border-red-500/50"
                }`}
              >
                {game.isActive ? "✓ Active" : "✗ Inactive"}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Game Path:</span>
                <code className="bg-black/40 px-2 py-1 rounded text-yellow-400 font-mono">
                  {game.path}
                </code>
              </div>
            
            </div>

          
          </div>
        ))}
      </div>

     

      <div className="bg-white/5 border border-white/20 rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold">Battleship Rooms</h3>
            <p className="text-white/60 text-sm">Create, start, and stop live rooms</p>
          </div>
          <button
            onClick={fetchRooms}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors text-sm"
          >
            🔄 Refresh Rooms
          </button>
        </div>

        <div className="flex flex-wrap gap-3">
          <input
            value={newRoomId}
            onChange={(event) => setNewRoomId(event.target.value)}
            placeholder="Room ID"
            className="px-3 py-2 rounded bg-black/40 border border-white/20 text-white text-sm"
          />
          <button
            onClick={createRoom}
            className="px-4 py-2 bg-green-500/20 text-green-300 border border-green-500/40 rounded text-sm"
          >
            Create Room
          </button>
        </div>

        {roomsError && (
          <div className="bg-red-500/20 border border-red-500 text-red-200 px-4 py-3 rounded-lg">
            {roomsError}
          </div>)}

        {roomsLoading ? (
          <div className="text-white/70">Loading rooms...</div>
        ) : rooms.length === 0 ? (
          <div className="text-white/60">No rooms available.</div>
        ) : (
          <div className="space-y-3">
            {rooms.map((room) => (
              <div
                key={room.roomId}
                className="border border-white/20 rounded-lg p-4 bg-black/30 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-sm font-semibold">Room {room.roomId}</div>
                    <div className="text-xs text-white/60">Turn {room.turnCount}/15 | {room.status}</div>
                  </div>
                  <div className="text-xs text-white/70">
                    Teams: {room.teams.length} | Active: {room.turnTeamId || "--"}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs">
                  {room.teams.map((team) => (
                    <span
                      key={team.teamId}
                      className={`px-2 py-1 border rounded ${team.isAlive ? "border-green-400/40 text-green-300" : "border-red-400/40 text-red-300"}`}
                    >
                      {team.teamId} ({team.hp} HP)
                    </span>
                  ))}
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => startRoom(room.roomId)}
                    className="px-3 py-2 text-xs bg-blue-500/20 text-blue-200 border border-blue-500/40 rounded"
                  >
                    Start
                  </button>
                  <button
                    onClick={() => stopRoom(room.roomId)}
                    className="px-3 py-2 text-xs bg-red-500/20 text-red-200 border border-red-500/40 rounded"
                  >
                    Stop
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
