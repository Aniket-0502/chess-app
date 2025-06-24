"use client";

import { useEffect, useState } from "react";
import { Chessboard } from "react-chessboard";
import { useGameStore } from "../../store/gameStore";
import { useSocketStore } from "../../store/socketStore";
import { Chess } from "chess.js";

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

  // ✅ Accurate board orientation based on userId match
  const myColor =
    userId === whitePlayerUserId
      ? "white"
      : userId === blackPlayerUserId
        ? "black"
        : null;

  // 🧠 Debug logs
  console.log("📛 userId:", userId);
  console.log("👤 whitePlayerUserId:", whitePlayerUserId);
  console.log("👤 blackPlayerUserId:", blackPlayerUserId);
  console.log("🎯 Calculated myColor from userId match:", myColor);
  console.log("♟️ color from game_start (for move validation):", color);
  console.log("📌 Final boardOrientation to use:", myColor ?? "white");
  console.log("📍 player1:", player1, "→", player1Color);
  console.log("📍 player2:", player2, "→", player2Color);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log("📩 WS Message:", message);

      if (message.type === "game_start") {
        console.log("🚀 game_start received → color:", message.color);
        setFen(message.fen);
        setColor(message.color);
        setPlayerTimes({
          white: message.timeControl.time,
          black: message.timeControl.time,
        });
      }

      if (message.type === "move_made") {
        console.log("🎯 move_made received");
        setFen(message.fen);
        setPlayerTimes(message.remainingTime);
        chess.load(message.fen); // update internal game state
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => {
      socket.removeEventListener("message", handleMessage);
    };
  }, [socket]);

  function onDrop(sourceSquare: string, targetSquare: string) {
    const move = chess.move({
      from: sourceSquare,
      to: targetSquare,
      promotion: "q",
    });

    if (move === null) return false;

    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(
        JSON.stringify({
          type: "move",
          from: sourceSquare,
          to: targetSquare,
          promotion: "q",
        })
      );
    }

    return true;
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

  return (
    <div className="flex flex-col items-center gap-2">
      {/* Top player info */}
      <div className="flex items-center justify-between w-[460px] mb-2">
        <span className="text-white text-sm font-medium">{topName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? playerTimes.black : playerTimes.white
          )}
        </div>
      </div>

      {/* Chessboard */}
      <Chessboard
        position={fen}
        onPieceDrop={onDrop}
        boardOrientation={myColor ?? "white"} // 👈 Orientation based on user identity
        customBoardStyle={{
          borderRadius: "0.75rem",
          boxShadow: "0 0 0 1px rgba(255, 255, 255, 0.1)",
        }}
        boardWidth={460}
      />

      {/* Bottom player info */}
      <div className="flex items-center justify-between w-[460px] mt-2">
        <span className="text-white text-sm font-medium">{bottomName}</span>
        <div className="bg-white text-black px-3 py-1 rounded-md font-bold text-sm">
          {formatTime(
            topColor === "white" ? playerTimes.white : playerTimes.black
          )}
        </div>
      </div>
    </div>
  );
}
