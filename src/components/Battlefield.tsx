import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { ShieldAlert, Timer, Award, User, Keyboard, Check, AlertCircle, MessageSquare, X } from "lucide-react";
import { RoomState } from "../types";

interface BattlefieldProps {
  roomState: RoomState;
  onGuessLetter: (letter: string) => void;
  onUseHint?: (letter: string) => void;
  submitting: boolean;
  onSendMessage: (msg: string) => void;
  chatHistory: { id: string; playerName: string; message: string; timestamp: string }[];
}

export default function Battlefield({
  roomState,
  onGuessLetter,
  onUseHint,
  submitting,
  onSendMessage,
  chatHistory,
}: BattlefieldProps) {
  const [isChatOpen, setIsChatOpen] = React.useState(false);
  const { currentTurn, myRole, me, opponent, timer } = roomState;
  
  // Clean isMyTurn bug fix based on authoritative turn ID
  const isMyTurn = roomState.currentTurnId === me?.id;
  const activePlayerName = roomState.playersList?.find(p => p.isTurn)?.name || opponent?.name || "Opponent";

  // Generate on-screen keyboard keys A-Z
  const keys = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

  // Get unrevealed letters from opponent's word for hint
  const getUnrevealedLetters = () => {
    if (!opponent?.maskedWord) return [];
    const unrevealed: string[] = [];
    for (let char of opponent.maskedWord) {
      if (char === "_" && !unrevealed.includes(char)) {
        unrevealed.push(char);
      }
    }
    // Get actual letters from the full word (backend should provide this or we guess)
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    return alphabet.filter(letter => !me?.guesses.includes(letter));
  };

  const handleHintClick = () => {
    if (!isMyTurn || submitting) return;
    if ((me?.hintsRemaining || 0) <= 0) return;
    
    // Get unrevealed letters and pick random
    const unrevealed = getUnrevealedLetters();
    if (unrevealed.length > 0) {
      const randomLetter = unrevealed[Math.floor(Math.random() * unrevealed.length)];
      if (onUseHint) {
        onUseHint(randomLetter);
      }
    }
  };

  const handleKeyClick = (letter: string) => {
    if (!isMyTurn || submitting) return;
    if (me?.guesses.includes(letter)) return;
    onGuessLetter(letter);
  };

  // Check if a guessed key is correct or incorrect
  const getKeyStatus = (letter: string) => {
    if (!me || !me.guesses.includes(letter)) return "untouched";
    
    // If opponent has submitted their word, check if the letter was a hit
    if (opponent && opponent.maskedWord) {
      const hit = opponent.maskedWord.toUpperCase().includes(letter);
      return hit ? "hit" : "miss";
    }
    return "guessed";
  };

  // Helper to split opponent masked word into words for grid word-wrapping
  const getOpponentMaskedWords = () => {
    if (!opponent || !opponent.maskedWord) return [];
    return opponent.maskedWord.split(" ");
  };

  // Helper to split own masked word for defense grid
  const getOwnMaskedWords = () => {
    if (!me || !me.maskedOwnWord) return [];
    return me.maskedOwnWord.split(" ");
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col lg:flex-row gap-4 px-3 md:px-0 relative pb-14">
      
      {/* FLOATING LUDO-STYLE CHAT TRIGGER BUTTON - Visible on both but acts as awesome quick access */}
      <div className="fixed bottom-4 right-4 z-40">
        <button
          onClick={() => setIsChatOpen(true)}
          className="relative group p-3 sm:p-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-full shadow-lg shadow-emerald-500/30 flex items-center justify-center gap-1.5 transform hover:scale-105 active:scale-95 transition"
        >
          <MessageSquare className="h-4.5 w-4.5" />
          <span className="text-[10px] sm:text-xs font-mono tracking-wider uppercase font-extrabold pr-0.5">CHAT</span>
          {chatHistory.length > 0 && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-rose-500 text-white border border-slate-950 rounded-full text-[9px] flex items-center justify-center font-mono font-bold animate-pulse">
              {chatHistory.slice(-9).length}
            </span>
          )}
        </button>
      </div>

      {/* LUDO-STYLE CHAT OVERLAY DRAWER */}
      <AnimatePresence>
        {isChatOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsChatOpen(false)}
              className="absolute inset-0 bg-slate-950/85 backdrop-blur-md"
            />

            {/* Chat Box Panel */}
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              className="relative w-full max-w-sm bg-slate-900/95 border border-white/10 rounded-2xl p-3 shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-2 border-b border-white/5 mb-3">
                <div className="flex items-center gap-1.5">
                  <div className="p-1 px-2.5 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                    <span className="inline-block w-1.5 bg-emerald-400 h-1.5 rounded-full animate-ping" />
                    Chat
                  </div>
                </div>
                <button
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 bg-slate-800 hover:bg-slate-705 hover:text-white text-slate-400 rounded-full transition"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Chat history list */}
              <div className="flex-1 overflow-y-auto mb-3 bg-slate-950/90 rounded-xl p-3 border border-slate-950 flex flex-col gap-1.5 font-mono scrollbar-thin max-h-[200px]">
                {chatHistory.length === 0 ? (
                  <div className="text-slate-600 text-center text-[10px] my-auto">
                    No messages yet. Say hi.
                  </div>
                ) : (
                  chatHistory.map((msg) => (
                    <div key={msg.id} className="text-[10px] leading-relaxed break-words py-0.5 border-b border-white/[0.01]">
                      <span className="text-slate-500 text-[8px] mr-1">[{msg.timestamp}]</span>
                      <strong className="text-teal-400">{msg.playerName}:</strong>{" "}
                      <span className="text-slate-100">{msg.message}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Quick emojis block */}
              <div className="mb-3">
                <span className="block text-[8px] font-mono uppercase tracking-wider text-slate-500 mb-1 font-bold pl-0.5">
                  Quick emoji:
                </span>
                <div className="grid grid-cols-6 gap-1">
                  {["😂", "😎", "😮", "😭", "😡", "👍", "🎉", "🔥", "👑", "🎯", "🤖", "🥱", "😈", "⚡", "💩", "💀"].map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => {
                        onSendMessage(emoji);
                      }}
                      className="py-1 bg-slate-800/80 hover:bg-slate-700 active:scale-90 border border-slate-750 hover:border-slate-600 text-base rounded-md transition flex items-center justify-center font-bold"
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Text box sender flow */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const input = document.getElementById("pop-chat-input") as HTMLInputElement;
                  if (input && input.value.trim()) {
                    onSendMessage(input.value.trim());
                    input.value = "";
                  }
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  id="pop-chat-input"
                  maxLength={65}
                  placeholder="Type message..."
                  className="flex-1 px-2 py-2 bg-slate-950/50 border border-slate-800 text-white rounded-xl placeholder:text-slate-600 focus:border-emerald-500 outline-none text-[10px] transition"
                />
                <button
                  type="submit"
                  className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 font-extrabold text-slate-950 rounded-lg text-[10px] transition active:scale-95"
                >
                  SEND
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 1. Duel Arena Control Column (Shows SECOND on mobile or tab (order-2), FIRST on desktop (lg:order-1)) */}
      <div className="w-full lg:w-1/3 order-2 lg:order-1 space-y-6">
        
        {/* Game Master Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Background Light */}
          <div className={`absolute top-0 right-0 w-32 h-32 rounded-full filter blur-[40px] opacity-20 -mr-10 -mt-10 transition-colors duration-300 ${
            isMyTurn ? "bg-emerald-500" : "bg-red-500"
          }`} />

          <div className="flex justify-between items-center pb-4 border-b border-white/5">
            <span className="text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold">
              Room
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-slate-900 border border-slate-700/50 rounded-md text-[10px] font-mono text-slate-300">
              <span className="text-emerald-400">CODE:</span>
              <span className="font-bold">{roomState.code}</span>
            </div>
          </div>

          {/* TURN INDICATOR & COUNTDOWN */}
          <div className="py-6 flex flex-col items-center text-center">
            <AnimatePresence mode="wait">
              {isMyTurn ? (
                <motion.div
                  key="my-turn"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center"
                >
                  <span className="text-xs font-mono font-bold text-emerald-400 tracking-widest uppercase">
                    ★ YOUR TURN ★
                  </span>
                  <div className="text-slate-200 text-[11px] font-mono mt-1 font-bold">
                    Guess now
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="opponent-turn"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  className="px-4 py-2 bg-red-500/10 border border-red-500/30 rounded-2xl text-center"
                >
                  <span className="text-xs font-mono font-bold text-red-400 tracking-widest uppercase">
                    WAIT
                  </span>
                  <div className="text-slate-300 text-[11px] font-mono mt-1 font-bold">
                    Waiting for {activePlayerName}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* RADIAL / SIMPLE COUNTDOWN GAUGE */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <Timer className={`h-6 w-6 ${timer <= 3 ? "text-red-500 animate-bounce" : "text-emerald-500 animate-pulse"}`} />
              <div className="flex flex-col items-start leading-none">
                <span className={`text-4xl font-mono font-bold tracking-tight ${timer <= 3 ? "text-red-500 font-extrabold animate-pulse" : "text-white"}`}>
                  {String(timer).padStart(2, "0")}s
                </span>
                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest font-semibold mt-1">
                  Seconds Left
                </span>
              </div>
            </div>
            {opponent?.disconnected && (
              <div className="mt-4 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 text-yellow-555 text-yellow-550 text-[10px] font-mono rounded-xl flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5" />
                <span>Opponent Offline, paused</span>
              </div>
            )}
          </div>

          {/* Squeezed Match Scores integrated beautiful HUD (removed raw dual panel card) */}
          <div className="pt-4 border-t border-white/5 space-y-3">
            <div className="flex justify-between items-center text-[10px] font-mono text-slate-400 tracking-wider uppercase font-bold pl-0.5">
              <span>CHAT</span>
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>

            {/* Mini compact chat logs */}
            <div className="h-18 overflow-y-auto bg-slate-950/80 rounded-xl p-2 border border-slate-900/60 flex flex-col gap-1 font-mono text-[10px] scrollbar-thin">
              {chatHistory.length === 0 ? (
                <div className="text-slate-650 text-slate-600 text-center text-[9px] my-auto">
                  No shouts launched yet. Send emojis below!
                </div>
              ) : (
                chatHistory.slice(-5).map((msg) => (
                  <div key={msg.id} className="leading-tight break-words py-0.5 border-b border-white/[0.01]">
                    <strong className="text-teal-400">{msg.playerName}:</strong>{" "}
                    <span className="text-slate-200">{msg.message}</span>
                  </div>
                ))
              )}
            </div>

            {/* Emojis selection bar - compact and tiny as requested */}
            <div className="grid grid-cols-6 gap-1">
              {["😂", "😎", "😮", "😭", "😡", "👍", "🎉", "🔥", "👑", "⚡", "💩", "💀"].map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => onSendMessage(emoji)}
                  className="py-1 bg-slate-950 hover:bg-slate-900 active:scale-95 border border-slate-800 text-xs rounded transition flex items-center justify-center font-bold"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* Quick text shout form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const input = document.getElementById("inline-chat-input") as HTMLInputElement;
                if (input && input.value.trim()) {
                  onSendMessage(input.value.trim());
                  input.value = "";
                }
              }}
              className="flex gap-1"
            >
              <input
                type="text"
                id="inline-chat-input"
                maxLength={50}
                placeholder="Type chat..."
                className="flex-1 px-2.5 py-1.5 bg-slate-950/60 border border-slate-800/80 text-white rounded-lg placeholder:text-slate-600 focus:border-emerald-500 outline-none text-[10px] transition"
              />
              <button
                type="submit"
                className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-400 font-extrabold text-slate-950 rounded-lg text-[10px] transition-colors"
              >
                SEND
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* 2. Interactive Target Arena (Middle / Right) - Shows FIRST on mobile or tab (order-1), SECOND on desktop (lg:order-2) */}
      <div className="w-full lg:w-2/3 order-1 lg:order-2 space-y-6">
        
        {/* OPPONENT WORD DECRYPTOR GRID */}
        <div className="glass-panel p-5 sm:p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center overflow-hidden min-h-[200px]">
          <div className="w-full flex justify-between items-center mb-6">
            <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase font-bold flex items-center gap-1.5">
              <Keyboard className="h-4 w-4 text-emerald-400" />
              Opponent word
            </span>
            <button
              onClick={() => setIsChatOpen(true)}
              className="py-1 px-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-full text-[10px] uppercase font-mono tracking-wider flex items-center gap-1 shadow-md shadow-emerald-500/10 transition animate-pulse"
            >
              <MessageSquare className="h-3 w-3" />
              <span>CHAT</span>
            </button>
          </div>

          {/* RENDER THE OPPONENT'S MASKED WORD/PHRASE */}
          <div className="flex flex-col items-center justify-center gap-y-4 max-w-full w-full">
            {getOpponentMaskedWords().map((wordSlice, wordIdx) => (
              <div 
                key={wordIdx} 
                className="flex justify-center flex-nowrap gap-1 sm:gap-2 max-w-full overflow-x-auto no-scrollbar py-1 pr-1 pl-1 min-w-0"
              >
                {wordSlice.split("").map((char, charIdx) => {
                  const revealed = char !== "_";
                  return (
                    <motion.div
                      key={charIdx}
                      initial={revealed ? { y: -8, scale: 0.95 } : {}}
                      animate={{ y: 0, scale: 1 }}
                      className={`h-11 w-9 text-lg sm:h-13 sm:w-11 sm:text-xl md:h-16 md:w-13 md:text-3xl rounded-xl sm:rounded-2xl flex items-center justify-center font-display font-black border-2 transition-all duration-300 shrink-0 ${
                        revealed
                          ? "bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border-emerald-500/60 text-emerald-300 shadow-lg shadow-emerald-500/10 font-bold"
                          : "bg-slate-950/60 border-slate-750 text-transparent"
                      }`}
                    >
                      {revealed ? char : ""}
                      {!revealed && (
                        <div className="h-0.5 bg-slate-700 w-3.5 rounded-full mt-5 sm:mt-7" />
                      )}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="mt-4 text-[10px] font-mono text-slate-500 uppercase tracking-wider text-center">
            GUESS THE HIDDEN LETTERS IN <strong className="text-emerald-400 font-bold">{opponent?.name}</strong>'s SECRET WORD TO BREAK THEIR DEFENSES
          </div>
        </div>

        {/* PORTABLE DIGITAL KEYBOARD UNIT */}
        <div className="glass-panel p-6 rounded-3xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
              ⌨ Keyboard
            </span>
            <div className="flex items-center gap-2">
              {isMyTurn && (
                <button
                  onClick={handleHintClick}
                  disabled={!isMyTurn || submitting || (me?.hintsRemaining || 0) <= 0}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-widest transition-all duration-200 ${
                    (me?.hintsRemaining || 0) > 0 && isMyTurn
                      ? "bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-slate-950 shadow-lg shadow-amber-500/20 hover:scale-105 active:scale-95"
                      : "bg-slate-800/50 border border-slate-700/50 text-slate-600 cursor-not-allowed opacity-50"
                  }`}
                  title={`Hints remaining: ${me?.hintsRemaining || 0}`}
                >
                  💡 HINT ({me?.hintsRemaining || 0})
                </button>
              )}
              <span className={`font-bold transition-colors ${isMyTurn ? "text-emerald-400 animate-pulse" : "text-slate-500"}`}>
                {isMyTurn ? "Your turn" : "Wait"}
              </span>
            </div>
          </div>

          {isMyTurn ? (
            <>
              {/* Key Layout Grid */}
              <div className="grid grid-cols-7 sm:grid-cols-9 md:grid-cols-10 gap-1.5 sm:gap-2.5">
                {keys.map((letter) => {
                  const status = getKeyStatus(letter);
                  const alreadyGuessed = status !== "untouched";
                  
                  return (
                    <button
                      key={letter}
                      onClick={() => handleKeyClick(letter)}
                      disabled={!isMyTurn || alreadyGuessed || submitting}
                      className={`h-9 sm:h-11 md:h-12 rounded-lg sm:rounded-xl font-display font-extrabold text-xs sm:text-sm transitions-all duration-200 shadow-md ${
                        status === "hit"
                          ? "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 pointer-events-none scale-95 shadow-inner"
                          : status === "miss"
                            ? "bg-rose-500/10 border border-rose-500/20 text-rose-500/50 line-through pointer-events-none scale-95"
                            : alreadyGuessed
                              ? "bg-slate-800/40 border border-slate-800/60 text-slate-500 pointer-events-none scale-95"
                              : isMyTurn
                                ? "bg-slate-800 hover:bg-slate-700 hover:scale-105 active:scale-95 border border-slate-700/60 text-white cursor-pointer"
                                : "bg-slate-900/60 border border-slate-800/40 text-slate-600 cursor-not-allowed"
                      }`}
                      id={`key-${letter}`}
                    >
                      <span className="relative">
                        {letter}
                        {status === "hit" && (
                          <span className="absolute -top-1.5 -right-2 text-[8px] bg-emerald-500 text-slate-950 px-0.5 rounded-full font-sans leading-none font-extrabold flex items-center justify-center">
                            <Check className="h-2 w-2 stroke-[4px]" />
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl flex items-center justify-center gap-2 leading-none">
                <Check className="h-4 w-4 text-emerald-400 animate-pulse shrink-0" />
                <span className="text-[11px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">
                  YOUR TURN! CLICK KEYS OR USE KEYBOARD TO GUESS
                </span>
              </div>
            </>
          ) : (
            <div className="py-6 flex flex-col items-center justify-center bg-slate-950/40 border border-slate-905 rounded-2xl">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="p-3 bg-red-500/10 border border-red-500/20 rounded-full text-red-400 mb-3"
              >
                <AlertCircle className="h-6 w-6" />
              </motion.div>
              <span className="text-xs font-bold text-slate-300">
                Waiting for {opponent?.name ||"opponent"}...
              </span>
              <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-wider">
                Opponent turn. Hold on.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
