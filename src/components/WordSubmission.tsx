import React, { useState } from "react";
import { motion } from "motion/react";
import { ArrowBigRight, Eye, EyeOff, ShieldAlert, Sparkles } from "lucide-react";
import { RoomState } from "../types";

interface WordSubmissionProps {
  roomState: RoomState;
  onSubmitWord: (word: string) => void;
  submitting: boolean;
}

export default function WordSubmission({
  roomState,
  onSubmitWord,
  submitting,
}: WordSubmissionProps) {
  const [word, setWord] = useState("");
  const [showWord, setShowWord] = useState(false);
  const [validationError, setValidationError] = useState("");

  const me = roomState.me;
  const opponent = roomState.opponent;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWord = word.trim().toUpperCase();

    if (!cleanWord) {
      setValidationError("Secret phrase cannot be left blank.");
      return;
    }

    if (cleanWord.length < 3) {
      setValidationError("Phrase is too short (Minimum 3 characters).");
      return;
    }

    if (cleanWord.length > 20) {
      setValidationError("Phrase is too long (Maximum 20 characters).");
      return;
    }

    // Ensure it contains at least some guessable letters (A-Z)
    const hasLetters = /[A-Z]/.test(cleanWord);
    if (!hasLetters) {
      setValidationError("Phrase must contain at least some letters (A-Z).");
      return;
    }

    setValidationError("");
    onSubmitWord(cleanWord);
  };

  // If the local player has already submitted their word but opponent hasn't:
  if (me?.ready) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl mx-auto glass-panel p-6 rounded-3xl border border-white/10 text-center flex flex-col items-center"
      >
        <div className="relative flex items-center justify-center h-20 w-20 mb-6">
          <span className="absolute inline-flex h-full w-full rounded-full bg-teal-500/10 opacity-75 animate-ping" />
          <div className="relative rounded-full h-14 w-14 bg-slate-900 border border-teal-500/40 flex items-center justify-center">
            <Sparkles className="h-6 w-6 text-teal-400 animate-spin" style={{ animationDuration: "8s" }} />
          </div>
        </div>

        <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md px-2.5 py-1 uppercase tracking-widest font-bold">
          PHRASE SECURED
        </span>

        <h3 className="text-xl font-display font-extrabold text-white mt-4">
          Waiting for opponent
        </h3>
        
        <p className="text-slate-400 text-xs mt-2">
          Your word is locked while the opponent submits.
        </p>

        {/* Visual summary display */}
        <div className="w-full mt-6 bg-slate-950/40 border border-slate-900 rounded-xl p-4 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-mono">
            <span className="text-slate-500">SECRET PHRASE:</span>
            <span className="text-emerald-400 font-bold tracking-widest">{me.word}</span>
          </div>
          <div className="flex justify-between items-center text-xs font-mono pt-2 border-t border-slate-950/80">
            <span className="text-slate-500">CHALLENGER:</span>
            <span className="text-teal-400 font-bold">
              {opponent?.name || "Player 2"}{" "}
              <span className="text-slate-500 text-[10px] font-normal italic">
                (formulating...)
              </span>
            </span>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full max-w-xl mx-auto glass-panel p-8 rounded-3xl border border-white/10"
    >
      <div className="text-center mb-6">
        <span className="text-[10px] font-mono bg-teal-500/10 text-teal-400 border border-teal-500/20 rounded-md px-2.5 py-1 uppercase tracking-widest font-bold">
          SET SECRET WORD
        </span>
        <h3 className="text-xl font-display font-extrabold text-white mt-4">
          Enter your word
        </h3>
        <p className="text-slate-400 text-[10px] mt-1">
          Pick 3–20 letters. Opponent guesses letters to solve it.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
            Secret Word / Phrase
          </label>
          <div className="relative">
            <input
              type={showWord ? "text" : "password"}
              value={word}
              onChange={(e) => {
                setWord(e.target.value.replace(/[^A-Za-z ]/g, "")); // Friendly lock: only letters/spaces
                setValidationError("");
              }}
              placeholder="e.g. SECRET CODE"
              maxLength={20}
              autoComplete="off"
              className="w-full pl-4 pr-12 py-2.5 bg-slate-950/60 border border-slate-700/60 text-white font-mono font-bold rounded-2xl placeholder:text-slate-700 focus:border-teal-500 focus:ring-1 focus:ring-teal-500 outline-none tracking-widest transition"
              id="secret-phrase-input"
            />
            <button
              type="button"
              onClick={() => setShowWord(!showWord)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              id="show-phrase-btn"
            >
              {showWord ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
            </button>
          </div>
          <p className="text-[10px] text-slate-500 font-mono italic">
            * Spaces are accepted. Symbols and non-alphabetic keys are ignored during typing.
          </p>
        </div>

        {validationError && (
          <div className="flex items-start gap-2 p-3 bg-red-500/5 border border-red-500/25 rounded-xl text-xs text-red-400 font-mono">
            <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{validationError}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || word.trim().length < 3}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none transition-all duration-300 font-bold text-slate-950 flex items-center justify-center gap-2 shadow-lg shadow-teal-500/10"
          id="submit-phrase-btn"
        >
          {submitting ? (
            <div className="h-5 w-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
          ) : (
            <>
              <span>SUBMIT</span>
              <ArrowBigRight className="h-4 w-4 stroke-[2.5px]" />
            </>
          )}
        </button>
      </form>
    </motion.div>
  );
}
