export interface PlayerState {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  word?: string; // Only fully revealed in your own payload
  guesses: string[]; // Your list of guesses made
  maskedOwnWord?: string; // Visual state of your word showing attacker's guesses
  hintsUsed?: number; // Track hints used in this round (0-2)
  hintsRemaining?: number; // Remaining hints for this round
}

export interface OpponentState {
  id?: string;
  name: string;
  score: number;
  ready: boolean;
  disconnected: boolean;
  guesses: string[]; // List of guesses you made on their word
  maskedWord: string; // What you have figured out of their word
  hasWord: boolean;
}

export interface ScoreboardPlayer {
  id: string;
  name: string;
  score: number;
  ready: boolean;
  disconnected: boolean;
  isMe: boolean;
  isTarget: boolean;
  isTurn: boolean;
}

export interface RoomState {
  code: string;
  capacity?: number;
  phase: "waiting" | "word_submission" | "playing" | "winner";
  currentTurn: "p1" | "p2"; // Kept for backward compatibility
  currentTurnId?: string; // The specific player whose turn it is
  winner: "p1" | "p2" | null; // Kept for backward compatibility
  winnerId?: string | null; // The specific winner player ID
  timer: number;
  myRole: "p1" | "p2"; // Kept for backward compatibility
  me: PlayerState | null;
  opponent: OpponentState | null; // Represents our TARGET to guess
  attacker?: {
    id: string;
    name: string;
  } | null;
  playersList?: ScoreboardPlayer[]; // Scoreboard metadata of all players
}

export interface SystemMessage {
  id: string;
  type: string;
  message: string;
  timestamp: string;
}

