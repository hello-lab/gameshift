"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { io } from "socket.io-client";

const GRID_SIZE = 10;
const REQUIRED_FLEET_CELLS = 17;
const ROW_LABELS = "ABCDEFGHIJ".split("");

function createGrid(value) {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => value)
  );
}

function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

function describeResult(result) {
  switch (result) {
    case "hit":
      return "Direct hit";
    case "miss":
      return "Missed";
    case "hazard-self":
      return "Hazard backfire";
    case "hazard-target":
      return "Hazard strike";
    case "hazard-miss":
      return "Hazard fizzled";
    default:
      return "Resolved";
  }
}

export default function GamePage() {
  const searchParams = useSearchParams();
  const [roomId, setRoomId] = useState(searchParams.get("room") || "");
  const [teamId, setTeamId] = useState("");
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventLog, setEventLog] = useState([]);
  const [fleetGrid, setFleetGrid] = useState(() => createGrid(false));
  const [fleetPlaced, setFleetPlaced] = useState(false);
  const [attackGrids, setAttackGrids] = useState({});
  const [selectedTargetId, setSelectedTargetId] = useState("");
  const [now, setNow] = useState(Date.now());
  const [isDoubleOrNothing, setIsDoubleOrNothing] = useState(false);
  const [userId, setUserId] = useState(null);
  const [gameRankings, setGameRankings] = useState(null);
  const teamIdRef = useRef("");
  const selectedTargetRef = useRef("");

  const fleetCellCount = useMemo(() => {
    let count = 0;
    fleetGrid.forEach((row) => {
      row.forEach((cell) => {
        if (cell) {
          count += 1;
        }
      });
    });
    return count;
  }, [fleetGrid]);

  const currentAttackGrid = useMemo(() => {
    if (!selectedTargetId) {
      return createGrid("unknown");
    }
    return attackGrids[selectedTargetId] || createGrid("unknown");
  }, [attackGrids, selectedTargetId]);

  const isMyTurn = room?.turnTeamId === teamId;
  const phaseEndsAt = room?.phaseEndsAt || 0;
  const phaseTimer = formatTime(phaseEndsAt - now);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTeamId = window.localStorage.getItem("gs_team_id");
    if (storedTeamId) {
      setTeamId(storedTeamId);
      teamIdRef.current = storedTeamId;
      return;
    }

    const newTeamId = window.crypto?.randomUUID?.() || `team-${Math.random().toString(16).slice(2, 10)}`;
    window.localStorage.setItem("gs_team_id", newTeamId);
    setTeamId(newTeamId);
    teamIdRef.current = newTeamId;
  }, []);

  useEffect(() => {
    // Extract userId from JWT cookie (gs_session)
    if (typeof document !== "undefined") {
      const cookieValue = document.cookie
        .split("; ")
        .find((row) => row.startsWith("gs_session="))
        ?.split("=")[1];

      if (cookieValue) {
        try {
          // JWT is split by dots: header.payload.signature
          const payload = cookieValue.split(".")[1];
          if (payload) {
            // Add padding if needed
            const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
            const decoded = JSON.parse(atob(padded));
            setUserId(decoded.sub || null);
          }
        } catch (error) {
          console.error("Failed to decode JWT:", error);
        }
      }
    }
  }, []);

  useEffect(() => {
    teamIdRef.current = teamId;
  }, [teamId]);

  useEffect(() => {
    selectedTargetRef.current = selectedTargetId;
  }, [selectedTargetId]);

  useEffect(() => {
    const client = io();
    setSocket(client);

    client.on("roomUpdate", (payload) => {
      setRoom(payload);
      if (!selectedTargetRef.current && payload?.teams) {
        const firstEnemy = payload.teams.find(
          (team) => team.teamId !== teamIdRef.current && team.isAlive
        );
        if (firstEnemy) {
          setSelectedTargetId(firstEnemy.teamId);
        }
      }
    });

    client.on("attackResult", (payload) => {
      if (payload.attackGrid && payload.targetTeamId) {
        setAttackGrids((prev) => ({
          ...prev,
          [payload.targetTeamId]: payload.attackGrid,
        }));
      }

      const shouldLog = payload.attackGrid || payload.attackerId !== teamIdRef.current;
      if (shouldLog) {
        const coordLabel = `${ROW_LABELS[payload.y]}${payload.x + 1}`;
        const summary = `${payload.attackerId} attacked ${payload.targetTeamId} at ${coordLabel}: ${describeResult(payload.result)}`;
        setEventLog((prev) => [summary, ...prev].slice(0, 30));
      }
    });

    client.on("phaseChange", (payload) => {
      const glitchNames = ["", "Normal", "Reflective Armor", "Dual Damage", "Shot Shift", "Double or Nothing"];
      setEventLog((prev) => [
        `Turn ${payload.turnCount}: ${glitchNames[payload.glitchPhase] || "Unknown"} glitch.`,
        ...prev,
      ].slice(0, 30));
    });

    client.on("turnChange", (payload) => {
      if (payload?.teamId) {
        setEventLog((prev) => [
          `Turn shift: ${payload.teamId} is active.`,
          ...prev,
        ].slice(0, 30));
      }
    });

    client.on("gameOver", (payload) => {
      setEventLog((prev) => [
        `Game over: ${payload.reason}.`,
        ...prev,
      ].slice(0, 30));
      setGameRankings(payload.rankings || []);
    });

    client.on("errorMessage", (payload) => {
      setErrorMessage(payload.message);
      setEventLog((prev) => [payload.message, ...prev].slice(0, 30));
    });

    return () => {
      client.disconnect();
    };
  }, []);

  useEffect(() => {
    if (room?.status === "active") {
      setFleetPlaced(true);
    }
  }, [room?.status]);

  const handleJoin = () => {
    if (!socket || !roomId || !teamId) {
      setErrorMessage("Provide a room ID before joining.");
      return;
    }

    socket.emit("joinRoom", { roomId, teamId, userId });
    setJoined(true);
    setErrorMessage("");
    setEventLog((prev) => [`Joined room ${roomId}.`, ...prev].slice(0, 30));
  };

  const toggleFleetCell = (x, y) => {
    if (fleetPlaced) {
      return;
    }
    setFleetGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[y][x] = !next[y][x];
      return next;
    });
  };

  const autoPlaceFleet = () => {
    if (fleetPlaced) {
      return;
    }
    const next = createGrid(false);
    let placed = 0;
    while (placed < REQUIRED_FLEET_CELLS) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      if (!next[y][x]) {
        next[y][x] = true;
        placed += 1;
      }
    }
    setFleetGrid(next);
  };

  const handlePlaceFleet = () => {
    if (!socket || !roomId || !teamId) {
      return;
    }
    if (fleetCellCount !== REQUIRED_FLEET_CELLS) {
      setErrorMessage(`Place exactly ${REQUIRED_FLEET_CELLS} fleet cells.`);
      return;
    }

    socket.emit("placeFleet", { roomId, teamId, fleetGrid });
    setFleetPlaced(true);
    setErrorMessage("");
    setEventLog((prev) => ["Fleet locked in.", ...prev].slice(0, 30));
  };

  const handleAttack = (x, y) => {
    if (!socket || !roomId || !teamId || !selectedTargetId) {
      return;
    }
    if (!isMyTurn) {
      setErrorMessage("Wait for your turn.");
      return;
    }
    if (currentAttackGrid[y][x] !== "unknown") {
      return;
    }

    socket.emit("attack", {
      roomId,
      attackerId: teamId,
      targetTeamId: selectedTargetId,
      x,
      y,
      isDoubleOrNothing,
    });
    
    // Reset flag after attack
    setIsDoubleOrNothing(false);
  };

  const selectableTargets = room?.teams?.filter(
    (team) => team.teamId !== teamId && team.isAlive
  ) || [];

  return (
    <div
      className="overflow-hidden min-h-screen w-full flex flex-col bg-verse-bg text-verse-light font-arcade"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(42, 27, 78, 0.9), rgba(24, 16, 45, 0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <header className="shrink-0 flex flex-col gap-3 p-3 bg-verse-dark/90 border-b-4 border-verse-purple z-10">
        <div className="flex items-center justify-between">
          <Link href="/" className="text-verse-light hover:text-white">
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </Link>
          <div className="flex items-center gap-4">
            <div className="px-2 py-1 bg-verse-bg border-2 border-verse-light flex items-center gap-2 shadow-[2px_2px_0_#000]">
              <span className="text-[10px] text-verse-pink font-pixel uppercase">Room</span>
              <span className="text-sm font-pixel text-white">{roomId || "----"}</span>
            </div>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 border border-verse-cyan/30 rounded-none">
              <div className="w-2 h-2 bg-verse-cyan animate-pulse"></div>
              <span className="text-xs font-arcade tracking-widest text-verse-cyan uppercase">
                {room?.status || "waiting"}
              </span>
            </div>
          </div>
          <button className="text-verse-light hover:text-white" type="button">
            <span className="material-symbols-outlined">grid_view</span>
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-1 px-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-arcade text-verse-light">TURN</span>
              <span className="text-xs font-pixel text-verse-accent">{room?.turnCount || 0}/15</span>
            </div>
            <div className="text-sm font-pixel text-white">Timer: {phaseTimer}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-xs font-arcade text-verse-light">ACTIVE</span>
              <span className="text-xs font-pixel text-verse-pink">{room?.turnTeamId || "--"}</span>
            </div>
            <div className="text-sm font-pixel text-white">You: {teamId || "--"}</div>
          </div>
        </div>
      </header>

      <div className="shrink-0 bg-gradient-to-r from-verse-purple to-verse-bg py-2 border-b-2 border-black flex items-center justify-center gap-3 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10"></div>
        <span className="material-symbols-outlined text-verse-accent text-sm animate-bounce">star</span>
        <p className="text-xs font-pixel text-white uppercase tracking-widest drop-shadow-md">
          Turn {room?.turnCount || 0}: Glitch Zone Activated
        </p>
        <span className="material-symbols-outlined text-verse-accent text-sm animate-bounce">star</span>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 p-4 overflow-hidden">
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 bg-black/30 border-2 border-verse-purple/50 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value.trim())}
                placeholder="Room ID"
                className="pixel-input px-3 py-2 text-sm text-white bg-verse-dark/80"
              />
              <button
                type="button"
                className="btn-retro px-4 py-2 text-xs"
                onClick={handleJoin}
                disabled={!teamId || joined}
              >
                {joined ? "Joined" : "Join Room"}
              </button>
              <div className="text-xs text-verse-light/80">Team ID: {teamId || "--"}</div>
            </div>
            {errorMessage ? (
              <div className="text-xs text-verse-pink">{errorMessage}</div>
            ) : null}
          </div>

          {!fleetPlaced ? (
            <div className="bg-black/30 border-2 border-verse-purple/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-pixel text-white">Fleet Placement</div>
                <div className="text-xs text-verse-light/70">Cells: {fleetCellCount}/{REQUIRED_FLEET_CELLS}</div>
              </div>
              <div className="flex flex-wrap gap-3 mb-3">
                <button type="button" className="btn-retro-secondary px-3 py-2 text-xs" onClick={autoPlaceFleet}>
                  Auto Place
                </button>
                <button type="button" className="btn-retro px-3 py-2 text-xs" onClick={handlePlaceFleet}>
                  Lock Fleet
                </button>
              </div>
              <div className="relative w-full max-w-[360px] aspect-square pixel-box p-3">
                <div className="absolute top-0 left-8 right-3 h-6 flex justify-between items-end pb-1 text-xs text-verse-light/60 font-arcade">
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <span key={`col-${i}`}>{i + 1}</span>
                  ))}
                </div>
                <div className="absolute top-8 bottom-3 left-0 w-6 flex flex-col justify-between items-end pr-1 text-xs text-verse-light/60 font-arcade">
                  {ROW_LABELS.map((label) => (
                    <span key={`row-${label}`}>{label}</span>
                  ))}
                </div>
                <div className="ml-6 mt-6 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] grid grid-cols-10 grid-rows-10 gap-[1px] bg-verse-dark border-2 border-verse-purple/50">
                  {fleetGrid.map((row, y) =>
                    row.map((cell, x) => (
                      <button
                        type="button"
                        key={`fleet-${x}-${y}`}
                        className={`grid-cell ${cell ? "bg-verse-cyan/30" : ""}`}
                        onClick={() => toggleFleetCell(x, y)}
                      >
                        {cell ? <div className="w-2 h-2 bg-verse-cyan"></div> : null}
                      </button>
                    ))
                  )}
                </div>
              </div>
              {room?.glitchPhase === 5 && (
                <div className="mt-4 p-2 border border-verse-accent/50 bg-verse-purple/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDoubleOrNothing}
                      onChange={(e) => setIsDoubleOrNothing(e.target.checked)}
                      className="w-4 h-4"
                    />
                    <span className="text-xs font-pixel text-verse-accent">Double or Nothing (2x)</span>
                  </label>
                  <div className="text-[10px] text-verse-light/60 mt-1">
                    Use caution: 2x damage if hit, 2x penalty if miss
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-black/30 border-2 border-verse-purple/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="text-sm font-pixel text-white">Attack Grid</div>
                <div className={`text-xs ${isMyTurn ? "text-verse-accent" : "text-verse-light/70"}`}>
                  {isMyTurn ? "Your turn" : "Awaiting turn"}
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-3">
                <span className="text-xs text-verse-light/70">Target:</span>
                {selectableTargets.length === 0 ? (
                  <span className="text-xs text-verse-pink">No targets available</span>
                ) : (
                  selectableTargets.map((team) => (
                    <button
                      key={team.teamId}
                      type="button"
                      className={`px-2 py-1 text-[10px] border ${selectedTargetId === team.teamId ? "border-verse-accent text-verse-accent" : "border-verse-light/40 text-verse-light/70"}`}
                      onClick={() => setSelectedTargetId(team.teamId)}
                    >
                      {team.teamId}
                    </button>
                  ))
                )}
              </div>
              <div className="relative w-full max-w-[360px] aspect-square pixel-box p-3">
                <div className="absolute top-0 left-8 right-3 h-6 flex justify-between items-end pb-1 text-xs text-verse-light/60 font-arcade">
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <span key={`atk-col-${i}`}>{i + 1}</span>
                  ))}
                </div>
                <div className="absolute top-8 bottom-3 left-0 w-6 flex flex-col justify-between items-end pr-1 text-xs text-verse-light/60 font-arcade">
                  {ROW_LABELS.map((label) => (
                    <span key={`atk-row-${label}`}>{label}</span>
                  ))}
                </div>
                <div className="ml-6 mt-6 w-[calc(100%-1.5rem)] h-[calc(100%-1.5rem)] grid grid-cols-10 grid-rows-10 gap-[1px] bg-verse-dark border-2 border-verse-purple/50">
                  {currentAttackGrid.map((row, y) =>
                    row.map((cell, x) => (
                      <button
                        type="button"
                        key={`attack-${x}-${y}`}
                        className="grid-cell"
                        onClick={() => handleAttack(x, y)}
                        disabled={!isMyTurn || !selectedTargetId}
                      >
                        {cell === "hit" ? <div className="spark-hit"></div> : null}
                        {cell === "miss" ? <div className="spark-miss"></div> : null}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <div className="bg-black/30 border-2 border-verse-purple/50 p-4">
            <div className="text-sm font-pixel text-white mb-2">Team Status</div>
            <div className="space-y-2 text-xs">
              {(room?.teams || []).map((team) => (
                <div
                  key={team.teamId}
                  className={`flex items-center justify-between border px-2 py-1 ${team.isAlive ? "border-verse-light/30" : "border-verse-pink/40"}`}
                >
                  <span className={team.teamId === teamId ? "text-verse-accent" : "text-verse-light"}>
                    {team.teamId}
                  </span>
                  <span className="text-verse-light/80">HP {team.hp}</span>
                  <span className={team.isAlive ? "text-verse-cyan" : "text-verse-pink"}>
                    {team.isAlive ? "Alive" : "Dead"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/30 border-2 border-verse-purple/50 p-4">
            <div className="text-sm font-pixel text-white mb-2">Status Feed</div>
            <div className="text-xs text-verse-light/70 space-y-2 max-h-[240px] overflow-y-auto">
              {eventLog.length === 0 ? (
                <div className="text-verse-light/40">No events yet.</div>
              ) : (
                eventLog.map((entry, index) => (
                  <div key={`log-${index}`} className="flex gap-2">
                    <span className="text-verse-light/40">&gt;</span>
                    <span>{entry}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {gameRankings && gameRankings.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-verse-dark border-4 border-verse-purple max-w-md w-full">
            <div className="bg-gradient-to-r from-verse-purple to-verse-bg p-4 border-b-2 border-verse-purple flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-verse-accent">trophy</span>
              <h2 className="text-lg font-pixel text-white uppercase tracking-widest">Final Rankings</h2>
              <span className="material-symbols-outlined text-verse-accent">trophy</span>
            </div>
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto">
              {gameRankings.map((ranking) => (
                <div
                  key={ranking.teamId}
                  className={`border-2 p-3 flex items-center justify-between ${
                    ranking.rank === 1
                      ? "border-verse-accent bg-verse-accent/10"
                      : ranking.rank === 2
                        ? "border-verse-cyan/50 bg-verse-cyan/5"
                        : "border-verse-light/30 bg-verse-light/5"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="text-verse-accent font-pixel text-xl w-6 text-center">#{ranking.rank}</div>
                    <div className="flex flex-col">
                      <span className="font-pixel text-verse-accent">{ranking.teamId}</span>
                      <span className="text-xs text-verse-light/70">
                        HP: {ranking.hp} | Score: {ranking.score}
                      </span>
                    </div>
                  </div>
                  <div className={`font-pixel text-sm ${ranking.isAlive ? "text-verse-cyan" : "text-verse-pink"}`}>
                    {ranking.isAlive ? "Alive" : "KO"}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-verse-purple p-4">
              <button
                onClick={() => setGameRankings(null)}
                className="btn-retro w-full py-2 text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
