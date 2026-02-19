"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { io } from "socket.io-client";

const GRID_SIZE = 10;
const REQUIRED_FLEET_CELLS = 17;
const SHIP_SIZES = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer
const SHIP_NAMES = ["Carrier", "Battleship", "Cruiser", "Submarine", "Destroyer"];
const ROW_LABELS = "ABCDEFGHIJ".split("");

function createGrid(value) {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => value)
  );
}

function canPlaceShip(grid, x, y, size, isHorizontal) {
  if (isHorizontal) {
    if (x + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (grid[y][x + i]) return false;
    }
  } else {
    if (y + size > GRID_SIZE) return false;
    for (let i = 0; i < size; i++) {
      if (grid[y + i][x]) return false;
    }
  }
  return true;
}

function placeShip(grid, x, y, size, isHorizontal, shipId) {
  const cells = [];
  if (isHorizontal) {
    for (let i = 0; i < size; i++) {
      grid[y][x + i] = shipId;
      cells.push({ x: x + i, y });
    }
  } else {
    for (let i = 0; i < size; i++) {
      grid[y + i][x] = shipId;
      cells.push({ x, y: y + i });
    }
  }
  return cells;
}

function detectShipsFromFleet(fleetGrid) {
  const visited = createGrid(false);
  const ships = [];

  function findShip(startX, startY) {
    const cells = [];
    
    // Try horizontal
    let x = startX;
    while (x < GRID_SIZE && fleetGrid[startY][x] && !visited[startY][x]) {
      cells.push({ x, y: startY });
      visited[startY][x] = true;
      x++;
    }
    
    if (cells.length > 1) {
      return cells; // Found horizontal ship
    }
    
    // Try vertical
    if (cells.length === 1) {
      visited[startY][startX] = false; // Reset
      cells.length = 0;
    }
    
    let y = startY;
    while (y < GRID_SIZE && fleetGrid[y][startX] && !visited[y][startX]) {
      cells.push({ x: startX, y });
      visited[y][startX] = true;
      y++;
    }
    
    return cells;
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (fleetGrid[y][x] && !visited[y][x]) {
        const cells = findShip(x, y);
        if (cells.length > 0) {
          ships.push({
            size: cells.length,
            cells,
          });
        }
      }
    }
  }

  return ships;
}

function validateFleetConfiguration(fleetGrid) {
  const ships = detectShipsFromFleet(fleetGrid);
  const sizes = ships.map(s => s.size).sort((a, b) => b - a);
  const expectedSizes = [...SHIP_SIZES].sort((a, b) => b - a);
  
  if (sizes.length !== expectedSizes.length) {
    return { valid: false, message: `Expected ${expectedSizes.length} ships, found ${sizes.length}.` };
  }
  
  for (let i = 0; i < sizes.length; i++) {
    if (sizes[i] !== expectedSizes[i]) {
      return { valid: false, message: `Fleet must contain ships of sizes: ${SHIP_SIZES.join(', ')}. Found: ${sizes.join(', ')}` };
    }
  }
  
  return { valid: true, message: "" };
}

function createRandomFleetGrid() {
  const grid = createGrid(false);
  
  for (let i = 0; i < SHIP_SIZES.length; i++) {
    const size = SHIP_SIZES[i];
    const shipId = `ship_${i}`;
    let placed = false;
    let attempts = 0;
    
    while (!placed && attempts < 100) {
      const x = Math.floor(Math.random() * GRID_SIZE);
      const y = Math.floor(Math.random() * GRID_SIZE);
      const isHorizontal = Math.random() < 0.5;
      
      if (canPlaceShip(grid, x, y, size, isHorizontal)) {
        placeShip(grid, x, y, size, isHorizontal, shipId);
        placed = true;
      }
      attempts++;
    }
    
    if (!placed) {
      // Retry entire grid if we can't place a ship
      return createRandomFleetGrid();
    }
  }
  
  return grid;
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
  const [teamName, setTeamName] = useState("");
  const [teamLoading, setTeamLoading] = useState(true);
  const [socket, setSocket] = useState(null);
  const [room, setRoom] = useState(null);
  const [joined, setJoined] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [eventLog, setEventLog] = useState([]);
  const [fleetGrid, setFleetGrid] = useState(() => createGrid(false));
  const [fleetPlaced, setFleetPlaced] = useState(false);
  const [fleetHits, setFleetHits] = useState(() => createGrid(false)); // Track hits on own fleet
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

  // Fetch user's team from API
  useEffect(() => {
    const fetchTeam = async () => {
      try {
        const response = await fetch("/api/team/status", { cache: "no-store" });
        if (response.status === 401) {
          setErrorMessage("You must be logged in to play.");
          setTeamLoading(false);
          return;
        }

        const data = await response.json();
        if (!data.team) {
          setErrorMessage("You must join a team before playing. Visit the Team page to create or join a team.");
          setTeamLoading(false);
          return;
        }

        setTeamId(data.team.id);
        setTeamName(data.team.name);
        teamIdRef.current = data.team.id;
        setTeamLoading(false);
      } catch (error) {
        console.error("Failed to fetch team:", error);
        setErrorMessage("Failed to load team information.");
        setTeamLoading(false);
      }
    };

    fetchTeam();
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
    if (userId) {
      return;
    }

    const fetchUserId = async () => {
      try {
        const response = await fetch("/api/users/me", { cache: "no-store" });
        if (!response.ok) {
          return;
        }

        const data = await response.json();
        if (data?.user?.sub) {
          setUserId(data.user.sub);
        }
      } catch (error) {
        console.error("Failed to fetch user id:", error);
      }
    };

    fetchUserId();
  }, [userId]);

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
      console.log("Room update:", payload);
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
        let message = `${payload.attackerName || payload.attackerId} attacked ${payload.targetName || payload.targetTeamId} at ${coordLabel}: ${describeResult(payload.result)}`;
        
        // Add ship sinking notification
        if (payload.shipSunk) {
          message += ` 🎉 SUNK ${payload.sunkShipName}! +${payload.sinkBonus} bonus`;
        }
        
        // Add damage taken notification
        if (payload.damageToAttacker > 0) {
          message += ` (attacker took ${payload.damageToAttacker} damage, -${payload.damageToAttacker} pts)`;
        }
        
        // Add score if available
        if (payload.attackerScore !== undefined) {
          message += ` [Score: ${payload.attackerScore}]`;
        }
        
        setEventLog((prev) => [message, ...prev].slice(0, 30));
      }
    });

    client.on("aiEnemyGridUpdate", (payload) => {
      if (!payload?.grid) {
        return;
      }
      setAttackGrids((prev) => ({
        ...prev,
        "AI_ENEMY": payload.grid,
      }));
    });

    client.on("phaseChange", (payload) => {
      const glitchNames = ["", "Normal", "Reflective Armor", "Dual Damage", "Shot Shift", "Double or Nothing"];
      setEventLog((prev) => [
        `Turn ${payload.turnCount}: ${glitchNames[payload.glitchPhase] || "Unknown"} glitch.`,
        ...prev,
      ].slice(0, 30));
    });

    client.on("turnChange", (payload) => {
      if (payload?.teamName) {
        setEventLog((prev) => [
          `Turn shift: ${payload.teamName} is active.`,
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

    client.on("fleetHit", (payload) => {
      // Track hits on our own fleet
      setFleetHits((prev) => {
        const next = prev.map((row) => [...row]);
        next[payload.y][payload.x] = true;
        return next;
      });
      
      const coordLabel = `${ROW_LABELS[payload.y]}${payload.x + 1}`;
      let message = `⚠️ You were hit at ${coordLabel} by ${payload.attackerName || payload.attackerId}! -${payload.damageDealt} HP`;
      if (payload.shipSunk) {
        message += ` 💥 ${payload.sunkShipName} SUNK!`;
      }
      setEventLog((prev) => [message, ...prev].slice(0, 30));
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
      next[y][x] = next[y][x] ? false : true;
      return next;
    });
  };

  const autoPlaceFleet = () => {
    if (fleetPlaced) {
      return;
    }
    const newFleetGrid = createRandomFleetGrid();
    setFleetGrid(newFleetGrid);
  };

  const handlePlaceFleet = () => {
    if (!socket || !roomId || !teamId) {
      return;
    }
    if (fleetCellCount !== REQUIRED_FLEET_CELLS) {
      setErrorMessage(`Place exactly ${REQUIRED_FLEET_CELLS} fleet cells.`);
      return;
    }

    // Validate ship configuration
    const validation = validateFleetConfiguration(fleetGrid);
    if (!validation.valid) {
      setErrorMessage(validation.message);
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
      userId,
    });
    
    // Reset flag after attack
    setIsDoubleOrNothing(false);
  };

  const selectableTargets = useMemo(() => {
    const targets = [];
    
    // Add AI enemy as first target
    if (room?.aiEnemy?.isAlive) {
      targets.push({
        teamId: "AI_ENEMY",
        displayName: "🤖 AI Enemy",
        hp: room.aiEnemy.hp,
        isAlive: room.aiEnemy.isAlive,
        isAI: true,
        sunkShips: room.aiEnemy.sunkShips || 0,
        totalShips: room.aiEnemy.totalShips || 5,
      });
    }
    
    // Add other teams
    const otherTeams = room?.teams?.filter(
      (team) => team.teamId !== teamId && team.isAlive
    ) || [];
    
    return [...targets, ...otherTeams.map(t => ({
      ...t,
      displayName: t.teamName || t.teamId,
      isAI: false,
    }))];
  }, [room, teamId]);

  // Get current player's stats
  const currentPlayer = useMemo(() => {
    const team = room?.teams?.find((t) => t.teamId === teamId);
    return {
      hp: team?.hp || 0,
      score: team?.score || 0,
      isAlive: team?.isAlive || false,
    };
  }, [room, teamId]);

  // Show loading state while fetching team
  if (teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-verse-bg p-3 md:p-4">
        <div className="text-center">
          <div className="text-xl md:text-2xl font-arcade text-verse-cyan mb-4">Loading...</div>
          <div className="text-xs md:text-sm text-verse-light">Fetching team information</div>
        </div>
      </div>
    );
  }

  // Show error if no team
  if (!teamId) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-verse-bg p-3 md:p-4">
        <div className="max-w-sm md:max-w-md text-center bg-verse-dark/90 border-4 border-verse-purple p-6 md:p-8 shadow-[8px_8px_0_#000]">
          <span className="material-symbols-outlined text-5xl md:text-6xl text-verse-pink mb-4 block">error</span>
          <h2 className="text-xl md:text-2xl font-arcade text-verse-cyan mb-4">Team Required</h2>
          <p className="text-xs md:text-sm text-verse-light mb-6">{errorMessage}</p>
          <Link 
            href="/team" 
            className="inline-block px-4 md:px-6 py-2 md:py-3 bg-verse-purple border-2 border-verse-cyan text-white font-arcade text-xs md:text-sm hover:bg-verse-cyan hover:text-verse-dark transition-colors shadow-[4px_4px_0_#000]"
          >
            Go to Team Page
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      className="overflow-hidden min-h-screen w-full flex flex-col bg-verse-bg text-verse-light font-arcade"
      style={{
        backgroundImage: `linear-gradient(to bottom, rgba(42, 27, 78, 0.9), rgba(24, 16, 45, 0.95)), url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }}
    >
      <header className="shrink-0 flex flex-col gap-2 md:gap-3 p-2 md:p-3 bg-verse-dark/90 border-b-4 border-verse-purple z-10">
        <div className="flex items-center justify-between gap-2">
          <Link href="/" className="text-verse-light hover:text-white shrink-0">
            <span className="material-symbols-outlined text-lg md:text-base">arrow_back_ios</span>
          </Link>
          <div className="flex items-center gap-1 md:gap-2 min-w-0 flex-wrap justify-center">
            <div className="px-2 py-1 bg-verse-purple border-2 border-verse-cyan flex items-center gap-1 shadow-[2px_2px_0_#000] text-xs md:text-sm">
              <span className="text-[8px] md:text-[10px] text-verse-light font-pixel uppercase hidden sm:inline">Team</span>
              <span className="text-xs md:text-sm font-pixel text-verse-cyan truncate">{teamName}</span>
            </div>
            <div className="px-2 py-1 bg-verse-bg border-2 border-verse-light flex items-center gap-1 shadow-[2px_2px_0_#000] text-xs md:text-sm">
              <span className="text-[8px] md:text-[10px] text-verse-pink font-pixel uppercase hidden sm:inline">Room</span>
              <span className="text-xs md:text-sm font-pixel text-white truncate">{roomId || "----"}</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-black/40 px-2 md:px-3 py-1 border border-verse-cyan/30">
              <div className="w-2 h-2 bg-verse-cyan animate-pulse"></div>
              <span className="text-[10px] font-arcade tracking-widest text-verse-cyan uppercase">
                {room?.status || "waiting"}
              </span>
            </div>
          </div>
          <button className="text-verse-light hover:text-white shrink-0" type="button">
            <span className="material-symbols-outlined text-lg md:text-base">grid_view</span>
          </button>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:gap-3 mt-1 px-1">
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] md:text-xs font-arcade text-verse-light">TURN</span>
              <span className="text-[10px] md:text-xs font-pixel text-verse-accent">{room?.turnCount || 0}/15</span>
            </div>
            <div className="text-xs md:text-sm font-pixel text-white">Rd {room?.turnCount || 0}</div>
          </div>
          <div className="flex flex-col gap-1">
            <div className="flex justify-between items-end mb-1">
              <span className="text-[10px] md:text-xs font-arcade text-verse-light">ACTIVE</span>
            </div>
            <div className="text-xs md:text-sm font-pixel text-verse-pink truncate">{room?.turnTeamName || "--"}</div>
          </div>
          <div className="flex flex-col gap-1 col-span-2 sm:col-span-1">
            <span className="text-[10px] md:text-xs font-arcade text-verse-light">HP/PTS</span>
            <div className="text-xs md:text-sm font-pixel text-white">
              <span className="text-verse-cyan">{currentPlayer.hp}</span>
              <span className="mx-1">/</span>
              <span className="text-verse-accent">{currentPlayer.score}</span>
            </div>
          </div>
        </div>
      </header>

      <div className="shrink-0 bg-gradient-to-r from-verse-purple to-verse-bg py-1 md:py-2 border-b-2 border-black flex items-center justify-center gap-2 md:gap-3 shadow-lg relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-white/10"></div>
        <span className="material-symbols-outlined text-verse-accent text-xs md:text-sm animate-bounce hidden sm:inline">star</span>
        <p className="text-[10px] md:text-xs font-pixel text-white uppercase tracking-widest drop-shadow-md text-center px-2">
          Turn {room?.turnCount || 0}: Glitch Zone
        </p>
        <span className="material-symbols-outlined text-verse-accent text-xs md:text-sm animate-bounce hidden sm:inline">star</span>
      </div>

      <main className="flex-1 grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-2 md:gap-4 p-2 md:p-4 overflow-hidden">
        <section className="flex flex-col gap-2 md:gap-4 min-w-0">
          <div className="flex flex-col gap-2 md:gap-3 bg-black/30 border-2 border-verse-purple/50 p-3 md:p-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              <input
                value={roomId}
                onChange={(event) => setRoomId(event.target.value.trim())}
                placeholder="Room ID"
                className="pixel-input px-3 py-2 text-xs md:text-sm text-white bg-verse-dark/80 flex-1"
              />
              <button
                type="button"
                className="btn-retro px-3 md:px-4 py-2 text-xs md:text-sm whitespace-nowrap"
                onClick={handleJoin}
                disabled={!teamId || joined}
              >
                {joined ? "Joined" : "Join Room"}
              </button>
            </div>
            {errorMessage ? (
              <div className="text-xs text-verse-pink">{errorMessage}</div>
            ) : null}
          </div>

          {!fleetPlaced ? (
            <div className="bg-black/30 border-2 border-verse-purple/50 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="text-xs md:text-sm font-pixel text-white">Fleet Placement</div>
                <div className="text-[10px] md:text-xs text-verse-light/70 whitespace-nowrap">Cells: {fleetCellCount}/{REQUIRED_FLEET_CELLS}</div>
              </div>
              <div className="flex flex-wrap gap-2 md:gap-3 mb-3">
                <button type="button" className="btn-retro-secondary px-2 md:px-3 py-2 text-xs" onClick={autoPlaceFleet}>
                  Auto Place
                </button>
                <button type="button" className="btn-retro px-2 md:px-3 py-2 text-xs" onClick={handlePlaceFleet}>
                  Lock Fleet
                </button>
              </div>
              <div className="relative w-full max-w-[280px] md:max-w-[360px] aspect-square pixel-box p-2 md:p-3 mx-auto">
                <div className="absolute top-0 left-6 md:left-8 right-2 md:right-3 h-5 md:h-6 flex justify-between items-end pb-1 text-[8px] md:text-xs text-verse-light/60 font-arcade">
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <span key={`col-${i}`}>{i + 1}</span>
                  ))}
                </div>
                <div className="absolute top-6 md:top-8 bottom-2 md:bottom-3 left-0 w-5 md:w-6 flex flex-col justify-between items-end pr-1 text-[8px] md:text-xs text-verse-light/60 font-arcade">
                  {ROW_LABELS.map((label) => (
                    <span key={`row-${label}`}>{label}</span>
                  ))}
                </div>
                <div className="ml-5 md:ml-6 mt-5 md:mt-6 w-[calc(100%-1.25rem)] md:w-[calc(100%-1.5rem)] h-[calc(100%-1.25rem)] md:h-[calc(100%-1.5rem)] grid grid-cols-10 grid-rows-10 gap-[0.5px] bg-verse-dark border-2 border-verse-purple/50">
                  {fleetGrid.map((row, y) =>
                    row.map((cell, x) => (
                      <button
                        type="button"
                        key={`fleet-${x}-${y}`}
                        className={`grid-cell ${cell ? "bg-verse-cyan/30" : ""}`}
                        onClick={() => toggleFleetCell(x, y)}
                      >
                        {cell ? <div className="w-1.5 h-1.5 bg-verse-cyan"></div> : null}
                      </button>
                    ))
                  )}
                </div>
              </div>
              {room?.glitchPhase === 5 && (
                <div className="mt-3 md:mt-4 p-2 md:p-3 border border-verse-accent/50 bg-verse-purple/10">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isDoubleOrNothing}
                      onChange={(e) => setIsDoubleOrNothing(e.target.checked)}
                      className="w-3 md:w-4 h-3 md:h-4"
                    />
                    <span className="text-xs md:text-xs font-pixel text-verse-accent">Double or Nothing (2x)</span>
                  </label>
                  <div className="text-[9px] md:text-[10px] text-verse-light/60 mt-1">
                    Use caution: 2x damage if hit, 2x penalty if miss
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-black/30 border-2 border-verse-purple/50 p-3 md:p-4">
              <div className="flex items-center justify-between mb-3 gap-2">
                <div className="text-xs md:text-sm font-pixel text-white">Attack Grid</div>
                <div className={`text-xs ${isMyTurn ? "text-verse-accent" : "text-verse-light/70"}`}>
                  {isMyTurn ? "Your turn" : "Awaiting turn"}
                </div>
              </div>
              <div className="flex flex-col gap-2 mb-3">
                <span className="text-xs text-verse-light/70">Target:</span>
                <div className="flex flex-wrap gap-1">
                  {selectableTargets.length === 0 ? (
                    <span className="text-xs text-verse-pink">No targets available</span>
                  ) : (
                    selectableTargets.map((target) => (
                      <button
                        key={target.teamId}
                        type="button"
                        className={`px-2 py-1 text-[9px] md:text-[10px] border transition-colors ${
                          selectedTargetId === target.teamId
                            ? "border-verse-accent text-verse-accent bg-verse-accent/20"
                            : "border-verse-light/40 text-verse-light/70 hover:border-verse-accent/50"
                        } ${target.isAI ? "bg-purple-500/10" : ""}`}
                        onClick={() => setSelectedTargetId(target.teamId)}
                      >
                        <div>{target.displayName}</div>
                        <div className="text-[8px] opacity-70">HP: {target.hp}</div>
                        {target.isAI && target.sunkShips > 0 && (
                          <div className="text-[8px] text-red-400">{target.totalShips - target.sunkShips}/{target.totalShips}</div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>
              <div className="relative w-full max-w-[280px] md:max-w-[360px] aspect-square pixel-box p-2 md:p-3 mx-auto">
                <div className="absolute top-0 left-6 md:left-8 right-2 md:right-3 h-5 md:h-6 flex justify-between items-end pb-1 text-[8px] md:text-xs text-verse-light/60 font-arcade">
                  {Array.from({ length: GRID_SIZE }, (_, i) => (
                    <span key={`atk-col-${i}`}>{i + 1}</span>
                  ))}
                </div>
                <div className="absolute top-6 md:top-8 bottom-2 md:bottom-3 left-0 w-5 md:w-6 flex flex-col justify-between items-end pr-1 text-[8px] md:text-xs text-verse-light/60 font-arcade">
                  {ROW_LABELS.map((label) => (
                    <span key={`atk-row-${label}`}>{label}</span>
                  ))}
                </div>
                <div className="ml-5 md:ml-6 mt-5 md:mt-6 w-[calc(100%-1.25rem)] md:w-[calc(100%-1.5rem)] h-[calc(100%-1.25rem)] md:h-[calc(100%-1.5rem)] grid grid-cols-10 grid-rows-10 gap-[0.5px] bg-verse-dark border-2 border-verse-purple/50">
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

        <aside className="flex flex-col gap-2 md:gap-4 min-h-0">
          {/* AI Enemy Status */}
          {room?.aiEnemy && (
            <div className="bg-gradient-to-br from-purple-900/40 to-purple-700/20 border-2 border-purple-500/50 p-3 md:p-4">
              <div className="text-xs md:text-sm font-pixel text-purple-300 mb-2 flex items-center gap-2">
                🤖 AI Enemy
              </div>
              <div className="space-y-2 text-[10px] md:text-xs">
                <div className="flex justify-between">
                  <span className="text-verse-light/70">Health:</span>
                  <span className={room.aiEnemy.hp > 10 ? "text-verse-cyan" : "text-verse-pink"}>
                    {room.aiEnemy.hp} / 17 HP
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-verse-light/70">Ships:</span>
                  <span className="text-verse-light">
                    {room.aiEnemy.totalShips - room.aiEnemy.sunkShips} / {room.aiEnemy.totalShips}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-verse-light/70">Status:</span>
                  <span className={room.aiEnemy.isAlive ? "text-green-400" : "text-red-400"}>
                    {room.aiEnemy.isAlive ? "🎯 Active" : "☠️ Defeated"}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Scoring Rules */}
          <div className="bg-black/30 border-2 border-verse-cyan/50 p-3 md:p-4">
            <div className="text-xs md:text-sm font-pixel text-verse-cyan mb-2">Scoring Rules</div>
            <div className="text-[9px] md:text-xs text-verse-light/70 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-green-400">+1</span>
                <span>Hit</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-400">+5</span>
                <span>Sink ship</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-400">-1</span>
                <span>Damage taken</span>
              </div>
              <div className="mt-2 pt-2 border-t border-verse-light/20 text-[8px] md:text-[9px] space-y-0.5">
                <div>🎯 Target AI or teams</div>
                <div>⚠️ Glitches change every 3 turns</div>
                <div>🏁 Turn 15 or AI defeated</div>
              </div>
            </div>
          </div>

          <div className="bg-black/30 border-2 border-verse-purple/50 p-3 md:p-4">
            <div className="text-xs md:text-sm font-pixel text-white mb-2">Team Status</div>
            <div className="space-y-1 text-[9px] md:text-xs max-h-32 md:max-h-40 overflow-y-auto">
              {(room?.teams || []).map((team) => (
                <div
                  key={team.teamId}
                  className={`flex items-center justify-between gap-2 border px-2 py-1 text-[8px] md:text-[9px] ${team.isAlive ? "border-verse-light/30" : "border-verse-pink/40"}`}
                >
                  <span className={`truncate ${team.teamId === teamId ? "text-verse-accent font-bold" : "text-verse-light"}`}>
                    {team.teamName || team.teamId}
                  </span>
                  <div className="flex items-center gap-1 whitespace-nowrap">
                    <span className="text-verse-light/80">{team.hp}HP</span>
                    <span className="text-verse-cyan/80">{team.score}Pt</span>
                    <span className={team.isAlive ? "text-verse-cyan" : "text-verse-pink"}>
                      {team.isAlive ? "✔" : "☠"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/30 border-2 border-verse-purple/50 p-3 md:p-4 flex-1 min-h-0">
            <div className="text-xs md:text-sm font-pixel text-white mb-2">Status Feed</div>
            <div className="text-[8px] md:text-xs text-verse-light/70 space-y-1 max-h-40 md:max-h-48 overflow-y-auto">
              {eventLog.length === 0 ? (
                <div className="text-verse-light/40">No events yet.</div>
              ) : (
                eventLog.map((entry, index) => (
                  <div key={`log-${index}`} className="flex gap-1">
                    <span className="text-verse-light/40 shrink-0">&gt;</span>
                    <span className="break-words">{entry}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </aside>
      </main>

      {gameRankings && gameRankings.length > 0 && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-3 md:p-4">
          <div className="bg-verse-dark border-4 border-verse-purple max-w-sm md:max-w-md w-full max-h-[90vh] flex flex-col">
            <div className="bg-gradient-to-r from-verse-purple to-verse-bg p-3 md:p-4 border-b-2 border-verse-purple flex items-center justify-center gap-2 shrink-0">
              <span className="material-symbols-outlined text-verse-accent text-lg md:text-xl">trophy</span>
              <h2 className="text-base md:text-lg font-pixel text-white uppercase tracking-widest">Rankings</h2>
              <span className="material-symbols-outlined text-verse-accent text-lg md:text-xl">trophy</span>
            </div>
            <div className="p-3 md:p-4 space-y-2 md:space-y-3 overflow-y-auto flex-1">
              {gameRankings.map((ranking) => (
                <div
                  key={ranking.teamId}
                  className={`border-2 p-2 md:p-3 flex items-center justify-between gap-2 text-xs md:text-sm ${
                    ranking.rank === 1
                      ? "border-verse-accent bg-verse-accent/10"
                      : ranking.rank === 2
                        ? "border-verse-cyan/50 bg-verse-cyan/5"
                        : "border-verse-light/30 bg-verse-light/5"
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3 min-w-0">
                    <div className="text-verse-accent font-pixel text-lg md:text-xl w-6 md:w-8 text-center shrink-0">#{ranking.rank}</div>
                    <div className="flex flex-col min-w-0">
                      <span className="font-pixel text-verse-accent truncate">{ranking.teamName || ranking.teamId}</span>
                      <span className="text-[8px] md:text-[10px] text-verse-light/70 truncate">
                        HP: {ranking.hp} | Pts: {ranking.score}
                      </span>
                    </div>
                  </div>
                  <div className={`font-pixel text-xs md:text-sm whitespace-nowrap ${ranking.isAlive ? "text-verse-cyan" : "text-verse-pink"}`}>
                    {ranking.isAlive ? "Alive" : "KO"}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t-2 border-verse-purple p-3 md:p-4 shrink-0">
              <button
                onClick={() => setGameRankings(null)}
                className="btn-retro w-full py-2 text-xs md:text-sm"
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
