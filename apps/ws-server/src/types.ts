import { WebSocket } from "ws";

// Roles
export type Role = "player" | "spectator";

// Time Control Settings
export interface TimeControl {
  time: number; // in seconds
  increment?: number; // in seconds, optional for blitz
}

// Connected Client Info
export interface ConnectedClient {
  socket: WebSocket;
  userId?: string;
  name?: string; // ✅ ADDED: Player name
  role: Role;
  color?: "white" | "black";

  // For reconnect handling
  disconnected?: boolean;
  reconnectTimeout?: NodeJS.Timeout;
}

// Room Object
export interface Room {
  id: string;
  players: ConnectedClient[];
  spectators: ConnectedClient[];
  timeControl: TimeControl;
  creatorColorChoice?: "white" | "black";
  createdAt: number;
  drawOffer?: DrawOffer;
}

// Draw Offer Info
export interface DrawOffer {
  offeredBy: "white" | "black";
  offeredAt: number;
}

// Game Wrapper for tracking ongoing games
export interface GameWrapper {
  chess: any;
  timeControl: TimeControl;
  remainingTime: {
    white: number;
    black: number;
  };
  lastMoveTime: number;
  currentTurn: "w" | "b";
  drawOffer?: DrawOffer;
  gameOver?: boolean;
  history: string[];
  timeoutHandle?: NodeJS.Timeout;
}

// ✅ Client → Server Messages
export type ClientMessage =
  | {
      type: "create";
      timeControl: TimeControl;
      creatorColorChoice?: "white" | "black";
      userId?: string;
      name?: string; // ✅ ADDED
    }
  | {
      type: "join";
      roomId: string;
      userId?: string;
      name?: string; // ✅ ADDED
    }
  | {
      type: "move";
      from: string;
      to: string;
      promotion?: string;
    }
  | { type: "leave" }
  | { type: "resign" }
  | { type: "draw_offer" }
  | { type: "draw_response"; accepted: boolean }
  | { type: "reconnect"; userId: string; roomId: string }
  | { type: "status_check" };

// ✅ Server → Client Messages
export type ServerMessage =
  | { type: "room_created"; roomId: string }
  | { type: "joined"; role: Role; roomId: string }
  | {
      type: "game_start";
      fen: string;
      color: "white" | "black";
      timeControl: TimeControl;
      player1: string;
      player2: string;
      player1Color: "white" | "black";
      player2Color: "white" | "black";
    }
  | {
      type: "move_made";
      move: {
        from: string;
        to: string;
        promotion?: string;
        piece: string;
        san: string;
        captured?: string;
      };
      fen: string;
      remainingTime: {
        white: number;
        black: number;
      };
      history: string[];
    }
  | { type: "draw_offer" }
  | { type: "draw_rejected" }
  | {
      type: "game_over";
      reason: "checkmate" | "resign" | "timeout" | "draw";
      winner?: "white" | "black";
      loser?: "white" | "black";
    }
  | {
      type: "reconnected";
      color: "white" | "black";
      fen: string;
      timeControl: TimeControl;
      remainingTime: {
        white: number;
        black: number;
      };
      history: string[];
    }
  | {
      type: "status"; // ✅ EXTENDED
      inGame: boolean;
      roomId: string | null;
      players?: {
        white: string;
        black: string;
      };
      whiteName?: string;
      blackName?: string;
      timeControl?: TimeControl;
      whitePlayerUserId?: string; // ✅ NEW
      blackPlayerUserId?: string; // ✅ NEW
    }
  | {
      type: "error";
      message: string;
    };
