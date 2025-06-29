"use client";

import { useEffect, useState } from "react";
import { Chess } from "chess.js";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "../../store/gameStore";
import { useSocketStore } from "../../store/socketStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";

const chess = new Chess();

type PromotionPieceOption = "q" | "r" | "b" | "n";

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
    setHistory,
    addMoveToHistory,
  } = useGameStore();

  const { socket } = useSocketStore();

  const [playerTimes, setPlayerTimes] = useState({
    white: timeControl?.time || 600,
    black: timeControl?.time || 600,
  });

  const [lastMoveSquares, setLastMoveSquares] = useState<string[]>([]);
  const [gameOverInfo, setGameOverInfo] = useState<{
    winner?: string;
    reason: string;
    drawReason?: string;
  } | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [boardWidth, setBoardWidth] = useState(460);

  const myColor =
    userId === whitePlayerUserId
      ? "white"
      : userId === blackPlayerUserId
        ? "black"
        : null;

  // Responsive Chessboard width
  useEffect(() => {
    const updateSize = () => {
      const width = window.innerWidth;
      if (width < 400) setBoardWidth(300);
      else if (width < 640) setBoardWidth(340);
      else if (width < 768) setBoardWidth(380);
      else if (width < 1024) setBoardWidth(420);
      else setBoardWidth(460);
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, []);

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
        setGameOverInfo(null);
        setIsDialogOpen(false);
        setHistory([]);
        chess.load(message.fen);
      }

      if (message.type === "move_made") {
        setFen(message.fen);
        chess.load(message.fen);
        setPlayerTimes(message.remainingTime);
        setLastMoveSquares([message.move.from, message.move.to]);
        addMoveToHistory(message.move.san);
      }

      if (message.type === "clock_tick") {
        setPlayerTimes(message.remainingTime);
      }

      if (message.type === "game_over") {
        if (message.reason === "draw") {
          setGameOverInfo({
            reason: "Draw",
            drawReason: message.drawReason,
          });
        } else {
          setGameOverInfo({
            reason:
              message.reason === "checkmate"
                ? "Checkmate"
                : message.reason === "resign"
                  ? "Resignation"
                  : "Timeout",
            winner: message.winner,
          });
        }
        setIsDialogOpen(true);
      }

      if (message.type === "error") {
        console.warn("⛔ Error message:", message.message);
        setFen(chess.fen());
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    const isPromotion =
      piece.toLowerCase() === "p" &&
      ((piece === "P" && targetSquare[1] === "8") ||
        (piece === "p" && targetSquare[1] === "1"));

    if (isPromotion) return false;
    sendMove(sourceSquare, targetSquare);
    return true;
  }

  function onPromotionPieceSelect(
    piece?: string,
    promoteFromSquare?: string,
    promoteToSquare?: string
  ): boolean {
    if (!piece || !promoteFromSquare || !promoteToSquare) return false;

    const promotion = piece[1]?.toLowerCase() as PromotionPieceOption;

    try {
      const move = chess.move({
        from: promoteFromSquare,
        to: promoteToSquare,
        promotion,
      });

      if (!move) throw new Error("Illegal move");
      chess.undo();

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "move",
            from: promoteFromSquare,
            to: promoteToSquare,
            promotion,
          })
        );
      }

      return true;
    } catch (err) {
      console.error("❌ Promotion move failed:", err);
      return false;
    }
  }

  function sendMove(
    from: string,
    to: string,
    promotion?: PromotionPieceOption
  ) {
    try {
      const move = chess.move({ from, to, promotion });
      if (!move) throw new Error("Illegal move");
      chess.undo();

      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "move", from, to, promotion }));
      }
    } catch (err) {
      console.error("❌ Invalid move:", err);
    }
  }

  const formatTime = (seconds: number) => {
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

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMoveSquares.length === 2) {
    lastMoveSquares.forEach((sq) => {
      squareStyles[sq] = {
        backgroundColor: "rgba(255, 255, 0, 0.4)",
      };
    });
  }

  if (chess.inCheck()) {
    const board = chess.board();
    for (let rank = 0; rank < 8; rank++) {
      const row = board[rank];
      if (!row) continue;
      for (let file = 0; file < 8; file++) {
        const piece = row[file];
        if (piece && piece.type === "k" && piece.color === chess.turn()) {
          const square = String.fromCharCode(97 + file) + (8 - rank);
          squareStyles[square] = {
            backgroundColor: "rgba(255, 0, 0, 0.5)",
          };
        }
      }
    }
  }

  const getDrawDescription = (reason?: string) => {
    switch (reason) {
      case "threefold":
        return "Draw by threefold repetition.";
      case "stalemate":
        return "Draw by stalemate.";
      case "insufficient":
        return "Draw due to insufficient material.";
      case "fiftyMove":
        return "Draw by fifty-move rule.";
      default:
        return "The game ended in a draw.";
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 w-full px-4">
      {/* Top Player */}
      <div className="flex items-center justify-between w-full max-w-[480px] mb-2">
        <span className="text-white text-sm font-medium">{topName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? playerTimes.white : playerTimes.black
          )}
          {playerTimes[topColor === "white" ? "white" : "black"] <= 0 && (
            <span className="ml-2 text-red-500">⚑</span>
          )}
        </div>
      </div>

      {/* Chessboard */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        onPromotionPieceSelect={onPromotionPieceSelect}
        boardOrientation={myColor ?? "white"}
        customBoardStyle={{
          borderRadius: "0.75rem",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
        boardWidth={boardWidth}
        customDarkSquareStyle={{ backgroundColor: "#252c58" }}
        customLightSquareStyle={{ backgroundColor: "#9793dd" }}
        customSquareStyles={squareStyles}
      />

      {/* Bottom Player */}
      <div className="flex items-center justify-between w-full max-w-[480px] mt-2">
        <span className="text-white text-sm font-medium">{bottomName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? playerTimes.black : playerTimes.white
          )}
          {playerTimes[topColor === "white" ? "black" : "white"] <= 0 && (
            <span className="ml-2 text-red-500">⚑</span>
          )}
        </div>
      </div>

      {/* Game Over Modal */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1e1e2f] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {gameOverInfo?.reason}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              {gameOverInfo?.reason === "Draw"
                ? getDrawDescription(gameOverInfo.drawReason)
                : `${gameOverInfo?.winner} wins the game.`}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
