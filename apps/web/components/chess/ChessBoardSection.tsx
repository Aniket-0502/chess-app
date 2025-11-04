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

// This local chess instance is now the "source of truth"
// for optimistic updates, and will be synced with the server.
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

  // Socket and game logic handler
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
        // Sync local instance
        chess.load(message.fen);
      }

      if (message.type === "move_made") {
        // This handles opponent moves AND confirms our optimistic moves
        setFen(message.fen);
        // Sync local instance
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
        // --- FIX ---
        // The server rejected our optimistic move. We must undo it.
        chess.undo();
        // Reset the board state to the last valid state.
        setFen(chess.fen());
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket, setFen, setColor, setHistory, addMoveToHistory]);

  // --- 1. onDrop (NOW FIXED) ---
  function onDrop(sourceSquare: string, targetSquare: string, piece: string) {
    // --- THIS IS THE FIX ---
    // Don't allow move if user is not a player or it's not their turn
    if (!myColor || chess.turn() !== myColor[0]) {
      return false;
    }
    // --- END FIX ---

    const isPromotion =
      piece.toLowerCase() === "p" &&
      ((piece === "P" && targetSquare[1] === "8") ||
        (piece === "p" && targetSquare[1] === "1"));

    // Let the promotion modal handle it
    if (isPromotion) return false;

    try {
      // 1. Try to make the move on the local instance
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
      });

      // 2. If illegal locally, snap back
      if (move === null) {
        return false;
      }

      // 3. OPTIMISTIC UPDATE: Move is legal. Update the store's FEN *immediately*.
      const newFen = chess.fen();
      setFen(newFen);

      // 4. Send the validated move to the server
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(
          JSON.stringify({
            type: "move",
            from: sourceSquare,
            to: targetSquare,
          })
        );
      }

      // 5. Tell react-chessboard the move was successful (client-side)
      return true;
    } catch (err) {
      console.error("❌ Invalid move (onDrop):", err);
      // Ensure the piece snaps back if our logic failed
      return false;
    }
  }

  // --- 2. onPromotionPieceSelect (NOW FIXED) ---
  function onPromotionPieceSelect(
    piece?: string,
    promoteFromSquare?: string,
    promoteToSquare?: string
  ): boolean {
    // --- THIS IS THE FIX ---
    // Don't allow move if user is not a player or it's not their turn
    if (!myColor || chess.turn() !== myColor[0]) {
      return false;
    }
    // --- END FIX ---

    if (!piece || !promoteFromSquare || !promoteToSquare) return false;

    const promotion = piece[1]?.toLowerCase() as PromotionPieceOption;

    try {
      // 1. Try to make the promotion move locally
      const move = chess.move({
        from: promoteFromSquare,
        to: promoteToSquare,
        promotion,
      });

      // 2. If illegal, return false
      if (!move) throw new Error("Illegal promotion");

      // 3. OPTIMISTIC UPDATE: Update the FEN in the store
      const newFen = chess.fen();
      setFen(newFen);

      // 4. Send to server
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

      // 5. Tell react-chessboard the move was successful
      return true;
    } catch (err) {
      console.error("❌ Promotion move failed:", err);
      return false;
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

  // Square highlighting logic (now reliably in sync)
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

  // --- 3. Game Over Description Function (Corrected) ---
  const getGameOverDescription = () => {
    if (!gameOverInfo) return "";

    const { reason, winner, drawReason } = gameOverInfo;

    // 1. Handle Draws
    if (reason === "Draw") {
      return getDrawDescription(drawReason);
    }

    // 2. Handle Resignation (This is the key fix)
    if (reason === "Resignation") {
      // Check if the winner is *me* (the person looking at the screen)
      if (winner === bottomName) {
        return "Your opponent has resigned. You win!";
      } else {
        // The winner must be the opponent
        return "You resigned the game.";
      }
    }

    // 3. Handle Checkmate or Timeout
    const reasonText = reason.toLowerCase();
    if (winner === bottomName) {
      return `You win by ${reasonText}!`;
    } else {
      return `You lost by ${reasonText}.`;
    }
  };

  return (
    // Root div is correctly centering its children
    <div className="flex flex-col items-center gap-2 w-full">
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

      {/* --- YOUR IDEA: WRAP THE BOARD IN A DIV --- */}
      <div>
        <Chessboard
          position={fen} // This now updates instantly from the optimistic update
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
      </div>
      {/* --- END WRAPPER --- */}

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

      {/* --- 4. Game Over Modal (Corrected) --- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-[#1e1e2f] text-white">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              {/* This is now simpler */}
              {gameOverInfo?.reason === "Draw" ? "Draw" : "Game Over"}
            </DialogTitle>
            <DialogDescription className="text-lg mt-2">
              {/* This uses our new logic */}

              {getGameOverDescription()}
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
