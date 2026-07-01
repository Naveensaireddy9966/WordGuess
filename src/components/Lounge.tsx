import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { Play, Plus, Key, User, Sparkles, Flame, Trophy } from "lucide-react";

interface LoungeProps {
  username: string;
  onChangeUsername: (name: string) => void;
  onCreateRoom: (capacity: number) => void;
  onJoinRoom: (roomCode: string) => void;
  submitting: boolean;
}

export default function Lounge({
  username,
  onChangeUsername,
  onCreateRoom,
  onJoinRoom,
  submitting,
}: LoungeProps) {
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");
  const [selectedCapacity, setSelectedCapacity] = useState<number>(2);
  const [winStreak, setWinStreak] = useState<number>(0);

  useEffect(() => {
    const savedStreak = parseInt(localStorage.getItem("word_battle_win_streak") || "0", 10);
    setWinStreak(isNaN(savedStreak) ? 0 : savedStreak);
  }, []);

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setLocalError("Please enter a 6-character room code.");
      return;
    }
    if (code.trim().length !== 6) {
      setLocalError("Room code must be exactly 6 characters.");
      return;
    }
    setLocalError("");
    onJoinRoom(code.toUpperCase().trim());
  };

  const handleRandomizeName = () => {
    const prefixed = ["Nexus", "Cipher", "Vortex", "Specter", "Rogue", "Matrix", "Phantom"];
    const suffixed = ["X", "Core", "Alpha", "Apex", "Byte", "Slash", "Echo"];
    const randomName = `${prefixed[Math.floor(Math.random() * prefixed.length)]} ${
      suffixed[Math.floor(Math.random() * suffixed.length)]
    }`;
    onChangeUsername(randomName);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 px-4 md:px-0"
    >
      {/* Visual Welcome Board */}
      <div className="md:col-span-2 glass-panel p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-display font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-400" />
            Play now
          </h2>
          <p className="text-slate-300 text-xs mt-1">
            Quick mobile word duels. Create or join with a room code.
          </p>

          {/* Win Streak Indicator */}
          {winStreak > 0 && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 font-mono text-xs font-bold rounded-full mt-2.5 shadow-sm shadow-amber-500/5 animate-pulse">
              <Flame className="h-3.5 w-3.5 stroke-[2.5px] fill-amber-500/25" />
              <span>{winStreak} WIN STREAK</span>
            </div>
          )}
        </div>

        {/* Username Config Panel */}
        <div className="w-full sm:w-auto min-w-[280px]">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-1.5 font-bold">
            Your Name
          </label>
          <div className="relative flex items-center gap-2">
            <span className="absolute left-3 text-slate-400">
              <User className="h-4 w-4" />
            </span>
            <input
              type="text"
              value={username}
              onChange={(e) => onChangeUsername(e.target.value.slice(0, 16))}
              placeholder="e.g. Cipher X"
              maxLength={16}
              className="w-full pl-9 pr-24 py-2.5 bg-slate-950/60 border border-slate-700/60 text-white rounded-xl placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm font-semibold transition"
              id="alias-input"
            />
            <button
              onClick={handleRandomizeName}
              type="button"
              className="absolute right-2 px-2 py-1 bg-slate-800 hover:bg-slate-700 active:bg-slate-600 transition text-[10px] font-mono text-emerald-400 rounded-md font-bold"
              id="randomize-name-btn"
            >
              RANDOM
            </button>
          </div>
        </div>
      </div>

      {/* Action Block 1: Create Game */}
      <motion.div
        whileHover={{ y: -4 }}
        className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-emerald-500/20 hover:shadow-xl hover:shadow-emerald-500/5 transition duration-300 min-h-[300px]"
      >
        <div>
          <span className="text-[10px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-2 py-1 uppercase tracking-widest">
            Create
          </span>
          <h3 className="text-2xl font-display font-extrabold text-white mt-4">
            Create a room
          </h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Quick game. Pick 1–4 players and share the code.
          </p>

          {/* Player Capacity Selector */}
          <div className="mt-5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-400 mb-2 font-bold">
              PLAYERS
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[1, 2, 3, 4].map((capValue) => (
                <button
                  key={capValue}
                  type="button"
                  onClick={() => setSelectedCapacity(capValue)}
                  className={`py-2 px-1 rounded-xl text-xs font-mono font-bold transition flex flex-col items-center justify-center gap-0.5 ${
                    selectedCapacity === capValue
                      ? "bg-emerald-500/20 border border-emerald-400 text-emerald-300 shadow-md shadow-emerald-500/10"
                      : "bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-slate-300 hover:bg-slate-900/60"
                  }`}
                  id={`capacity-btn-${capValue}`}
                >
                  <span className="text-sm">{capValue}</span>
                  <span className="text-[8px] uppercase tracking-tighter text-slate-500 font-extrabold">
                    {capValue === 1 ? "Solo" : capValue === 2 ? "1v1" : `${capValue} Players`}
                  </span>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-2 pl-0.5">
              {selectedCapacity === 1 && "🤖 Solo: Play against the bot."}
              {selectedCapacity === 2 && "⚡ 1v1: Quick two-player duel."}
              {selectedCapacity === 3 && "⚔️ 3 players: Pass the turn around."}
              {selectedCapacity === 4 && "👑 4 players: Free-for-all word guess."}
            </p>
          </div>
        </div>

        <button
          onClick={() => onCreateRoom(selectedCapacity)}
          disabled={submitting}
          className="w-full mt-5 py-3 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all duration-300 font-bold text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
          id="create-arena-btn"
        >
          {submitting ? (
            <div className="h-4.5 w-4.5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <Plus className="h-4.5 w-4.5 stroke-[2.5px]" />
              <span>CREATE</span>
            </>
          )}
        </button>
      </motion.div>

      {/* Action Block 2: Join Game */}
      <motion.div
        whileHover={{ y: -4 }}
        className="glass-panel p-6 rounded-2xl border border-white/10 flex flex-col justify-between hover:border-teal-500/20 hover:shadow-xl hover:shadow-teal-500/5 transition duration-300 min-h-[300px]"
      >
        <div>
          <span className="text-[10px] font-mono font-bold bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md px-2 py-1 uppercase tracking-widest">
            Join
          </span>
          <h3 className="text-2xl font-display font-extrabold text-white mt-4">
            Join with code
          </h3>
          <p className="text-slate-400 text-xs mt-2 leading-relaxed">
            Enter the 6-character room code.
          </p>
        </div>

        <form onSubmit={handleJoin} className="mt-6">
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Key className="h-4.5 w-4.5" />
            </span>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.slice(0, 6).toUpperCase());
                setLocalError("");
              }}
              placeholder="ENTER CODE"
              maxLength={6}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-950/60 border border-slate-700/60 text-white font-mono font-bold rounded-2xl placeholder:text-slate-600 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none text-center tracking-widest transition"
              id="join-code-input"
            />
          </div>

          {localError && (
            <p className="text-xs font-mono text-red-400 mt-1.5 flex items-center gap-1">
              <span>●</span> {localError}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting || code.trim().length !== 6}
            className="w-full mt-4 py-3 px-4 rounded-2xl bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border border-slate-750 text-emerald-400 hover:text-emerald-300 disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 font-bold flex items-center justify-center gap-2 shadow-lg"
            id="join-arena-btn"
          >
            {submitting ? (
              <div className="h-4.5 w-4.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Play className="h-4 w-4 fill-emerald-400 stroke-none" />
                <span>JOIN</span>
              </>
            )}
          </button>
        </form>
      </motion.div>
    </motion.div>
  );
}

