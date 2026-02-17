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
    description: "Guess the word in 6 attempts",
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

  useEffect(() => {
    fetchGames();
    fetchRooms();
  }, []);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/admin/games");
      if (response.ok) {
        const data = await response.json();
        setGames(data);
        setError("");
      } else {
        // Initialize with default games if API fails
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
      // Fallback to default games
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
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Players Active:</span>
                <span className="text-white font-semibold">{game.usersPlaying}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Status:</span>
                <span className="text-white">
                  {game.isActive ? "Available" : "Under Maintenance"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => toggleGameStatus(game.id, game.isActive)}
                className={`flex-1 px-4 py-2 rounded border transition-colors text-sm font-semibold ${
                  game.isActive
                    ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30 border-yellow-500/50"
                    : "bg-green-500/20 text-green-400 hover:bg-green-500/30 border-green-500/50"
                }`}
              >
                {game.isActive ? "Take Offline" : "Go Online"}
              </button>
              <a
                href={game.path}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 px-4 py-2 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 border border-blue-500/50 rounded transition-colors text-sm font-semibold text-center"
              >
                Test Game
              </a>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-lg font-bold mb-3 text-blue-300">ℹ️ Game Management Info</h3>
        <ul className="space-y-2 text-sm text-white/80">
          <li>• <strong>Active:</strong> Users can access and play the game</li>
          <li>• <strong>Inactive:</strong> Game is under maintenance or disabled</li>
          <li>• <strong>Players Active:</strong> Current number of users playing the game</li>
          <li>• <strong>Test Game:</strong> Opens the game in a new window to test functionality</li>
        </ul>
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
          </div>
        )}

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
