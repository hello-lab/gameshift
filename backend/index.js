const express = require("express");
const http = require("http");
const next = require("next");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");

const dev = process.env.NODE_ENV !== "production";
const nextApp = next({ dev });
const handle = nextApp.getRequestHandler();

const TURN_DURATION_MS = 3 * 60 * 1000;
const MAX_TEAMS = 5;
const MIN_TEAMS = 1;
const GRID_SIZE = 10;
const REQUIRED_FLEET_CELLS = 17;
const AI_THINK_MS = 800;
const AI_PREFIX = "AI-";
const TOTAL_TURNS = 15;

function getCurrentGlitchPhase(turnCount) {
  if (turnCount <= 3) {
    return 1;
  }
  if (turnCount <= 6) {
    return 2;
  }
  if (turnCount <= 9) {
    return 3;
  }
  if (turnCount <= 12) {
    return 4;
  }
  return 5;
}

const rooms = new Map();

function createGrid(value) {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => value)
  );
}

function generateHazardGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => Math.random() < 0.2)
  );
}

function createRandomFleetGrid() {
  const grid = createGrid(false);
  let placed = 0;
  while (placed < REQUIRED_FLEET_CELLS) {
    const x = Math.floor(Math.random() * GRID_SIZE);
    const y = Math.floor(Math.random() * GRID_SIZE);
    if (!grid[y][x]) {
      grid[y][x] = true;
      placed += 1;
    }
  }
  return grid;
}

function isBot(team) {
  return Boolean(team?.isBot);
}

function sanitizeRoom(room) {
  const turnTeamId = room.teams[room.turnIndex]?.teamId || null;
  return {
    roomId: room.roomId,
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
    status: room.status,
    turnTeamId,
    phaseEndsAt: room.phaseEndsAt,
    teams: room.teams.map((team) => ({
      teamId: team.teamId,
      hp: team.hp,
      isAlive: team.isAlive,
      score: team.score,
      isConnected: team.isConnected,
    })),
  };
}

function listRoomsSummary() {
  return Array.from(rooms.values()).map((room) => {
    const turnTeamId = room.teams[room.turnIndex]?.teamId || null;
    return {
      roomId: room.roomId,
      turnCount: room.turnCount,
      glitchPhase: room.glitchPhase,
      status: room.status,
      phaseEndsAt: room.phaseEndsAt,
      turnTeamId,
      teams: room.teams.map((team) => ({
        teamId: team.teamId,
        hp: team.hp,
        isAlive: team.isAlive,
        score: team.score,
        isConnected: team.isConnected,
      })),
    };
  });
}

function getNextTurnIndex(room, startIndex) {
  if (room.teams.length === 0) {
    return -1;
  }

  for (let offset = 0; offset < room.teams.length; offset += 1) {
    const index = (startIndex + offset) % room.teams.length;
    const team = room.teams[index];
    if (team.isAlive && team.isConnected) {
      return index;
    }
  }

  return -1;
}

function resolveAttack(room, attacker, target, x, y) {
  const isHit = Boolean(target.fleetGrid?.[y]?.[x]);
  let damageToAttacker = 0;
  let damageToTarget = 0;
  let result = isHit ? "hit" : "miss";

  switch (room.glitchPhase) {
    case 1:
      // Normal: hit damages target
      if (isHit) {
        damageToTarget = 1;
      }
      break;
    case 2:
      // Reflective Armor: hit damages attacker
      if (isHit) {
        damageToAttacker = 1;
      }
      break;
    case 3:
      // Dual Damage: hit damages both
      if (isHit) {
        damageToAttacker = 1;
        damageToTarget = 1;
      }
      break;
    case 4:
      // Shot Shift: will be handled in applyAttack
      if (isHit) {
        damageToTarget = 1;
      }
      break;
    case 5:
      // Double or Nothing: will be handled in applyAttack with multiplier
      if (isHit) {
        damageToTarget = 1;
      }
      break;
    default:
      break;
  }

  return {
    isHit,
    damageToAttacker,
    damageToTarget,
    result,
  };
}

function endGame(io, room, reason) {
  room.status = "finished";
  if (room.timerId) {
    clearInterval(room.timerId);
    room.timerId = null;
  }
  if (room.aiTimerId) {
    clearTimeout(room.aiTimerId);
    room.aiTimerId = null;
  }

  const rankings = [...room.teams]
    .sort((a, b) => {
      const aliveDiff = Number(b.isAlive) - Number(a.isAlive);
      if (aliveDiff !== 0) {
        return aliveDiff;
      }
      const hpDiff = b.hp - a.hp;
      if (hpDiff !== 0) {
        return hpDiff;
      }
      return b.score - a.score;
    })
    .map((team, index) => ({
      rank: index + 1,
      teamId: team.teamId,
      hp: team.hp,
      score: team.score,
      isAlive: team.isAlive,
      isConnected: team.isConnected,
    }));

  io.to(room.roomId).emit("gameOver", { reason, rankings });
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));

  // Award points to non-bot players based on rank
  rankings.forEach(async (ranking) => {
    const team = room.teams.find((t) => t.teamId === ranking.teamId);
    if (!team || !team.userId || isBot(team)) {
      return; // Skip bots or teams without userId
    }

    let pointsAwarded = 0;
    if (ranking.rank === 1) {
      pointsAwarded = 100; // 1st place
    } else if (ranking.rank === 2) {
      pointsAwarded = 50; // 2nd place
    } else if (ranking.rank === 3) {
      pointsAwarded = 25; // 3rd place
    } else {
      pointsAwarded = 10; // Participation
    }

    // Add bonus for final score
    pointsAwarded += ranking.score;

    try {
      const response = await fetch("http://localhost:3000/api/users/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: team.userId,
          scorePoints: pointsAwarded,
        }),
      });
      if (!response.ok) {
        console.error(`Failed to update score for ${team.teamId}:`, response.status);
      }
    } catch (error) {
      console.error(`Error updating score for ${team.teamId}:`, error);
    }
  });
}

function startPhaseTimer(io, room) {
  if (room.timerId) {
    clearInterval(room.timerId);
  }

  room.phaseEndsAt = Date.now() + TURN_DURATION_MS;
  room.timerId = setInterval(() => {
    if (room.status !== "active") {
      return;
    }

    if (Date.now() >= room.phaseEndsAt) {
      if (room.turnCount < TOTAL_TURNS) {
        room.turnCount += 1;
        room.glitchPhase = getCurrentGlitchPhase(room.turnCount);
        room.phaseEndsAt = Date.now() + TURN_DURATION_MS;
        io.to(room.roomId).emit("phaseChange", {
          turnCount: room.turnCount,
          glitchPhase: room.glitchPhase,
          phaseEndsAt: room.phaseEndsAt,
        });
      } else {
        endGame(io, room, "game-complete");
        return;
      }
    }

    io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
  }, 1000);
}

function ensureBotForRoom(room) {
  const bots = room.teams.filter((team) => isBot(team));
  const humans = room.teams.filter((team) => !isBot(team));
  if (humans.length !== 1 || bots.length > 0) {
    return null;
  }
  if (room.teams.length >= MAX_TEAMS) {
    return null;
  }

  let botId = `${AI_PREFIX}${room.roomId}`;
  let suffix = 1;
  while (room.teams.some((team) => team.teamId === botId)) {
    suffix += 1;
    botId = `${AI_PREFIX}${room.roomId}-${suffix}`;
  }

  const fleetGrid = createRandomFleetGrid();
  const bot = {
    teamId: botId,
    socketId: null,
    hp: REQUIRED_FLEET_CELLS,
    fleetGrid,
    isAlive: true,
    score: 0,
    isConnected: true,
    attackGrids: {},
    isBot: true,
  };

  room.teams.push(bot);
  return bot;
}

function canStartGame(room) {
  return (
    room.status === "waiting" &&
    room.teams.length >= MIN_TEAMS &&
    room.teams.every((team) => team.fleetGrid)
  );
}

function startGame(io, room) {
  ensureBotForRoom(room);
  room.status = "active";
  room.turnCount = 1;
  room.glitchPhase = getCurrentGlitchPhase(room.turnCount);
  room.turnIndex = getNextTurnIndex(room, 0);
  room.phaseEndsAt = Date.now() + TURN_DURATION_MS;
  startPhaseTimer(io, room);

  io.to(room.roomId).emit("phaseChange", {
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
    phaseEndsAt: room.phaseEndsAt,
  });
  io.to(room.roomId).emit("turnChange", {
    teamId: room.teams[room.turnIndex]?.teamId || null,
  });
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
  queueAiTurn(io, room);
}

function maybeStartGame(io, room) {
  if (!canStartGame(room)) {
    return;
  }

  startGame(io, room);
}

function applyAttack(io, room, attacker, target, x, y, isDoubleOrNothing = false) {
  if (!attacker.attackGrids[target.teamId]) {
    attacker.attackGrids[target.teamId] = createGrid("unknown");
  }

  let actualX = x;
  let actualY = y;
  let shotShifted = false;

  // Shot Shift Glitch (turns 10-12): randomly redirect to adjacent cell
  if (room.glitchPhase === 4) {
    const directions = [
      [0, -1], // up
      [0, 1],  // down
      [-1, 0], // left
      [1, 0],  // right
    ];
    const shift = directions[Math.floor(Math.random() * directions.length)];
    const newX = x + shift[0];
    const newY = y + shift[1];

    if (newX >= 0 && newX < GRID_SIZE && newY >= 0 && newY < GRID_SIZE) {
      actualX = newX;
      actualY = newY;
      shotShifted = true;
    }
  }

  const result = resolveAttack(room, attacker, target, actualX, actualY);

  // Double or Nothing Glitch (turns 13-15): 2x multiplier
  let damageMultiplier = 1;
  if (room.glitchPhase === 5 && isDoubleOrNothing) {
    damageMultiplier = 2;
  }

  if (result.damageToAttacker > 0) {
    attacker.hp = Math.max(attacker.hp - (result.damageToAttacker * damageMultiplier), 0);
    if (attacker.hp === 0) {
      attacker.isAlive = false;
    }
  }

  if (result.damageToTarget > 0) {
    target.hp = Math.max(target.hp - (result.damageToTarget * damageMultiplier), 0);
    if (target.hp === 0) {
      target.isAlive = false;
    }
    attacker.score += result.damageToTarget * damageMultiplier;
  }

  attacker.attackGrids[target.teamId][actualY][actualX] = result.isHit ? "hit" : "miss";

  io.to(room.roomId).emit("attackResult", {
    attackerId: attacker.teamId,
    targetTeamId: target.teamId,
    x: actualX,
    y: actualY,
    originalX: x,
    originalY: y,
    result: result.result,
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
    shotShifted,
    damageMultiplier,
    damageToAttacker: result.damageToAttacker * damageMultiplier,
    damageToTarget: result.damageToTarget * damageMultiplier,
    attackerHp: attacker.hp,
    targetHp: target.hp,
  });

  if (attacker.socketId) {
    io.to(attacker.socketId).emit("attackResult", {
      attackerId: attacker.teamId,
      targetTeamId: target.teamId,
      x: actualX,
      y: actualY,
      originalX: x,
      originalY: y,
      result: result.result,
      turnCount: room.turnCount,
      glitchPhase: room.glitchPhase,
      shotShifted,
      damageMultiplier,
      damageToAttacker: result.damageToAttacker * damageMultiplier,
      damageToTarget: result.damageToTarget * damageMultiplier,
      attackerHp: attacker.hp,
      targetHp: target.hp,
      attackGrid: attacker.attackGrids[target.teamId],
    });
  }

  const aliveTeams = room.teams.filter((team) => team.isAlive && team.isConnected);
  if (aliveTeams.length <= 1) {
    endGame(io, room, "last-team-standing");
    return;
  }

  const nextIndex = getNextTurnIndex(room, room.turnIndex + 1);
  room.turnIndex = nextIndex;
  io.to(room.roomId).emit("turnChange", {
    teamId: room.teams[room.turnIndex]?.teamId || null,
  });
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
  queueAiTurn(io, room);
}

function queueAiTurn(io, room) {
  if (room.status !== "active") {
    return;
  }

  const currentTeam = room.teams[room.turnIndex];
  if (!currentTeam || !isBot(currentTeam) || !currentTeam.isAlive) {
    return;
  }

  if (room.aiTimerId) {
    clearTimeout(room.aiTimerId);
  }

  room.aiTimerId = setTimeout(() => {
    if (room.status !== "active") {
      return;
    }
    if (room.teams[room.turnIndex]?.teamId !== currentTeam.teamId) {
      return;
    }

    const target = room.teams.find((team) => !isBot(team) && team.isAlive && team.isConnected) ||
      room.teams.find((team) => !isBot(team) && team.isAlive);
    if (!target) {
      return;
    }

    if (!currentTeam.attackGrids[target.teamId]) {
      currentTeam.attackGrids[target.teamId] = createGrid("unknown");
    }

    const options = [];
    const grid = currentTeam.attackGrids[target.teamId];
    for (let y = 0; y < GRID_SIZE; y += 1) {
      for (let x = 0; x < GRID_SIZE; x += 1) {
        if (grid[y][x] === "unknown") {
          options.push({ x, y });
        }
      }
    }

    if (options.length === 0) {
      return;
    }

    const pick = options[Math.floor(Math.random() * options.length)];
    applyAttack(io, room, currentTeam, target, pick.x, pick.y);
  }, AI_THINK_MS);
}

function parseCookies(headerValue) {
  if (!headerValue) {
    return {};
  }

  return headerValue.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    acc[rawKey] = decodeURIComponent(rest.join("="));
    return acc;
  }, {});
}

function requireAdmin(req, res) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies.gs_session;
  if (!token) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }

  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    res.status(401).json({ error: "Unauthorized" });
    return null;
  }
}

nextApp.prepare().then(() => {
  const app = express();
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  app.use(express.json());

  app.get("/api/admin/rooms", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }
    res.json({ rooms: listRoomsSummary() });
  });

  app.post("/api/admin/rooms", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const { roomId } = req.body || {};
    if (!roomId || typeof roomId !== "string") {
      res.status(400).json({ error: "roomId is required." });
      return;
    }

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomId,
        turnCount: 0,
        glitchPhase: 1,
        status: "waiting",
        teams: [],
        turnIndex: 0,
        phaseEndsAt: null,
        timerId: null,
      });
    }

    res.json({ ok: true, room: rooms.get(roomId) });
  });

  app.post("/api/admin/rooms/:roomId/start", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found." });
      return;
    }

    if (!canStartGame(room)) {
      res.status(400).json({ error: "Room not ready to start." });
      return;
    }

    startGame(io, room);
    res.json({ ok: true });
  });

  app.post("/api/admin/rooms/:roomId/stop", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }

    const room = rooms.get(req.params.roomId);
    if (!room) {
      res.status(404).json({ error: "Room not found." });
      return;
    }

    endGame(io, room, "admin-stop");
    res.json({ ok: true });
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", ({ roomId, teamId, userId }) => {
      if (!roomId || !teamId) {
        socket.emit("errorMessage", { message: "Missing roomId or teamId." });
        return;
      }

      let room = rooms.get(roomId);
      if (!room) {
        room = {
          roomId,
          turnCount: 0,
          glitchPhase: 1,
          status: "waiting",
          teams: [],
          turnIndex: 0,
          phaseEndsAt: null,
          timerId: null,
        };
        rooms.set(roomId, room);
      }

      let team = room.teams.find((entry) => entry.teamId === teamId);
      if (team) {
        team.socketId = socket.id;
        team.isConnected = true;
      } else {
        if (room.teams.length >= MAX_TEAMS) {
          socket.emit("errorMessage", { message: "Room is full." });
          return;
        }

        team = {
          teamId,
          userId: userId || null,
          socketId: socket.id,
          hp: 0,
          fleetGrid: null,
          isAlive: true,
          score: 0,
          isConnected: true,
          attackGrids: {},
        };
        room.teams.push(team);
      }

      socket.join(roomId);
      io.to(roomId).emit("roomUpdate", sanitizeRoom(room));

      if (room.status === "active") {
        socket.emit("turnChange", {
          teamId: room.teams[room.turnIndex]?.teamId || null,
        });
      }
    });

    socket.on("placeFleet", ({ roomId, teamId, fleetGrid }) => {
      const room = rooms.get(roomId);
      if (!room) {
        socket.emit("errorMessage", { message: "Room not found." });
        return;
      }

      const team = room.teams.find((entry) => entry.teamId === teamId);
      if (!team) {
        socket.emit("errorMessage", { message: "Team not found." });
        return;
      }

      if (!Array.isArray(fleetGrid) || fleetGrid.length !== GRID_SIZE) {
        socket.emit("errorMessage", { message: "Invalid fleet grid." });
        return;
      }

      let cellCount = 0;
      for (let y = 0; y < GRID_SIZE; y += 1) {
        if (!Array.isArray(fleetGrid[y]) || fleetGrid[y].length !== GRID_SIZE) {
          socket.emit("errorMessage", { message: "Invalid fleet grid." });
          return;
        }
        for (let x = 0; x < GRID_SIZE; x += 1) {
          if (fleetGrid[y][x]) {
            cellCount += 1;
          }
        }
      }

      if (cellCount !== REQUIRED_FLEET_CELLS) {
        socket.emit("errorMessage", {
          message: `Fleet must have exactly ${REQUIRED_FLEET_CELLS} cells.`,
        });
        return;
      }

      team.fleetGrid = fleetGrid;
      team.hp = cellCount;
      team.isAlive = cellCount > 0;

      io.to(roomId).emit("roomUpdate", sanitizeRoom(room));
      maybeStartGame(io, room);
    });

    socket.on("attack", ({ roomId, attackerId, targetTeamId, x, y, isDoubleOrNothing }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "active") {
        socket.emit("errorMessage", { message: "Game not active." });
        return;
      }

      const attacker = room.teams.find((team) => team.teamId === attackerId);
      const target = room.teams.find((team) => team.teamId === targetTeamId);
      if (!attacker || !target) {
        socket.emit("errorMessage", { message: "Invalid teams." });
        return;
      }

      if (!attacker.isAlive || !attacker.isConnected) {
        socket.emit("errorMessage", { message: "Attacker inactive." });
        return;
      }

      if (!target.isAlive) {
        socket.emit("errorMessage", { message: "Target eliminated." });
        return;
      }

      const currentTurnTeamId = room.teams[room.turnIndex]?.teamId;
      if (currentTurnTeamId !== attackerId) {
        socket.emit("errorMessage", { message: "Not your turn." });
        return;
      }

      if (
        typeof x !== "number" ||
        typeof y !== "number" ||
        x < 0 ||
        y < 0 ||
        x >= GRID_SIZE ||
        y >= GRID_SIZE
      ) {
        socket.emit("errorMessage", { message: "Invalid coordinates." });
        return;
      }

      if (!attacker.attackGrids[targetTeamId]) {
        attacker.attackGrids[targetTeamId] = createGrid("unknown");
      }

      if (attacker.attackGrids[targetTeamId][y][x] !== "unknown") {
        socket.emit("errorMessage", { message: "Tile already targeted." });
        return;
      }

      applyAttack(io, room, attacker, target, x, y, Boolean(isDoubleOrNothing));
    });

    socket.on("disconnect", () => {
      rooms.forEach((room) => {
        const team = room.teams.find((entry) => entry.socketId === socket.id);
        if (team) {
          team.isConnected = false;
          io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
          const currentTurnTeamId = room.teams[room.turnIndex]?.teamId;
          if (currentTurnTeamId === team.teamId && room.status === "active") {
            room.turnIndex = getNextTurnIndex(room, room.turnIndex + 1);
            io.to(room.roomId).emit("turnChange", {
              teamId: room.teams[room.turnIndex]?.teamId || null,
            });
            queueAiTurn(io, room);
          }
        }
      });
    });
  });

  app.all("*", (req, res) => handle(req, res));

  const port = process.env.PORT || 3000;
  server.listen(port, () => {
    console.log(`Server ready on http://localhost:${port}`);
  });
});
