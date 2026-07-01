import React from "react";
import { Volume2, VolumeX, ShieldAlert, Wifi } from "lucide-react";
import { sounds } from "../utils/audio";

interface HeaderProps {
  connected: boolean;
  soundEnabled: boolean;
  onToggleSound: () => void;
  roomCode?: string;
}

export default function Header({
  connected,
  soundEnabled,
  onToggleSound,
  roomCode,
}: HeaderProps) {
  return (
    <header className="w-full flex flex-col sm:flex-row justify-between items-center gap-3 px-3 py-3 glass-panel border-b border-white/10 rounded-b-2xl mt-0">
      <div className="flex items-center gap-2">
        <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 shadow-lg shadow-cyan-500/10 border border-white/10 overflow-hidden">
          <div className="absolute inset-0 bg-white/10" />
          <span className="relative text-xs font-black tracking-[0.28em] text-slate-950 uppercase drop-shadow-sm">
            WG
          </span>
        </div>
        <div>
          <h1 className="font-display font-extrabold text-lg tracking-wider bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-400 bg-clip-text text-transparent">
            WORDGUESS
          </h1>
          <p className="text-[9px] font-mono text-slate-400 uppercase tracking-wider">
            Fast mobile word duel
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-end w-full sm:w-auto">
        {roomCode && (
          <div className="items-center gap-1 bg-slate-900/60 border border-slate-700/50 rounded-lg px-2.5 py-0.5 text-[10px] font-mono font-bold text-slate-300 flex">
            <span className="text-emerald-400">CODE</span>
            <span>:{roomCode}</span>
          </div>
        )}

        <button
          onClick={onToggleSound}
          className={`p-2 rounded-xl border transition-all duration-300 flex items-center justify-center ${
            soundEnabled
              ? "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
              : "bg-slate-800/60 hover:bg-slate-700/60 border-slate-700 text-slate-400"
          }`}
          title={soundEnabled ? "Mute game sounds" : "Unmute game sounds"}
          id="sound-toggle-btn"
        >
          {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
        </button>

        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-xl border text-[10px] font-mono font-medium ${
            connected
              ? "bg-teal-500/5 border-teal-500/30 text-teal-400"
              : "bg-red-500/5 border-red-500/30 text-red-400"
          }`}
          id="network-indicator"
        >
          {connected ? (
            <>
              <Wifi className="h-3.5 w-3.5 animate-pulse text-teal-400" />
              <span>ONLINE</span>
            </>
          ) : (
            <>
              <ShieldAlert className="h-3.5 w-3.5 text-red-400" />
              <span>OFFLINE</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
