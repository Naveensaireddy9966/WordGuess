import React from "react";
import { motion } from "motion/react";
import { Award, RotateCcw, Home, Trophy, Eye } from "lucide-react";
import { RoomState } from "../types";

interface WinnerPageProps {
  roomState: RoomState;
  onPlayAgain: () => void;
  onReturnToLounge: () => void;
  submitting: boolean;
}

export default function WinnerPage({
  roomState,
  onPlayAgain,
  onReturnToLounge,
  submitting,
}: WinnerPageProps) {
  const { winner, myRole, me, opponent } = roomState;

  // Determine actual names and scores of winner/loser
  const isMeWinner = winner === myRole;

  const winnerName = isMeWinner ? (me?.name || "You") : (opponent?.name || "Opponent");
  const winnerScore = isMeWinner ? (me?.score || 0) : (opponent?.score || 0);

  const loserName = isMeWinner ? (opponent?.name || "Opponent") : (me?.name || "You");
  const loserScore = isMeWinner ? (opponent?.score || 0) : (me?.score || 0);

  // Check if I have already pressed "Play Again" (ready status)
  const amReady = me?.ready;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="w-full max-w-2xl mx-auto glass-panel p-8 rounded-3xl border border-white/10 text-center relative overflow-hidden shadow-2xl"
    >
      {/* Background radial glowing gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-gradient-to-tr from-yellow-500/10 to-teal-500/5 rounded-full filter blur-[80px]" />

      <div className="relative z-10 flex flex-col items-center">
        {/* Giant Trophy Icon with Float Animation */}
        <div className="animate-float mb-6">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-yellow-400/20 to-amber-500/10 border-2 border-yellow-400/40 flex items-center justify-center shadow-lg shadow-yellow-500/10">
            <Trophy className="h-12 w-12 text-yellow-400 fill-yellow-400" />
          </div>
        </div>

        <span className="text-[10px] font-mono bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-md px-2.5 py-1 uppercase tracking-widest font-extrabold animate-pulse">
          GAME OVER
        </span>

        <h2 className="text-3xl font-display font-black text-white mt-4">
          🏆 Game over
        </h2>

        <p className="text-teal-400 text-lg font-mono font-bold mt-2">
          {winnerName} won the round
        </p>

        {/* scoreboard Comparison block */}
        <div className="w-full mt-8 grid grid-cols-2 gap-4">
          {/* Winner Profile */}
          <div className="p-5 bg-yellow-500/5 border border-yellow-500/20 rounded-2xl flex flex-col items-center">
            <span className="text-[9px] font-mono text-yellow-400 font-bold uppercase tracking-widest">
              Winner
            </span>
            <span className="text-base font-bold text-white mt-2 truncate w-full">
              {winnerName} {isMeWinner && "(You)"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-1">ATTACKS COMPLETED</span>
            <span className="text-4xl font-mono font-black text-yellow-400 mt-1">
              {winnerScore} pts
            </span>
          </div>

          {/* Loser Profile */}
          <div className="p-5 bg-slate-950/55 border border-slate-900 rounded-2xl flex flex-col items-center">
            <span className="text-[9px] font-mono text-slate-500 font-bold uppercase tracking-widest">
              Loser
            </span>
            <span className="text-base font-bold text-slate-300 mt-2 truncate w-full">
              {loserName} {!isMeWinner && "(You)"}
            </span>
            <span className="text-[10px] font-mono text-slate-500 mt-1">ATTACKS COMPLETED</span>
            <span className="text-4xl font-mono font-black text-slate-500 mt-1">
              {loserScore} pts
            </span>
          </div>
        </div>

        {/* OPPONENT SECRET PHRASE REVEAL */}
        {opponent && (
          <div className="w-full mt-6 bg-slate-950/70 border border-slate-900 p-4 rounded-2xl flex flex-col items-center gap-2">
            <div className="text-[10px] font-mono text-slate-500 tracking-wider uppercase font-bold flex items-center gap-1.5">
              <Eye className="h-3.5 w-3.5 text-teal-400" />
              Words
            </div>
            
            <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl">
                <span className="text-slate-500">Your word:</span>
                <span className="text-emerald-400 font-bold tracking-wider">{me?.word}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-slate-900 border border-slate-850 rounded-xl">
                <span className="text-slate-500">Opponent word:</span>
                <span className="text-rose-400 font-bold tracking-wider">{opponent.maskedWord}</span>
              </div>
            </div>
          </div>
        )}

        {/* Play Again Status waiting alert */}
        {amReady && !opponent?.ready && (
          <div className="mt-6 text-sm text-teal-400 font-mono animate-pulse uppercase tracking-wider font-bold">
            Ready. Waiting for opponent...
          </div>
        )}

        {/* Action button bar */}
        <div className="w-full mt-8 flex flex-col sm:flex-row gap-4">
          <button
            onClick={onPlayAgain}
            disabled={submitting || amReady}
            className={`flex-1 py-3.5 px-6 rounded-2xl font-bold flex items-center justify-center gap-2 transition duration-300 ${
              amReady
                ? "bg-slate-850 border border-slate-800 text-slate-500 cursor-not-allowed"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 active:scale-[0.98]"
            }`}
            id="rematch-btn"
          >
            <RotateCcw className="h-5 w-5" />
            <span>{amReady ? "WAITING" : "PLAY AGAIN"}</span>
          </button>

          <button
            onClick={onReturnToLounge}
            disabled={submitting}
            className="flex-1 py-3.5 px-6 rounded-2xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold flex items-center justify-center gap-2 active:scale-[0.98] transition"
            id="return-lounge-btn"
          >
            <Home className="h-5 w-5" />
            <span>HOME</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
