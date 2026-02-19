const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { MongoClient, ObjectId } = require("mongodb");

let cachedGlitchPhase = 1;
let lastGlitchFetch = 0;
let mongoDb = null;

const TURN_DURATION_MS = 3 * 60 * 1000;
const MAX_TEAMS = 5;
const MIN_TEAMS = 1;
const GRID_SIZE = 10;
const REQUIRED_FLEET_CELLS = 17;
const AI_THINK_MS = 800;
const AI_PREFIX = "AI-";
const TOTAL_TURNS = 15;
const SHIP_SIZES = [5, 4, 3, 3, 2]; // Carrier, Battleship, Cruiser, Submarine, Destroyer
const SHIP_NAMES = ["Carrier", "Battleship", "Cruiser", "Submarine", "Destroyer"];
const AI_ENEMY_ID = "AI_ENEMY";

// Get MongoDB database instance
async function getDb() {
  if (!mongoDb) {
    const dbUrl = process.env.MONGODB_URI || "mongodb://localhost:27017";
    const client = new MongoClient(dbUrl);
    await client.connect();
    mongoDb = client.db("gameshift");
  }
  return mongoDb;
}

// Get admin-controlled glitch phase (with caching)
async function getAdminGlitchPhase() {
  const now = Date.now();
  // Cache for 5 seconds to avoid too many DB calls
  if (now - lastGlitchFetch < 5000) {
    return cachedGlitchPhase;
  }

  try {
    const db = await getDb();
    const settings = db.collection("settings");
    const glitchSetting = await settings.findOne({ key: "currentGlitchPhase" });
    const phase = glitchSetting?.phase || 1;
    cachedGlitchPhase = phase;
    lastGlitchFetch = now;
    return phase;
  } catch (error) {
    console.error("Error fetching glitch phase from DB:", error);
    return cachedGlitchPhase; // Return cached value on error
  }
}

// Fallback: default glitch by turn count (used if admin control unavailable)
function getDefaultGlitchPhase(turnCount) {
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

// Track per-member attacks in current round
function hasMemberAttackedThisRound(room, teamId, userId) {
  if (!room.memberAttacksThisRound) {
    room.memberAttacksThisRound = new Set();
  }
  return room.memberAttacksThisRound.has(`${teamId}:${userId}`);
}

function markMemberAttacked(room, teamId, userId) {
  if (!room.memberAttacksThisRound) {
    room.memberAttacksThisRound = new Set();
  }
  room.memberAttacksThisRound.add(`${teamId}:${userId}`);
}

function resetRoundAttacks(room) {
  room.memberAttacksThisRound = new Set();
}

function allMembersAttackedThisRound(room) {
  const currentTeam = room.teams[room.turnIndex];
  if (!currentTeam) {
    return false;
  }
  
  // Bots always count as attacked (single entity)
  if (isBot(currentTeam)) {
    return true;
  }
  
  // For human teams, check if all connected members have attacked
  const connectedMembers = [];
  (currentTeam.members || []).forEach((memberId) => {
    const socketId = currentTeam.memberSockets?.get(memberId);
    if (socketId) {
      connectedMembers.push(memberId);
    }
  });
  
  if (connectedMembers.length === 0) {
    return false;
  }
  
  return connectedMembers.every((userId) => hasMemberAttackedThisRound(room, currentTeam.teamId, userId));
}

function generateHazardGrid() {
  return Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => Math.random() < 0.2)
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

function createRandomFleetGrid() {
  const grid = createGrid(false);
  const ships = [];
  
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
        const cells = placeShip(grid, x, y, size, isHorizontal, shipId);
        ships.push({
          id: shipId,
          name: SHIP_NAMES[i],
          size,
          cells,
          hits: 0,
          sunk: false,
        });
        placed = true;
      }
      attempts++;
    }
    
    if (!placed) {
      // Fallback: place randomly if structured placement fails
      console.warn(`Failed to place ship ${shipId} properly, using fallback`);
      return createRandomFleetGrid(); // Retry
    }
  }
  
  return { grid, ships };
}

function createAIEnemy() {
  const fleetData = createRandomFleetGrid();
  return {
    teamId: AI_ENEMY_ID,
    teamName: "🤖 AI Enemy",
    hp: REQUIRED_FLEET_CELLS,
    fleetGrid: fleetData.grid,
    ships: fleetData.ships,
    isAlive: true,
    score: 0,
    attackGrids: {},
    isAI: true,
  };
}

function detectShipsFromGrid(fleetGrid) {
  // Create a working copy
  const visited = createGrid(false);
  const ships = [];
  let shipIdCounter = 0;

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
          const shipId = `ship_${shipIdCounter++}`;
          const size = cells.length;
          const shipName = SHIP_NAMES[SHIP_SIZES.indexOf(size)] || `Ship-${size}`;
          ships.push({
            id: shipId,
            name: shipName,
            size,
            cells,
            hits: 0,
            sunk: false,
          });
        }
      }
    }
  }

  return ships;
}

function isBot(team) {
  return Boolean(team?.isBot);
}

function sanitizeRoom(room) {
  const turnTeamId = room.teams[room.turnIndex]?.teamId || null;
  const turnTeamName = room.teams[room.turnIndex]?.teamName || null;
  return {
    roomId: room.roomId,
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
    status: room.status,
    turnTeamId,
    turnTeamName,
    phaseEndsAt: room.phaseEndsAt,
    teams: room.teams.map((team) => ({
      teamId: team.teamId,
      teamName: team.teamName,
      hp: team.hp,
      isAlive: team.isAlive,
      score: team.score,
      isConnected: team.memberSockets && team.memberSockets.size > 0,
    })),
    aiEnemy: room.aiEnemy ? {
      hp: room.aiEnemy.hp,
      isAlive: room.aiEnemy.isAlive,
      totalShips: room.aiEnemy.ships?.length || 5,
      sunkShips: room.aiEnemy.ships?.filter(s => s.sunk).length || 0,
    } : null,
  };
}

function listRoomsSummary() {
  return Array.from(rooms.values()).map((room) => {
    const turnTeamId = room.teams[room.turnIndex]?.teamId || null;
    const turnTeamName = room.teams[room.turnIndex]?.teamName || null;
    return {
      roomId: room.roomId,
      turnCount: room.turnCount,
      glitchPhase: room.glitchPhase,
      status: room.status,
      phaseEndsAt: room.phaseEndsAt,
      turnTeamId,
      turnTeamName,
      teams: room.teams.map((team) => ({
        teamId: team.teamId,
        teamName: team.teamName,
        hp: team.hp,
        isAlive: team.isAlive,
        score: team.score,
        isConnected: team.memberSockets && team.memberSockets.size > 0,
      })),
      aiEnemy: room.aiEnemy ? {
        hp: room.aiEnemy.hp,
        isAlive: room.aiEnemy.isAlive,
      } : null,
    };
  });
}

async function persistScoreDelta(attacker, scoreDelta) {
  const effectiveUserId = attacker?.lastUserId || attacker?.userId;
  console.log(`[SCORE] persistScoreDelta called: userId=${effectiveUserId}, delta=${scoreDelta}, isBot=${isBot(attacker)}`);
  
  if (!effectiveUserId || isBot(attacker)) {
    console.log(`[SCORE] Skipping: invalid userId or is bot`);
    return;
  }

  if (!Number.isFinite(scoreDelta) || scoreDelta === 0) {
    console.log(`[SCORE] Skipping: Invalid or zero delta`);
    return;
  }

  const points = Math.trunc(scoreDelta);
  if (points === 0) {
    console.log(`[SCORE] Skipping: Points truncated to 0`);
    return;
  }

  console.log(`[SCORE] Sending request to update score: userId=${effectiveUserId}, points=${points}`);
  
  try {
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const response = await fetch(`${frontendUrl}/api/users/score`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: effectiveUserId,
        scorePoints: points,
      }),
    });

    console.log(`[SCORE] Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(
        `[SCORE] Failed to update score for ${attacker.teamName || attacker.teamId}:`,
        response.status,
        errorText
      );
    } else {
      const responseData = await response.json();
      console.log(`[SCORE] Success: ${JSON.stringify(responseData)}`);
    }
  } catch (error) {
    console.error(`[SCORE] Error updating score for ${attacker.teamName || attacker.teamId}:`, error.message, error.code);
  }
}

function getNextTurnIndex(room, startIndex) {
  if (room.teams.length === 0) {
    return -1;
  }

  for (let offset = 0; offset < room.teams.length; offset += 1) {
    const index = (startIndex + offset) % room.teams.length;
    const team = room.teams[index];
    // Check if team is alive and has connected members (or is a bot)
    const hasConnectedMembers = isBot(team) || (team.memberSockets && team.memberSockets.size > 0);
    if (team.isAlive && hasConnectedMembers) {
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
  let hitShip = null;

  // Find which ship was hit (if any)
  if (isHit && target.ships) {
    for (const ship of target.ships) {
      if (!ship.sunk && ship.cells.some(cell => cell.x === x && cell.y === y)) {
        hitShip = ship;
        break;
      }
    }
  }

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
    hitShip,
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
      teamName: team.teamName || team.teamId,
      hp: team.hp,
      score: team.score,
      isAlive: team.isAlive,
      isConnected: team.isConnected,
    }));

  io.to(room.roomId).emit("gameOver", { reason, rankings });
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
}

// Keep timer for UI updates only, not for turn advancement
function startPhaseTimer(io, room) {
  if (room.timerId) {
    clearInterval(room.timerId);
  }

  room.timerId = setInterval(() => {
    if (room.status !== "active") {
      return;
    }
    // Just update room state for clients
    io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
  }, 1000);
}

// Advance to next round after all teams attack
async function advanceToNextRound(io, room) {
  console.log(`[Round ${room.turnCount}] -> Advancing to Round ${room.turnCount + 1}`);
  
  if (room.turnCount >= TOTAL_TURNS) {
    console.log(`[Round ${room.turnCount}] Game complete! Max turns reached.`);
    endGame(io, room, "game-complete");
    return;
  }
  
  room.turnCount += 1;
  resetRoundAttacks(room);
  
  // Get admin-controlled glitch phase
  room.glitchPhase = await getAdminGlitchPhase();
  
  console.log(`[Round ${room.turnCount}] New round started. Glitch phase: ${room.glitchPhase}`);
  
  io.to(room.roomId).emit("phaseChange", {
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
  });
  
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
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

  const fleetData = createRandomFleetGrid();
  const bot = {
    teamId: botId,
    teamName: `🤖 Bot ${suffix}`,
    socketId: null,
    hp: REQUIRED_FLEET_CELLS,
    fleetGrid: fleetData.grid,
    ships: fleetData.ships,
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

async function startGame(io, room) {
  room.status = "active";
  room.turnCount = 1;
  resetRoundAttacks(room);
  room.aiEnemyAttackGrid = createGrid("unknown");
  // Get admin-controlled glitch phase
  room.glitchPhase = await getAdminGlitchPhase();
  room.turnIndex = getNextTurnIndex(room, 0);
  startPhaseTimer(io, room);

  io.to(room.roomId).emit("phaseChange", {
    turnCount: room.turnCount,
    glitchPhase: room.glitchPhase,
  });
  io.to(room.roomId).emit("turnChange", {
    teamId: room.teams[room.turnIndex]?.teamId || null,
    teamName: room.teams[room.turnIndex]?.teamName || null,
  });
  io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
  queueAiTurn(io, room);
}

async function maybeStartGame(io, room) {
  if (!canStartGame(room)) {
    return;
  }

  await startGame(io, room);
}

async function applyAttack(io, room, attacker, target, x, y, isDoubleOrNothing = false, userId = null) {
  if (!attacker.attackGrids[target.teamId]) {
    attacker.attackGrids[target.teamId] = createGrid("unknown");
  }

  const previousScore = attacker.score;

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

  if (target.teamId === AI_ENEMY_ID) {
    if (!room.aiEnemyAttackGrid) {
      room.aiEnemyAttackGrid = createGrid("unknown");
    }
    if (room.aiEnemyAttackGrid[actualY][actualX] !== "unknown") {
      if (attacker.socketId) {
        io.to(attacker.socketId).emit("errorMessage", { message: "AI cell already targeted." });
      }
      return;
    }
  }

  const result = resolveAttack(room, attacker, target, actualX, actualY);

  // Double or Nothing Glitch (turns 13-15): 2x multiplier
  let damageMultiplier = 1;
  if (room.glitchPhase === 5 && isDoubleOrNothing) {
    damageMultiplier = 2;
  }

  let shipSunk = false;
  let sunkShipName = null;
  let sinkBonus = 0;

  // Apply damage to attacker (penalty for taking damage: -1 per HP lost)
  if (result.damageToAttacker > 0) {
    const actualDamage = result.damageToAttacker * damageMultiplier;
    attacker.hp = Math.max(attacker.hp - actualDamage, 0);
    attacker.score = Math.max(attacker.score - actualDamage, 0); // -1 per damage taken
    if (attacker.hp === 0) {
      attacker.isAlive = false;
    }
  }

  // Apply damage to target and track ship sinking
  if (result.damageToTarget > 0) {
    const actualDamage = result.damageToTarget * damageMultiplier;
    target.hp = Math.max(target.hp - actualDamage, 0);
    if (target.hp === 0) {
      target.isAlive = false;
    }
    
    // Award +1 per hit
    attacker.score += actualDamage;

    // Track ship hits and detect sinking
    if (result.hitShip && target.ships) {
      result.hitShip.hits += actualDamage;
      
      if (result.hitShip.hits >= result.hitShip.size && !result.hitShip.sunk) {
        result.hitShip.sunk = true;
        shipSunk = true;
        sunkShipName = result.hitShip.name;
        sinkBonus = 5;
        attacker.score += sinkBonus; // +5 bonus for sinking a ship
      }
    }
  }

  attacker.attackGrids[target.teamId][actualY][actualX] = result.isHit ? "hit" : "miss";

  if (target.teamId === AI_ENEMY_ID) {
    room.aiEnemyAttackGrid[actualY][actualX] = result.isHit ? "hit" : "miss";
    io.to(room.roomId).emit("aiEnemyGridUpdate", {
      grid: room.aiEnemyAttackGrid,
    });
  }

  const scoreDelta = attacker.score - previousScore;
  console.log(`[SCORE] Attack complete: userId=${attacker.lastUserId || attacker.userId}, previousScore=${previousScore}, newScore=${attacker.score}, delta=${scoreDelta}`);
  
  if (scoreDelta !== 0) {
    void persistScoreDelta(attacker, scoreDelta);
  }

  const roomAttackGrid = target.teamId === AI_ENEMY_ID
    ? room.aiEnemyAttackGrid
    : undefined;

  io.to(room.roomId).emit("attackResult", {
    attackerId: attacker.teamId,
    attackerName: attacker.teamName || attacker.teamId,
    targetTeamId: target.teamId,
    targetName: target.teamName || target.teamId,
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
    shipSunk,
    sunkShipName,
    sinkBonus,
    attackerScore: attacker.score,
    ...(roomAttackGrid ? { attackGrid: roomAttackGrid } : {}),
  });

  // Send attackResult to all members of attacking team
  if (attacker.memberSockets && attacker.memberSockets.size > 0) {
    const attackerGrid = target.teamId === AI_ENEMY_ID
      ? room.aiEnemyAttackGrid
      : attacker.attackGrids[target.teamId];
    const attackResultPayload = {
      attackerId: attacker.teamId,
      attackerName: attacker.teamName || attacker.teamId,
      targetTeamId: target.teamId,
      targetName: target.teamName || target.teamId,
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
      shipSunk,
      sunkShipName,
      sinkBonus,
      attackerScore: attacker.score,
      attackGrid: attackerGrid,
    };
    attacker.memberSockets.forEach((socketId) => {
      io.to(socketId).emit("attackResult", attackResultPayload);
    });
  }

  // Notify target team members if they were hit
  if (result.isHit) {
    const fleetHitPayload = {
      x: actualX,
      y: actualY,
      attackerId: attacker.teamId,
      attackerName: attacker.teamName || attacker.teamId,
      damageDealt: result.damageToTarget * damageMultiplier,
      hp: target.hp,
      score: target.score,
      shipSunk,
      sunkShipName,
    };
    
    if (target.teamId === AI_ENEMY_ID) {
      // AI enemy is single target
      if (target.socketId) {
        io.to(target.socketId).emit("fleetHit", fleetHitPayload);
      }
    } else {
      // Human team has multiple members
      target.memberSockets?.forEach((socketId) => {
        io.to(socketId).emit("fleetHit", fleetHitPayload);
      });
    }
  }

  // Mark that this member has attacked this round
  if (userId) {
    markMemberAttacked(room, attacker.teamId, userId);
  }
  
  console.log(`[Round ${room.turnCount}] ${attacker.teamName || attacker.teamId} attacked. Members attacked.`);
  
  // Check if AI enemy is defeated
  if (target.teamId === AI_ENEMY_ID && !target.isAlive) {
    endGame(io, room, "ai-defeated");
    return;
  }

  // Check if AI enemy is alive
  if (!room.aiEnemy || !room.aiEnemy.isAlive) {
    endGame(io, room, "ai-defeated");
    return;
  }

  // Check if all members of current team have attacked
  if (allMembersAttackedThisRound(room)) {
    console.log(`[Round ${room.turnCount}] ${attacker.teamName || attacker.teamId} team done attacking.`);
    
    // Move to next team
    const nextIndex = getNextTurnIndex(room, room.turnIndex + 1);
    
    // If no more alive teams this round, advance to next round
    if (nextIndex === -1 || nextIndex <= room.turnIndex) {
      console.log(`[Round ${room.turnCount}] All teams attacked. Advancing to next round...`);
      await advanceToNextRound(io, room);
      room.turnIndex = getNextTurnIndex(room, 0);
    } else {
      // Continue to next team this round
      room.turnIndex = nextIndex;
    }
  }

  // Broadcast room update with new turn index
  io.to(room.roomId).emit("turnChange", {
    teamId: room.teams[room.turnIndex]?.teamId || null,
    teamName: room.teams[room.turnIndex]?.teamName || null,
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

  room.aiTimerId = setTimeout(async () => {
    if (room.status !== "active") {
      return;
    }
    if (room.teams[room.turnIndex]?.teamId !== currentTeam.teamId) {
      return;
    }

    const hasConnectedHumanMembers = (team) => !isBot(team) && team.memberSockets && team.memberSockets.size > 0;
    const target = room.teams.find((team) => !isBot(team) && team.isAlive && hasConnectedHumanMembers(team)) ||
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
    await applyAttack(io, room, currentTeam, target, pick.x, pick.y);
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
  return true;
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


// API Server Start
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

  // CORS middleware for different domain deployments
  app.use((req, res, next) => {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
    res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
    } else {
      next();
    }
  });

  // Apply express.json() only to specific Express-handled admin routes
  // to avoid interfering with Next.js API routes
  const adminJsonParser = express.json();

  app.get("/api/admin/rooms", (req, res) => {
    if (!requireAdmin(req, res)) {
      return;
    }
    res.json({ rooms: listRoomsSummary() });
  });

  app.post("/api/admin/rooms", adminJsonParser, (req, res) => {
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
        aiEnemy: createAIEnemy(),
        aiEnemyAttackGrid: createGrid("unknown"),
      });
    }

    res.json({ ok: true, room: rooms.get(roomId) });
  });

  app.post("/api/admin/rooms/:roomId/start", adminJsonParser, (req, res) => {
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

  app.post("/api/admin/rooms/:roomId/stop", adminJsonParser, (req, res) => {
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

  app.get("/api/battleship/leaderboard", (req, res) => {
    // Aggregate scores across all rooms
    const teamScores = new Map();
    
    rooms.forEach((room) => {
      room.teams.forEach((team) => {
        if (!team.isBot) { // Exclude AI bots
          const existingScore = teamScores.get(team.teamId) || { teamId: team.teamId, score: 0, hp: 0, isAlive: false };
          teamScores.set(team.teamId, {
            teamId: team.teamId,
            score: Math.max(existingScore.score, team.score), // Use highest score across rooms
            hp: team.hp,
            isAlive: team.isAlive,
            roomId: room.roomId,
          });
        }
      });
    });

    const leaderboard = Array.from(teamScores.values())
      .sort((a, b) => b.score - a.score); // Sort by score descending

    res.json({ leaderboard });
  });

  io.on("connection", (socket) => {
    socket.on("joinRoom", async ({ roomId, teamId, userId }) => {
      if (!roomId || !teamId) {
        socket.emit("errorMessage", { message: "Missing roomId or teamId." });
        return;
      }

      // Fetch team name from database
      let teamName = teamId;
      try {
        const db = await getDb();
        const teamDoc = await db.collection("teams").findOne({ _id: new ObjectId(teamId) });
        console.log(`[DEBUG] Team lookup for ${teamId}:`, teamDoc);
        if (teamDoc) {
          teamName = teamDoc.name || teamId;
          console.log(`[DEBUG] Team name set to: ${teamName}`);
        }
      } catch (error) {
        console.error("Failed to fetch team name:", error);
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
          aiEnemy: createAIEnemy(),
          aiEnemyAttackGrid: createGrid("unknown"),
        };
        rooms.set(roomId, room);
      }

      if (!room.aiEnemyAttackGrid) {
        room.aiEnemyAttackGrid = createGrid("unknown");
      }

      let team = room.teams.find((entry) => entry.teamId === teamId);
      if (team) {
        // Member joining existing team
        if (userId) {
          if (!team.memberSockets) {
            team.memberSockets = new Map();
          }
          if (!team.members) {
            team.members = [];
          }
          if (!team.members.includes(userId)) {
            team.members.push(userId);
          }
          team.memberSockets.set(userId, socket.id);
        }
        team.teamName = teamName; // Update name in case it changed
      } else {
        if (room.teams.length >= MAX_TEAMS) {
          socket.emit("errorMessage", { message: "Room is full." });
          return;
        }

        team = {
          teamId,
          teamName,
          members: userId ? [userId] : [],
          memberSockets: new Map(userId ? [[userId, socket.id]] : []),
          hp: 0,
          fleetGrid: null,
          ships: [],
          isAlive: true,
          score: 0,
          attackGrids: {},
        };
        room.teams.push(team);
      }

      socket.join(roomId);
      io.to(roomId).emit("roomUpdate", sanitizeRoom(room));
      socket.emit("aiEnemyGridUpdate", { grid: room.aiEnemyAttackGrid });

      if (room.status === "active") {
        socket.emit("turnChange", {
          teamId: room.teams[room.turnIndex]?.teamId || null,
          teamName: room.teams[room.turnIndex]?.teamName || null,
        });
      }
    });

    socket.on("placeFleet", async ({ roomId, teamId, fleetGrid }) => {
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

      // Detect ships from grid
      const ships = detectShipsFromGrid(fleetGrid);
      
      // Validate ship configuration
      const sizes = ships.map(s => s.size).sort((a, b) => b - a);
      const expectedSizes = [...SHIP_SIZES].sort((a, b) => b - a);
      const sizesMatch = sizes.length === expectedSizes.length && 
                         sizes.every((size, i) => size === expectedSizes[i]);
      
      if (!sizesMatch) {
        socket.emit("errorMessage", {
          message: `Fleet must contain ships of sizes: ${SHIP_SIZES.join(', ')}. Found: ${sizes.join(', ')}`,
        });
        return;
      }

      team.fleetGrid = fleetGrid;
      team.ships = ships;
      team.hp = cellCount;
      team.isAlive = cellCount > 0;

      io.to(roomId).emit("roomUpdate", sanitizeRoom(room));
      await maybeStartGame(io, room);
    });

    socket.on("attack", async ({ roomId, attackerId, targetTeamId, x, y, isDoubleOrNothing, userId }) => {
      const room = rooms.get(roomId);
      if (!room || room.status !== "active") {
        socket.emit("errorMessage", { message: "Game not active." });
        return;
      }

      const attacker = room.teams.find((team) => team.teamId === attackerId);
      
      // Target can be either a team or the AI enemy
      let target;
      if (targetTeamId === AI_ENEMY_ID) {
        target = room.aiEnemy;
      } else {
        target = room.teams.find((team) => team.teamId === targetTeamId);
      }
      
      if (!attacker || !target) {
        socket.emit("errorMessage", { message: "Invalid teams." });
        return;
      }

      if (userId) {
        attacker.lastUserId = userId;
      }

      if (!attacker.isAlive || !attacker.memberSockets || attacker.memberSockets.size === 0) {
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

      // Check if this member has already attacked this round
      if (userId && hasMemberAttackedThisRound(room, attackerId, userId)) {
        socket.emit("errorMessage", { message: "You have already attacked this round." });
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

      if (targetTeamId === AI_ENEMY_ID) {
        if (!room.aiEnemyAttackGrid) {
          room.aiEnemyAttackGrid = createGrid("unknown");
        }
        if (room.aiEnemyAttackGrid[y][x] !== "unknown") {
          socket.emit("errorMessage", { message: "AI cell already targeted." });
          return;
        }
      }

      if (!attacker.attackGrids[targetTeamId]) {
        attacker.attackGrids[targetTeamId] = createGrid("unknown");
      }

      if (attacker.attackGrids[targetTeamId][y][x] !== "unknown") {
        socket.emit("errorMessage", { message: "Tile already targeted." });
        return;
      }

      await applyAttack(io, room, attacker, target, x, y, Boolean(isDoubleOrNothing), userId);
    });

    socket.on("disconnect", () => {
      rooms.forEach((room) => {
        room.teams.forEach((team) => {
          // Find and remove member socket
          let disconnectedUserId = null;
          team.memberSockets?.forEach((sockId, userId) => {
            if (sockId === socket.id) {
              disconnectedUserId = userId;
            }
          });
          if (disconnectedUserId) {
            team.memberSockets.delete(disconnectedUserId);
            io.to(room.roomId).emit("roomUpdate", sanitizeRoom(room));
          }
        });
      });
    });
  });

const port = process.env.PORT || 4000;
server.listen(port, () => {
  console.log(`API Server running on http://localhost:${port}`);
});
