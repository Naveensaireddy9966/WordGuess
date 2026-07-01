import express from "express";
import http from "http";
import path from "path";
import { Server, Socket } from "socket.io";
import { createServer as createViteServer } from "vite";

interface Player {
  id: string;      // Generated client-side, stored in localStorage
  name: string;
  socketId: string;
  ready: boolean;
  word: string;    // Submitted secret word, stored uppercase
  score: number;
  guesses: string[]; // List of guessed characters (uppercase A-Z)
  disconnected: boolean;
}

interface Room {
  code: string;
  capacity: number; // 1, 2, 3, or 4
  players: Player[];
  phase: "waiting" | "word_submission" | "playing" | "winner";
  currentTurnIndex: number;
  winnerId: string | null;
  timer: number; // Seconds left for current turn
}

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "127.0.0.1";
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// In-memory room store (Room Code -> Room)
const rooms = new Map<string, Room>();

const BOT_WORDS = [
  "MATRIX", "VORTEX", "QUANTUM", "CYBER", "PHANTOM", "GRAVITY",
  "NEXUS", "BEACON", "CIPHER", "SHADOW", "PUNCH", "LIGHT",
  "STATIC", "ROUTINE", "ZEPHYR", "CRUX", "COSMOS", "HYDRA"
];

// Helper to generate room code
function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Easy to read alphanumeric
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  // Guarantee uniqueness
  if (rooms.has(code)) {
    return generateRoomCode();
  }
  return code;
}

// Mask word helper
function maskWord(word: string, guessedLetters: string[]): string {
  if (!word) return "";
  return word.split("").map(char => {
    const upperChar = char.toUpperCase();
    if (upperChar >= "A" && upperChar <= "Z") {
      return guessedLetters.includes(upperChar) ? char : "_";
    }
    return char; // Non-letters
  }).join("");
}

// Sanitize room data securely before broadcasting
function sanitizeRoomForPlayer(room: Room, playerId: string) {
  const idx = room.players.findIndex(p => p.id === playerId);
  if (idx === -1) return null;

  const me = room.players[idx];
  const totalPlayers = room.players.length;

  // Circular gameplay definition:
  // Me attacks Target (index + 1)
  // Attacker attacks Me (index - 1)
  const targetIdx = totalPlayers > 1 ? (idx + 1) % totalPlayers : idx;
  const targetPlayer = room.players[targetIdx];

  const attackerIdx = totalPlayers > 1 ? (idx - 1 + totalPlayers) % totalPlayers : idx;
  const attackerPlayer = room.players[attackerIdx];

  const myGuessesOnTarget = me.guesses;
  const attackerGuessesOnMe = attackerPlayer ? attackerPlayer.guesses : [];

  // Map backward compatible roles "p1"/"p2" based on turn and winning status
  const currentTurnPlayer = room.players[room.currentTurnIndex];
  const isMyTurn = currentTurnPlayer && currentTurnPlayer.id === me.id;

  const isWinnerMe = room.winnerId === me.id;
  const hasWinner = room.winnerId !== null;

  // Map players list for scoreboard rendering
  const mappedPlayersList = room.players.map((p, pIndex) => ({
    id: p.id,
    name: p.name,
    score: p.score,
    ready: p.ready,
    disconnected: p.disconnected,
    isMe: p.id === me.id,
    isTarget: p.id === targetPlayer.id,
    isTurn: pIndex === room.currentTurnIndex
  }));

  return {
    code: room.code,
    capacity: room.capacity,
    phase: room.phase,
    // Turn is mapped to p1 if it's my turn, else p2 for visual simplicity
    currentTurn: isMyTurn ? "p1" : "p2",
    currentTurnId: currentTurnPlayer ? currentTurnPlayer.id : "",
    winner: hasWinner ? (isWinnerMe ? "p1" : "p2") : null,
    winnerId: room.winnerId,
    timer: room.timer,
    myRole: isMyTurn ? "p1" : "p2", // Fallback helper
    me: {
      id: me.id,
      name: me.name,
      score: me.score,
      ready: me.ready,
      word: me.word,
      guesses: me.guesses,
      maskedOwnWord: maskWord(me.word, attackerGuessesOnMe)
    },
    opponent: targetPlayer ? {
      id: targetPlayer.id,
      name: targetPlayer.name,
      score: targetPlayer.score,
      ready: targetPlayer.ready,
      disconnected: targetPlayer.disconnected,
      guesses: me.guesses,
      maskedWord: maskWord(targetPlayer.word, myGuessesOnTarget),
      hasWord: !!targetPlayer.word
    } : null,
    attacker: attackerPlayer ? {
      id: attackerPlayer.id,
      name: attackerPlayer.name
    } : null,
    playersList: mappedPlayersList
  };
}

function broadcastRoomState(roomCode: string) {
  const room = rooms.get(roomCode);
  if (!room) return;

  room.players.forEach(p => {
    if (p.socketId && p.id !== "system_bot") {
      io.to(p.socketId).emit("room_state", sanitizeRoomForPlayer(room, p.id));
    }
  });
}

// Bot automatic AI Guess action
function triggerBotTurnIfActive(room: Room) {
  if (room.phase !== "playing") return;

  const activePlayer = room.players[room.currentTurnIndex];
  if (activePlayer && activePlayer.id === "system_bot") {
    setTimeout(() => {
      const freshRoom = rooms.get(room.code);
      if (!freshRoom || freshRoom.phase !== "playing") return;

      const currentBot = freshRoom.players[freshRoom.currentTurnIndex];
      if (!currentBot || currentBot.id !== "system_bot") return;

      const botIdx = freshRoom.currentTurnIndex;
      const targetIdx = (botIdx + 1) % freshRoom.players.length;
      const targetPlayer = freshRoom.players[targetIdx];
      if (!targetPlayer) return;

      const unguessed = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").filter(char => !currentBot.guesses.includes(char));
      if (unguessed.length === 0) return;

      // Smart decision maker: 35% chance to hit actual remaining letters, 65% chance random
      let selectedLetter = "";
      const unmatchedTargetLetters = targetPlayer.word.toUpperCase().split("").filter(c => c >= "A" && c <= "Z" && !currentBot.guesses.includes(c));

      if (unmatchedTargetLetters.length > 0 && Math.random() < 0.35) {
        selectedLetter = unmatchedTargetLetters[Math.floor(Math.random() * unmatchedTargetLetters.length)];
      } else {
        selectedLetter = unguessed[Math.floor(Math.random() * unguessed.length)];
      }

      currentBot.guesses.push(selectedLetter);

      const occurrences = targetPlayer.word.toUpperCase().split("").filter(c => c === selectedLetter).length;
      if (occurrences > 0) {
        currentBot.score += occurrences;
        io.to(room.code).emit("game_hit", {
          playerRole: "p2",
          playerName: currentBot.name,
          letter: selectedLetter,
          occurrences
        });

        io.to(room.code).emit("chat_message", {
          id: "msg_bot_" + Math.random().toString(36).substring(2, 9),
          playerName: currentBot.name,
          message: `Scored a hit on ${selectedLetter}! 😎`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } else {
        io.to(room.code).emit("game_miss", {
          playerRole: "p2",
          playerName: currentBot.name,
          letter: selectedLetter
        });
      }

      // Check win
      const mask = maskWord(targetPlayer.word, currentBot.guesses);
      if (!mask.includes("_")) {
        freshRoom.phase = "winner";
        freshRoom.winnerId = currentBot.id;

        io.to(room.code).emit("system_message", {
          type: "winner",
          message: `🏆 Victory! ${currentBot.name} cracked the code and took the match!`
        });
      } else {
        // Change turn
        freshRoom.currentTurnIndex = (freshRoom.currentTurnIndex + 1) % freshRoom.players.length;
        freshRoom.timer = 10;

        io.to(room.code).emit("system_message", {
          type: "turn",
          message: `Turn shifted to ${freshRoom.players[freshRoom.currentTurnIndex].name}'s base.`
        });
      }

      broadcastRoomState(room.code);
      triggerBotTurnIfActive(freshRoom);
    }, 1500);
  }
}

// Authoritative turn countdown loop (runs every second)
setInterval(() => {
  rooms.forEach((room, roomCode) => {
    // Check if we are playing and we have active players
    const activeHumanConnected = room.players.some(p => p.id !== "system_bot" && !p.disconnected);
    if (!activeHumanConnected) return;

    if (room.phase === "playing") {
      room.timer = Math.max(0, room.timer - 1);

      if (room.timer === 0) {
        // Timeout turn rotation
        room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
        room.timer = 10;

        io.to(roomCode).emit("system_message", {
          type: "timeout",
          message: `Turn timeout! Switch to ${room.players[room.currentTurnIndex].name}'s turn.`
        });

        broadcastRoomState(roomCode);
        triggerBotTurnIfActive(room);
      } else {
        io.to(roomCode).emit("timer_tick", { timer: room.timer });
      }
    }
  });
}, 1000);

// Socket.io Connection Management
io.on("connection", (socket: Socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Create room handler
  socket.on("create_room", (data: { playerId: string; name: string; capacity?: number }) => {
    const { playerId, name, capacity } = data;
    const roomCode = generateRoomCode();
    const cleanCapacity = capacity || 2;

    const hostPlayer: Player = {
      id: playerId,
      name: name || "Player 1",
      socketId: socket.id,
      ready: false,
      word: "",
      score: 0,
      guesses: [],
      disconnected: false
    };

    const newRoom: Room = {
      code: roomCode,
      capacity: cleanCapacity,
      players: [hostPlayer],
      phase: "waiting",
      currentTurnIndex: 0,
      winnerId: null,
      timer: 10
    };

    // If capacity is 1 (Solo vs Artificial Intelligence Bot)
    if (cleanCapacity === 1) {
      const botWord = BOT_WORDS[Math.floor(Math.random() * BOT_WORDS.length)];
      const botPlayer: Player = {
        id: "system_bot",
        name: "🤖 Cortex Bot",
        socketId: "system",
        ready: true,
        word: botWord,
        score: 0,
        guesses: [],
        disconnected: false
      };
      newRoom.players.push(botPlayer);
      newRoom.phase = "word_submission";
    }

    rooms.set(roomCode, newRoom);
    socket.join(roomCode);

    socket.emit("room_created", { roomCode });
    broadcastRoomState(roomCode);
    console.log(`Room created: ${roomCode} by ${playerId} with capacity ${cleanCapacity}`);
  });

  // Join room handler
  socket.on("join_room", (data: { roomCode: string; playerId: string; name: string }) => {
    const { roomCode, playerId, name } = data;
    const upperCode = roomCode.toUpperCase().trim();
    const room = rooms.get(upperCode);

    if (!room) {
      socket.emit("join_error", "Room not found. Check the code and try again.");
      return;
    }

    const playerName = name || `Gladiator ${Math.floor(Math.random() * 900 + 100)}`;

    // Reconnection check
    const existingPlayer = room.players.find(p => p.id === playerId);
    if (existingPlayer) {
      existingPlayer.socketId = socket.id;
      existingPlayer.disconnected = false;
      socket.join(upperCode);

      io.to(upperCode).emit("system_message", {
        type: "rejoin",
        message: `${existingPlayer.name} reconnected to their terminal!`
      });

      broadcastRoomState(upperCode);
      console.log(`Player reconnected: ${playerId} to room ${upperCode}`);
      return;
    }

    // Check if room is full
    const totalOccupants = room.players.length;
    // Capacity defines how many human players are expected, except in solo mode where capacity is 1 but we appended a bot
    const maxAllowedPlayers = room.capacity === 1 ? 2 : room.capacity;

    if (totalOccupants >= maxAllowedPlayers) {
      socket.emit("join_error", `This Arena is already full (Max ${room.capacity} players).`);
      return;
    }

    // Add new participant
    const joiningPlayer: Player = {
      id: playerId,
      name: playerName,
      socketId: socket.id,
      ready: false,
      word: "",
      score: 0,
      guesses: [],
      disconnected: false
    };

    room.players.push(joiningPlayer);
    socket.join(upperCode);

    io.to(upperCode).emit("system_message", {
      type: "join",
      message: `${playerName} joined the Arena!`
    });

    // Check if room has hit target occupancy to start word entries
    if (room.players.length === maxAllowedPlayers) {
      room.phase = "word_submission";
      io.to(upperCode).emit("system_message", {
        type: "word_submission_start",
        message: "Arena full. Submit your code trap words to begin!"
      });
    }

    broadcastRoomState(upperCode);
    console.log(`Player joined: ${playerId} to room ${upperCode}`);
  });

  // Word submission handler
  socket.on("submit_word", (data: { roomCode: string; playerId: string; word: string }) => {
    const { roomCode, playerId, word } = data;
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const cleanedWord = word.trim().toUpperCase();
    if (!cleanedWord) {
      socket.emit("action_error", "Secret phrase cannot be empty.");
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    player.word = cleanedWord;
    player.ready = true;

    io.to(roomCode.toUpperCase()).emit("system_message", {
      type: "ready",
      message: `${player.name} lock in their word!`
    });

    // Evaluate transition to playing state
    const allReady = room.players.every(p => p.ready);
    if (allReady) {
      room.phase = "playing";
      room.currentTurnIndex = 0;
      room.timer = 10;

      io.to(roomCode.toUpperCase()).emit("system_message", {
        type: "start",
        message: "All words locks inside cells. Battle commences!"
      });
      broadcastRoomState(roomCode.toUpperCase());
      triggerBotTurnIfActive(room);
    } else {
      broadcastRoomState(roomCode.toUpperCase());
    }
  });

  // Guess letter handler
  socket.on("guess_letter", (data: { roomCode: string; playerId: string; letter: string }) => {
    const { roomCode, playerId, letter } = data;
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);
    if (!room || room.phase !== "playing") return;

    // Validate turn
    const activePlayer = room.players[room.currentTurnIndex];
    if (!activePlayer || activePlayer.id !== playerId) {
      socket.emit("action_error", "Hold on! It is not your turn yet.");
      return;
    }

    const char = letter.trim().toUpperCase();
    if (char.length !== 1 || char < "A" || char > "Z") {
      socket.emit("action_error", "Invalid letters guess.");
      return;
    }

    if (activePlayer.guesses.includes(char)) {
      socket.emit("action_error", "You have already guessed this letter!");
      return;
    }

    activePlayer.guesses.push(char);

    // Identify target player we are trying to guess
    const myIndex = room.players.findIndex(p => p.id === playerId);
    const targetIndex = (myIndex + 1) % room.players.length;
    const targetPlayer = room.players[targetIndex];

    const occurrences = targetPlayer.word.toUpperCase().split("").filter(c => c === char).length;
    let hit = false;
    if (occurrences > 0) {
      activePlayer.score += occurrences;
      hit = true;

      io.to(upperCode).emit("game_hit", {
        playerRole: myIndex === 0 ? "p1" : "p2",
        playerName: activePlayer.name,
        letter: char,
        occurrences
      });
    } else {
      io.to(upperCode).emit("game_miss", {
        playerRole: myIndex === 0 ? "p1" : "p2",
        playerName: activePlayer.name,
        letter: char
      });
    }

    // Evaluate Victory Condition
    const opponentMasked = maskWord(targetPlayer.word, activePlayer.guesses);
    const won = !opponentMasked.includes("_");

    if (won) {
      room.phase = "winner";
      room.winnerId = activePlayer.id;

      io.to(upperCode).emit("system_message", {
        type: "winner",
        message: `🏆 Victory! ${activePlayer.name} cracked the code of ${targetPlayer.name} first!`
      });
    } else {
      // Switch turns
      room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
      room.timer = 10;

      io.to(upperCode).emit("system_message", {
        type: "turn",
        message: `Turn shifted to ${room.players[room.currentTurnIndex].name}'s terminal.`
      });
    }

    broadcastRoomState(upperCode);
    triggerBotTurnIfActive(room);
  });

  // Chat message & Emoji shouts handler
  socket.on("chat_message", (data: { roomCode: string; playerId: string; message: string }) => {
    const { roomCode, playerId, message } = data;
    const room = rooms.get(roomCode.toUpperCase());
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (!player) return;

    io.to(roomCode.toUpperCase()).emit("chat_message", {
      id: "msg_" + Math.random().toString(36).substring(2, 11),
      playerName: player.name,
      message: message.slice(0, 100),
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    });
  });

  // Play Again cycle handler
  socket.on("play_again", (data: { roomCode: string; playerId: string }) => {
    const { roomCode, playerId } = data;
    const upperCode = roomCode.toUpperCase();
    const room = rooms.get(upperCode);
    if (!room) return;

    const player = room.players.find(p => p.id === playerId);
    if (player) {
      player.ready = true;
    }

    io.to(upperCode).emit("system_message", {
      type: "re-ready",
      message: `${player ? player.name : "Gladiator"} is waiting for another round...`
    });

    const everyoneReady = room.players.every(p => p.ready || p.id === "system_bot");
    if (everyoneReady) {
      // Reset matches
      room.players.forEach(p => {
        p.guesses = [];
        p.score = 0;
        p.word = p.id === "system_bot" ? BOT_WORDS[Math.floor(Math.random() * BOT_WORDS.length)] : "";
        p.ready = p.id === "system_bot" ? true : false;
      });

      room.phase = "word_submission";
      room.winnerId = null;
      room.currentTurnIndex = 0;
      room.timer = 10;

      io.to(upperCode).emit("system_message", {
        type: "reset",
        message: "Arena state fully cleared. Submit your new word shields!"
      });
    }

    broadcastRoomState(upperCode);
  });

  // Disconnection handler
  socket.on("disconnect", () => {
    rooms.forEach((room, roomCode) => {
      let changed = false;
      const playerIdx = room.players.findIndex(p => p.socketId === socket.id);

      if (playerIdx !== -1) {
        room.players[playerIdx].disconnected = true;
        changed = true;
        console.log(`Player ${room.players[playerIdx].name} disconnected from terminal room ${roomCode}`);
      }

      if (changed) {
        // Broadcast disconnection notification
        io.to(roomCode).emit("system_message", {
          type: "disconnect",
          message: `${room.players[playerIdx].name} connection timed out. Ready to resume.`
        });

        broadcastRoomState(roomCode);

        // Schedule deletion in 3 mins
        setTimeout(() => {
          const freshRoom = rooms.get(roomCode);
          if (freshRoom) {
            const allOffline = freshRoom.players.every(p => p.id === "system_bot" || p.disconnected);
            if (allOffline) {
              rooms.delete(roomCode);
              console.log(`Inactivity sweep: Cleared room ${roomCode}`);
            }
          }
        }, 180000);
      }
    });
  });
});

async function findAvailablePort(startPort: number, host: string, maxAttempts = 10): Promise<number> {
  let port = startPort;
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    try {
      await new Promise<void>((resolve, reject) => {
        const onError = (error: NodeJS.ErrnoException) => {
          server.removeListener("listening", onListening);
          reject(error);
        };
        const onListening = () => {
          server.removeListener("error", onError);
          resolve();
        };

        server.once("error", onError);
        server.once("listening", onListening);
        server.listen(port, host);
      });
      return port;
    } catch (error: any) {
      server.removeAllListeners("error");
      server.removeAllListeners("listening");
      if (error?.code === "EADDRINUSE" || error?.code === "EACCES") {
        console.warn(`[Server] Port ${port} unavailable (${error.code}). Trying ${port + 1}...`);
        port += 1;
        continue;
      }
      throw error;
    }
  }
  throw new Error(`Unable to bind to ${host} on ports ${startPort}-${startPort + maxAttempts - 1}`);
}

// Configure Vite integration
async function main() {
  app.get("/api/health", (req, res) => {
    res.json({ status: "healthy", roomsCount: rooms.size });
  });

  if (process.env.NODE_ENV !== "production") {
    // Vite Dev Middleware
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production Assets serving
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const port = await findAvailablePort(DEFAULT_PORT, HOST);
  console.log(`[Server] Listening on http://${HOST}:${port}`);
}

main().catch(err => {
  console.error("Failed to start server", err);
});
