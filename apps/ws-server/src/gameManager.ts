import { Chess } from "chess.js";
import type { Move } from "chess.js";
import type { GameWrapper } from "./types";
import {
  startClock,
  updateClockOnMove,
  getRemainingTime,
  checkTimeOut,
} from "./clock";
import { removeRoom } from "./roomManager";
import { getAllSocketsInRoom } from "./roomManager";

const games = new Map<string, GameWrapper>();

export function createGame(
  roomId: string,
  timeControl: { time: number; increment?: number }
): GameWrapper {
  console.log(`[createGame] 🕓 Creating game with timeControl:`, timeControl);

  if (typeof timeControl.time !== "number" || isNaN(timeControl.time)) {
    console.error(
      `[createGame] ❌ Invalid timeControl.time value:`,
      timeControl.time
    );
    timeControl.time = 300;
  }

  const chess = new Chess();
  const game: GameWrapper = {
    chess,
    timeControl,
    remainingTime: {
      white: timeControl.time,
      black: timeControl.time,
    },
    lastMoveTime: 0,
    currentTurn: "w",
    gameOver: false,
    history: [],
    timeoutHandle: undefined,
  };

  console.log(`[createGame] ✅ Initialized remainingTime:`, game.remainingTime);
  games.set(roomId, game);

  return game;
}

export function makeMove(
  roomId: string,
  from: string,
  to: string,
  promotion: string | undefined,
  playerColor: "white" | "black"
): {
  valid: boolean;
  reason?: string;
  move?: Move;
  gameOver?: boolean;
  fen?: string;
  remainingTime?: { white: number; black: number };
  history?: string[];
  timedOut?: boolean;
  winner?: "white" | "black";
} {
  const game = games.get(roomId);
  if (!game) {
    return { valid: false, reason: "Game not found" };
  }

  const expectedTurn = game.chess.turn() === "w" ? "white" : "black";
  if (expectedTurn !== playerColor) {
    return { valid: false, reason: "Not your turn" };
  }

  const timeoutColor = checkTimeOut(game);
  if (timeoutColor) {
    const result = resignGame(roomId, timeoutColor);
    return {
      valid: false,
      reason: `${timeoutColor} ran out of time`,
      timedOut: true,
      winner: result.winner,
    };
  }

  const legalMoves = game.chess.moves({ verbose: true });
  const isLegal = legalMoves.some(
    //@ts-ignore
    (m) =>
      m.from === from &&
      m.to === to &&
      (!promotion || m.promotion === promotion)
  );

  if (!isLegal) {
    return { valid: false, reason: "Illegal move" };
  }

  try {
    const move = game.chess.move({ from, to, promotion: promotion || "q" });
    if (!move) return { valid: false, reason: "Illegal move" };

    // Start the clock only after white's first move
    if (
      !game.timeoutHandle &&
      game.history.length === 0 &&
      move.color === "w"
    ) {
      startClock(game);
      game.timeoutHandle = setInterval(() => {
        const timeoutColor = checkTimeOut(game);
        if (timeoutColor && !game.gameOver) {
          console.log(`[timeout] ${timeoutColor} lost on time`);

          game.gameOver = true;
          clearInterval(game.timeoutHandle);
          const sockets = getAllSocketsInRoom(roomId);
          sockets.forEach((s) =>
            s.send(
              JSON.stringify({
                type: "game_over",
                reason: "timeout",
                winner: timeoutColor === "white" ? "black" : "white",
              })
            )
          );
          const result = resignGame(roomId, timeoutColor);
        }
      }, 1000);
    } else {
      updateClockOnMove(game);
    }

    game.currentTurn = game.chess.turn();
    game.gameOver = game.chess.isGameOver();
    game.history.push(`${move.from}${move.to}${move.promotion || ""}`);

    const remaining = getRemainingTime(game);
    return {
      valid: true,
      move,
      gameOver: game.gameOver,
      fen: game.chess.fen(),
      remainingTime: remaining,
      history: game.history,
    };
  } catch (error) {
    return { valid: false, reason: "Move failed due to internal error" };
  }
}

export function resignGame(
  roomId: string,
  color: "white" | "black"
): {
  success: boolean;
  winner?: "white" | "black";
} {
  const game = games.get(roomId);
  if (!game) return { success: false };
  const winner = color === "white" ? "black" : "white";

  if (game.timeoutHandle) {
    clearInterval(game.timeoutHandle);
  }

  games.delete(roomId);
  return { success: true, winner };
}

export function forceTimeoutLoss(
  roomId: string,
  color: "white" | "black"
): {
  success: boolean;
  loser?: "white" | "black";
} {
  const game = games.get(roomId);
  if (!game) return { success: false };

  if (game.timeoutHandle) {
    clearInterval(game.timeoutHandle);
  }

  games.delete(roomId);

  return { success: true, loser: color };
}

export function getFEN(roomId: string): string | null {
  const game = games.get(roomId);
  if (!game) return null;
  return game.chess.fen();
}

export function getMoveHistory(roomId: string): string[] | null {
  const game = games.get(roomId);
  if (!game) return null;
  return game.history;
}

export function getGame(roomId: string): GameWrapper | null {
  return games.get(roomId) || null;
}

export function removeGame(roomId: string): boolean {
  const game = games.get(roomId);
  if (game?.timeoutHandle) {
    clearInterval(game.timeoutHandle);
  }
  removeRoom(roomId);
  return games.delete(roomId);
}

export function getReconnectionState(
  roomId: string,
  color: "white" | "black"
): {
  success: boolean;
  fen?: string;
  timeControl?: { time: number; increment?: number };
  remainingTime?: { white: number; black: number };
  history?: string[];
  color?: "white" | "black";
} {
  const game = games.get(roomId);
  if (!game) return { success: false };

  return {
    success: true,
    fen: game.chess.fen(),
    timeControl: game.timeControl,
    remainingTime: getRemainingTime(game),
    history: game.history,
    color,
  };
}
