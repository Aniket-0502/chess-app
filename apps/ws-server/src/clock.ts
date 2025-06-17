import { GameWrapper } from "./types";

export function startClock(game: GameWrapper) {
  game.lastMoveTime = Date.now();
}

export function updateClockOnMove(game: GameWrapper) {
  const now = Date.now();
  const elapsed = (now - game.lastMoveTime) / 1000; // Convert to seconds

  const currentColor = game.currentTurn === "w" ? "white" : "black";
  game.remainingTime[currentColor] -= elapsed;

  if (game.timeControl.increment) {
    game.remainingTime[currentColor] += game.timeControl.increment;
  }

  game.currentTurn = game.currentTurn === "w" ? "b" : "w";
  game.lastMoveTime = now;
}

export function checkTimeOut(game: GameWrapper): "white" | "black" | null {
  const now = Date.now();
  const elapsed = (now - game.lastMoveTime) / 1000; // Convert to seconds
  const currentColor = game.currentTurn === "w" ? "white" : "black";
  const remaining = game.remainingTime[currentColor] - elapsed;
  return remaining <= 0 ? currentColor : null;
}

export function getRemainingTime(game: GameWrapper) {
  const now = Date.now();
  const elapsed = Math.floor((now - game.lastMoveTime) / 1000); // seconds

  const white =
    game.currentTurn === "w"
      ? game.remainingTime.white - elapsed
      : game.remainingTime.white;

  const black =
    game.currentTurn === "b"
      ? game.remainingTime.black - elapsed
      : game.remainingTime.black;

  return {
    white: Math.max(0, white),
    black: Math.max(0, black),
  };
}
