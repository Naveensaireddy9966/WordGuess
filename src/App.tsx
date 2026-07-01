/// <reference types="vite/client" />
import React, { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, WifiOff, X } from "lucide-react";

import Header from "./components/Header";
import Lounge from "./components/Lounge";
import Lobby from "./components/Lobby";
import WordSubmission from "./components/WordSubmission";
import Battlefield from "./components/Battlefield";
import WinnerPage from "./components/WinnerPage";

import { RoomState } from "./types";
import { sounds } from "./utils/audio";

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [username, setUsername] = useState("");
  const [roomCode, setRoomCode] = useState("");
  const [playerId, setPlayerId] = useState("");
  const [gameState, setGameState] = useState<RoomState | null>(null);
  const [chatHistory, setChatHistory] = useState<{ id: string; playerName: string; message: string; timestamp: string }[]>([]);
  const [showSplash, setShowSplash] = useState(false);
  const [showNameModal, setShowNameModal] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameError, setNameError] = useState("");

  // Local app states
  const [submitting, setSubmitting] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  // Get or Create Player ID
  useEffect(() => {
    let savedId = sessionStorage.getItem("word_battle_player_id");
    if (!savedId) {
      savedId = "player_" + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem("word_battle_player_id", savedId);
    }
    setPlayerId(savedId);

    // Load stored player name or show the welcome splash for first-time users.
    const savedName = localStorage.getItem("word_guess_username") || localStorage.getItem("word_battle_username");
    if (savedName) {
      setUsername(savedName);
      setShowSplash(false);
    } else {
      setUsername("");
      setShowSplash(true);
    }

    // Connect to Socket.io (using environment variable or auto-detect)
    const socketUrl = import.meta.env.VITE_SOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });
    setSocket(newSocket);

    newSocket.on("connect", () => {
      setConnected(true);
      console.log("Connected to Battle Server:", socketUrl);
      
      // Auto-rejoin on refresh if there was a running game
      const lastRoom = sessionStorage.getItem("word_battle_last_room");
      const lastUsername = localStorage.getItem("word_battle_username") || "Gladiator";
      if (lastRoom && savedId) {
        newSocket.emit("join_room", {
          roomCode: lastRoom,
          playerId: savedId,
          name: lastUsername
        });
      }
    });

    newSocket.on("disconnect", () => {
      setConnected(false);
      console.log("Disconnected from Battle Server");
    });

    // Handle Join exceptions
    newSocket.on("join_error", (errorMsg: string) => {
      setErrorMessage(errorMsg);
      setSubmitting(false);
      // Clean up local reference since room was invalid
      sessionStorage.removeItem("word_battle_last_room");
      setRoomCode("");
    });

    // Handle game action errors
    newSocket.on("action_error", (errorMsg: string) => {
      setErrorMessage(errorMsg);
      setSubmitting(false);
    });

    // Room created confirmation
    newSocket.on("room_created", ({ roomCode }: { roomCode: string }) => {
      setRoomCode(roomCode);
      sessionStorage.setItem("word_battle_last_room", roomCode);
      setSubmitting(false);
    });

    // Synchronize global authoritative Room State
    newSocket.on("room_state", (state: RoomState) => {
      setGameState((prev) => {
        const prevPhase = prev?.phase || "waiting";
        if (prevPhase !== "winner" && state.phase === "winner" && state.winnerId) {
          if (state.winnerId === savedId) {
            const currentStreak = parseInt(localStorage.getItem("word_battle_win_streak") || "0", 10);
            localStorage.setItem("word_battle_win_streak", (isNaN(currentStreak) ? 1 : currentStreak + 1).toString());
          } else {
            localStorage.setItem("word_battle_win_streak", "0");
          }
        }
        return state;
      });
      setRoomCode(state.code);
      setSubmitting(false);
      
      // Keep codes saved for quick refreshes
      sessionStorage.setItem("word_battle_last_room", state.code);
    });

    // Chat Message listener
    newSocket.on("chat_message", (msg: { id: string; playerName: string; message: string; timestamp: string }) => {
      setChatHistory((prev) => [...prev, msg].slice(-100));
    });

    // Turn timer ticking sounds/feed triggers
    newSocket.on("timer_tick", ({ timer }: { timer: number }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return { ...prev, timer };
      });
      // Play soft clock ticks for urgent timers
      if (timer <= 8) {
        sounds.playClockTick();
      }
    });

    // Turn timed out
    newSocket.on("turn_timeout", ({ currentTurn, timer }: { currentTurn: "p1" | "p2"; timer: number }) => {
      setGameState((prev) => {
        if (!prev) return null;
        return { ...prev, currentTurn, timer };
      });
      sounds.playTimeout();
    });

    // Game guess HIT sound
    newSocket.on("game_hit", () => {
      sounds.playHit();
    });

    // Game guess MISS sound
    newSocket.on("game_miss", () => {
      sounds.playMiss();
    });

    // Hint used - reveals a letter
    newSocket.on("hint_used", ({ playerId: hintUserId, hintsRemaining }: { playerId: string; hintsRemaining: number }) => {
      setGameState((prev) => {
        if (!prev || !prev.me) return prev;
        if (hintUserId === prev.me.id) {
          return {
            ...prev,
            me: {
              ...prev.me,
              hintsRemaining: hintsRemaining
            }
          };
        }
        return prev;
      });
      sounds.playHit(); // Play positive sound for hint
    });

    // Global in-game notifications
    newSocket.on("system_message", (data: { type: string; message: string }) => {
      if (data.type === "join" || data.type === "reset") {
        sounds.playJoin();
      } else if (data.type === "winner") {
        sounds.playVictory();
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // Sync username changes to storage
  const handleUsernameChange = (name: string) => {
    const safeName = name.trim().slice(0, 16);
    setUsername(safeName);
    localStorage.setItem("word_guess_username", safeName);
    localStorage.setItem("word_battle_username", safeName);
    localStorage.setItem("word_battle_username_custom", "true");
  };

  const handleStartTap = () => {
    if (!username) {
      setShowNameModal(true);
    }
  };

  const handleSaveName = () => {
    const safeName = nameDraft.trim().slice(0, 16);
    if (safeName.length < 2) {
      setNameError("Use 2-16 letters for your name.");
      return;
    }

    setUsername(safeName);
    localStorage.setItem("word_guess_username", safeName);
    localStorage.setItem("word_battle_username", safeName);
    localStorage.setItem("word_battle_username_custom", "true");
    setShowSplash(false);
    setShowNameModal(false);
    setNameDraft("");
    setNameError("");
  };

  // Create game trigger
  const handleCreateRoom = (capacity: number) => {
    if (!socket || !connected) {
      setErrorMessage("Network disengaged. Check connection first.");
      return;
    }
    setSubmitting(true);
    socket.emit("create_room", { playerId, name: username, capacity });
  };

  // Join game trigger
  const handleJoinRoom = (codeToJoin: string) => {
    if (!socket || !connected) {
      setErrorMessage("Network disengaged. Check connection first.");
      return;
    }
    setSubmitting(true);
    setRoomCode(codeToJoin);
    socket.emit("join_room", { roomCode: codeToJoin, playerId, name: username });
  };

  // Submit word puzzle
  const handleSubmitWord = (phrase: string) => {
    if (!socket || !roomCode) return;
    setSubmitting(true);
    socket.emit("submit_word", { roomCode, playerId, word: phrase });
  };

  // Guess targeted letter
  const handleGuessLetter = (letter: string) => {
    if (!socket || !roomCode) return;
    socket.emit("guess_letter", { roomCode, playerId, letter });
  };

  // Use hint to reveal a letter
  const handleUseHint = (letter: string) => {
    if (!socket || !roomCode) return;
    socket.emit("use_hint", { roomCode, playerId, letter });
  };

  // Play Again request
  const handlePlayAgain = () => {
    if (!socket || !roomCode) return;
    socket.emit("play_again", { roomCode, playerId });
  };

  // Send Chat message
  const handleSendMessage = (msg: string) => {
    if (!socket || !roomCode) return;
    socket.emit("chat_message", { roomCode, playerId, message: msg });
  };

  // Reset lobby/room states
  const handleReturnToLounge = () => {
    sessionStorage.removeItem("word_battle_last_room");
    setRoomCode("");
    setGameState(null);
    setChatHistory([]);
    setErrorMessage("");
  };

  // Toggle synthesized audio settings
  const handleToggleSound = () => {
    const updated = sounds.toggleSound();
    setSoundEnabled(updated);
  };

  // Fire confetti upon victory
  useEffect(() => {
    if (gameState?.phase === "winner") {
      import("canvas-confetti").then((module) => {
        const confetti = module.default;
        confetti({
          particleCount: 150,
          spread: 80,
          origin: { y: 0.6 }
        });
      }).catch(err => {
        console.warn("Confetti animation script loading failed.", err);
      });
    }
  }, [gameState?.phase]);

  // Capture Physical Mechanical Keyboard input for desktop friendliness
  useEffect(() => {
    const handlePhysicalKeys = (e: KeyboardEvent) => {
      // Exit if it's not active battle phase, or not my turn, or overlay modals are up
      if (!gameState || gameState.phase !== "playing") return;
      if (gameState.currentTurn !== gameState.myRole) return;
      if (errorMessage) return;

      // Ignore inputs inside standard form text fields
      if (document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA") {
        return;
      }

      const letter = e.key.toUpperCase();
      if (letter >= "A" && letter <= "Z" && letter.length === 1) {
        // Only trigger guess if not already guessed
        const mine = gameState.me;
        if (mine && !mine.guesses.includes(letter)) {
          handleGuessLetter(letter);
        }
      }
    };

    window.addEventListener("keydown", handlePhysicalKeys);
    return () => window.removeEventListener("keydown", handlePhysicalKeys);
  }, [gameState, errorMessage, roomCode]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col justify-between overflow-x-hidden pb-12 selection:bg-emerald-500/30 selection:text-emerald-300">
      
      {/* 1. TOP HEADER NAVIGATION */}
      <Header
        connected={connected}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        roomCode={gameState?.code || roomCode}
      />

      {/* 2. ERROR OVERLAY TOAST */}
      <AnimatePresence>
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-24 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            <div className="bg-slate-900 border-2 border-red-500 rounded-2xl p-4 shadow-xl shadow-red-500/10 flex items-start gap-3 relative">
              <div className="p-1.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg">
                <AlertTriangle className="h-4.5 w-4.5" />
              </div>
              <div className="flex-1 pr-6">
                <h4 className="text-xs font-mono font-bold text-red-400 uppercase tracking-widest">
                  Arena Security Alert
                </h4>
                <p className="text-slate-300 text-xs mt-1 leading-relaxed font-mono">
                  {errorMessage}
                </p>
              </div>
              <button
                onClick={() => setErrorMessage("")}
                className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-800 text-slate-500 hover:text-white transition"
                id="close-error-btn"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* OFF-LINE NETWORK INTERRUPTION OVERLAY */}
      {!connected && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center backdrop-blur-sm">
          <div className="p-4 bg-red-500/15 border border-red-500/30 text-rose-500 rounded-full animate-pulse mb-4">
            <WifiOff className="h-10 w-10" />
          </div>
          <h3 className="text-2xl font-display font-black text-white">Connection lost</h3>
          <p className="text-slate-400 text-sm mt-2 max-w-xs leading-relaxed">
            Reconnecting to the game server...
          </p>
        </div>
      )}

      {/* 3. MAIN GAMEPLAY BODY CONTAINER */}
      <main className="flex-1 py-10 flex flex-col items-center justify-center gap-10 relative">
        <AnimatePresence mode="wait">

          {showSplash ? (
            <motion.div
              key="splash"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 flex items-center justify-center px-6"
            >
              <motion.div
                onClick={handleStartTap}
                className="relative w-full max-w-xl rounded-[2.5rem] border border-white/10 bg-slate-950/95 shadow-2xl shadow-slate-950/50 backdrop-blur-xl cursor-pointer overflow-hidden"
                initial={{ scale: 0.95 }}
                animate={{ scale: [0.96, 1, 0.96] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 via-emerald-500/10 to-slate-950/60" />
                <div className="absolute inset-0 pointer-events-none">
                  <motion.span
                    animate={{ x: [0, 12, 0], y: [0, -10, 0], opacity: [0.8, 1, 0.8] }}
                    transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
                    className="absolute left-8 top-12 rounded-3xl border border-white/10 bg-white/5 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-slate-200"
                  >
                    PLAY
                  </motion.span>
                  <motion.span
                    animate={{ x: [0, -10, 0], y: [0, 8, 0], opacity: [0.75, 1, 0.75] }}
                    transition={{ repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
                    className="absolute right-12 top-24 rounded-3xl border border-white/10 bg-cyan-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-cyan-200"
                  >
                    GUESS
                  </motion.span>
                  <motion.span
                    animate={{ x: [0, -14, 0], y: [0, -8, 0], opacity: [0.7, 1, 0.7] }}
                    transition={{ repeat: Infinity, duration: 5.4, ease: "easeInOut" }}
                    className="absolute left-16 bottom-24 rounded-3xl border border-white/10 bg-emerald-500/10 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-emerald-200"
                  >
                    ROUND
                  </motion.span>
                  <motion.span
                    animate={{ x: [0, 10, 0], y: [0, -6, 0], opacity: [0.75, 1, 0.75] }}
                    transition={{ repeat: Infinity, duration: 4.8, ease: "easeInOut" }}
                    className="absolute right-10 bottom-14 rounded-3xl border border-white/10 bg-slate-800/90 px-4 py-2 text-[11px] uppercase tracking-[0.25em] text-slate-100"
                  >
                    WORD
                  </motion.span>
                </div>
                <div className="relative flex min-h-[450px] flex-col items-center justify-center gap-6 p-8 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-gradient-to-br from-emerald-400 to-cyan-400 shadow-xl shadow-cyan-500/20 text-slate-950 text-2xl font-black tracking-[0.45em]">
                    WG
                  </div>
                  <motion.h1
                    initial={{ y: 24, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="text-5xl sm:text-6xl font-display font-extrabold uppercase tracking-[0.3em] text-transparent bg-gradient-to-r from-emerald-300 via-teal-200 to-cyan-300 bg-clip-text"
                  >
                    WORDGUESS
                  </motion.h1>
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-sm sm:text-base text-slate-400 max-w-xl leading-relaxed"
                  >
                    Tap anywhere to begin.
                  </motion.p>
                  <motion.div
                    animate={{ y: [0, 8, 0] }}
                    transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut" }}
                    className="rounded-full border border-slate-600 bg-slate-900/80 px-4 py-2 text-xs uppercase tracking-[0.35em] text-slate-300 font-semibold"
                  >
                    Tap to continue
                  </motion.div>
                </div>
              </motion.div>
            </motion.div>
          ) : null}

          {showNameModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/90 px-4"
            >
              <motion.div
                initial={{ scale: 0.96, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/95 p-6 shadow-2xl shadow-slate-950/40"
              >
                <h2 className="text-xl font-display font-extrabold text-white">
                  Who are you?
                </h2>
                <p className="mt-2 text-sm text-slate-400">
                  Enter a name to save for next time. This will be your play name.
                </p>
                <label className="mt-6 block text-[10px] font-mono uppercase tracking-widest text-slate-500">
                  Your name
                </label>
                <input
                  value={nameDraft}
                  onChange={(e) => {
                    setNameDraft(e.target.value);
                    setNameError("");
                  }}
                  placeholder="Type your name"
                  className="mt-2 w-full rounded-2xl border border-slate-700/80 bg-slate-950/80 px-4 py-3 text-white outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                />
                {nameError && (
                  <p className="mt-2 text-xs text-rose-400">{nameError}</p>
                )}
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setShowNameModal(false)}
                    className="rounded-2xl border border-slate-700/80 px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-slate-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveName}
                    className="rounded-2xl bg-gradient-to-r from-emerald-500 to-cyan-500 px-4 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-cyan-400 transition"
                  >
                    Save Name
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}

          {!showSplash && !gameState && !roomCode && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="w-full"
              key="lounge"
            >
              <Lounge
                username={username}
                onChangeUsername={handleUsernameChange}
                onCreateRoom={handleCreateRoom}
                onJoinRoom={handleJoinRoom}
                submitting={submitting}
              />
            </motion.div>
          )}

          {(gameState?.phase === "waiting" || (!gameState && roomCode)) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full"
              key="lobby"
            >
              <Lobby
                roomCode={roomCode}
                username={username}
                onExit={handleReturnToLounge}
              />
            </motion.div>
          )}

          {gameState?.phase === "word_submission" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="w-full"
              key="submission"
            >
              <WordSubmission
                roomState={gameState}
                onSubmitWord={handleSubmitWord}
                submitting={submitting}
              />
            </motion.div>
          )}

          {gameState?.phase === "playing" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-10"
              key="playing-arena"
            >
              <Battlefield
                roomState={gameState}
                onGuessLetter={handleGuessLetter}
                onUseHint={handleUseHint}
                submitting={submitting}
                onSendMessage={handleSendMessage}
                chatHistory={chatHistory}
              />
            </motion.div>
          )}

          {gameState?.phase === "winner" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full space-y-10"
              key="winner-arena"
            >
              <WinnerPage
                roomState={gameState}
                onPlayAgain={handlePlayAgain}
                onReturnToLounge={handleReturnToLounge}
                submitting={submitting}
              />
            </motion.div>
          )}

        </AnimatePresence>
      </main>

    </div>
  );
}
