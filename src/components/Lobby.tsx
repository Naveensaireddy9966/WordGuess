import React, { useState } from "react";
import { Copy, Check, Users, ShieldAlert, ArrowLeft } from "lucide-react";
import { motion } from "motion/react";

interface LobbyProps {
  roomCode: string;
  username: string;
  onExit: () => void;
}

export default function Lobby({ roomCode, username, onExit }: LobbyProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-xl mx-auto glass-panel p-6 sm:p-8 rounded-3xl border border-white/10 shadow-2xl relative"
    >
      {/* Return Button */}
      <button
        onClick={onExit}
        className="absolute left-6 top-6 p-2 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition"
        title="Leave Room"
        id="leave-lobby-btn"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
      </button>

      <div className="flex flex-col items-center text-center mt-6">
        {/* Holographic Radar Pulse Animation */}
<div className="relative flex items-center justify-center h-20 w-20 mb-5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/20 opacity-75 animate-ping" />
        <div className="relative rounded-full h-14 w-14 bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/40 flex items-center justify-center">
          <Users className="h-6 w-6 text-emerald-400 animate-pulse" />
          </div>
        </div>

        <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md px-2.5 py-1 uppercase tracking-widest font-bold">
          ROOM READY
        </span>

        <h3 className="text-xl font-display font-extrabold text-white mt-4">
          Waiting for player
        </h3>
        
        <p className="text-slate-400 text-sm mt-2 max-w-sm">
          Share the code below.
        </p>

        {/* Action Badge Code Banner */}
        <div className="w-full mt-6 bg-slate-950/60 border border-slate-800 rounded-2xl p-5 sm:p-6 flex flex-col items-center justify-center gap-4">
          <div className="text-[10px] font-mono tracking-widest text-slate-500 uppercase font-bold">
            ROOM CODE
          </div>
          <div className="font-mono text-4xl font-extrabold text-white tracking-widest select-all">
            {roomCode}
          </div>

          <button
            onClick={handleCopy}
            className={`px-4 py-2.5 rounded-xl text-xs font-mono font-bold border transition-all duration-300 flex items-center gap-2 ${
              copied
                ? "bg-emerald-500/10 hover:bg-emerald-500/15 border-emerald-500/40 text-emerald-400"
                : "bg-slate-800 hover:bg-slate-700 active:scale-[0.98] border-slate-700 text-slate-300"
            }`}
            id="copy-code-btn"
          >
            {copied ? (
              <>
                <Check className="h-4 w-4 stroke-[2.5px]" />
                <span>COPIED</span>
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                <span>COPY CODE</span>
              </>
            )}
          </button>
        </div>

        {/* Present Status Grid */}
        <div className="w-full mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-5 border-t border-white/5">
          <div className="flex flex-col items-center p-3 bg-slate-900/45 border border-slate-800 rounded-xl">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">You</span>
            <span className="text-sm font-semibold text-white mt-1 uppercase tracking-wide truncate max-w-full">
              {username || "You"}
            </span>
            <span className="text-[10px] font-mono text-emerald-400 mt-0.5">Ready</span>
          </div>

          <div className="flex flex-col items-center p-3 bg-slate-900/45 border border-dashed border-slate-800 rounded-xl opacity-60">
            <span className="text-[9px] font-mono text-slate-500 uppercase font-bold">Opponent</span>
            <span className="text-sm font-semibold text-slate-400 mt-1 uppercase tracking-wide">
              Searching...
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-0.5">Waiting</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
