"use client";

import { useEffect, useRef, useState } from "react";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "../../store/gameStore";
import { useSocketStore } from "../../store/socketStore";
import { Chess } from "chess.js";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

const chess = new Chess();

export default function ChessBoardSection() {
  const {
    player1,
    player2,
    player1Color,
    player2Color,
    timeControl,
    setFen,
    fen,
    color,
    setColor,
    userId,
    whitePlayerUserId,
    blackPlayerUserId,
  } = useGameStore();
  const { socket } = useSocketStore();

  const [playerTimes, setPlayerTimes] = useState({
    white: timeControl?.time || 600,
    black: timeControl?.time || 600,
  });

  const [localTimes, setLocalTimes] = useState({ white: 0, black: 0 });
  const [activeColor, setActiveColor] = useState<"white" | "black" | null>(
    null
  );
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  const [pendingMove, setPendingMove] = useState<{
    from: string;
    to: string;
  } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);

  const myColor =
    userId === whitePlayerUserId
      ? "white"
      : userId === blackPlayerUserId
        ? "black"
        : null;

  const clockRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());

  // 🔁 Animate local clock
  useEffect(() => {
    function updateClock() {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      setLocalTimes((prev) => {
        const updated = { ...prev };
        if (activeColor && playerTimes[activeColor] > 0) {
          updated[activeColor] = Math.max(prev[activeColor] - delta, 0);
        }
        return updated;
      });

      clockRef.current = requestAnimationFrame(updateClock);
    }

    if (activeColor) {
      lastUpdateRef.current = Date.now();
      clockRef.current = requestAnimationFrame(updateClock);
    }

    return () => {
      if (clockRef.current) cancelAnimationFrame(clockRef.current);
    };
  }, [activeColor]);

  // ♻️ Sync server time
  useEffect(() => {
    setLocalTimes(playerTimes);
  }, [playerTimes]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.type === "game_start") {
        setFen(message.fen);
        setColor(message.color);
        setPlayerTimes({
          white: message.timeControl.time,
          black: message.timeControl.time,
        });
        setActiveColor("white");
      }

      if (message.type === "move_made") {
        setFen(message.fen);
        setPlayerTimes(message.remainingTime);
        setActiveColor(message.fen.includes(" w ") ? "white" : "black");

        chess.load(message.fen);
        const move = message.move;
        if (move?.from && move?.to) {
          setLastMoveSquares([move.from, move.to]);
        }
      }

      if (message.type === "error") {
        setErrorMessage(message.message);
        setTimeout(() => setErrorMessage(null), 2000);
        setFen(chess.fen()); // restore previous valid state
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  function isPromotion(from: string, to: string) {
    const piece = chess.get(from as any);
    if (piece?.type !== "p") return false;
    return (
      (piece.color === "w" && to[1] === "8") ||
      (piece.color === "b" && to[1] === "1")
    );
  }

  function onDrop(sourceSquare: string, targetSquare: string) {
    if (isPromotion(sourceSquare, targetSquare)) {
      setPendingMove({ from: sourceSquare, to: targetSquare });
      setShowPromotionDialog(true);
      return false;
    }

    try {
      const move = chess.move({ from: sourceSquare, to: targetSquare });
      if (!move) throw new Error("Illegal move");
      chess.undo();

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "move",
            from: sourceSquare,
            to: targetSquare,
          })
        );
      }
    } catch (err) {
      console.error("❌ Invalid move:", err);
    }

    return true;
  }

  function handlePromotionChoice(piece: "q" | "r" | "b" | "n") {
    if (!pendingMove) return;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "move",
          from: pendingMove.from,
          to: pendingMove.to,
          promotion: piece,
        })
      );
    }

    setShowPromotionDialog(false);
    setPendingMove(null);
  }

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return "⏱ Flag";
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");
    const secs = Math.floor(seconds % 60)
      .toString()
      .padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const whiteName = player1Color === "white" ? player1 : player2;
  const blackName = player1Color === "black" ? player1 : player2;
  const topName = myColor === "white" ? blackName : whiteName;
  const bottomName = myColor === "white" ? whiteName : blackName;
  const topColor = myColor === "white" ? "black" : "white";

  const squareStyles: { [square: string]: React.CSSProperties } = {};
  if (
    lastMoveSquares.length === 2 &&
    lastMoveSquares[0] !== undefined &&
    lastMoveSquares[1] !== undefined
  ) {
    squareStyles[lastMoveSquares[0]] = {
      backgroundColor: "#f6cd61",
    };
    squareStyles[lastMoveSquares[1]] = {
      backgroundColor: "#f6cd61",
    };
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Top Player */}
      <div className="flex items-center justify-between w-[460px] mb-2">
        <span className="text-white text-sm font-medium">{topName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? localTimes.white : localTimes.black
          )}
        </div>
      </div>

      {/* Board */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={myColor ?? "white"}
        customBoardStyle={{
          borderRadius: "0.75rem",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
        boardWidth={460}
        customSquareStyles={squareStyles}
        customDarkSquareStyle={{ backgroundColor: "#252c58" }}
        customLightSquareStyle={{ backgroundColor: "#9793dd" }}
      />

      {/* Bottom Player */}
      <div className="flex items-center justify-between w-[460px] mt-2">
        <span className="text-white text-sm font-medium">{bottomName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? localTimes.black : localTimes.white
          )}
        </div>
      </div>

      {/* Promotion Dialog */}
      <Dialog open={showPromotionDialog} onOpenChange={setShowPromotionDialog}>
        <DialogContent className="text-center">
          <DialogHeader>
            <DialogTitle>Choose Promotion Piece</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center gap-4 mt-4">
            {["q", "r", "b", "n"].map((piece) => (
              <Button
                key={piece}
                onClick={() => handlePromotionChoice(piece as any)}
              >
                {piece.toUpperCase()}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
