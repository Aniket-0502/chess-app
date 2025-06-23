"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { useSocketStore } from "../../store/socketStore";

export default function GameInfoPanel() {
  const {
    player1,
    player2,
    roomId,
    player1Color,
    player2Color,
    timeControl,
    setGameInfo,
  } = useGameStore();
  const { socket } = useSocketStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.type === "status") {
        console.log("✅ Status received in GameInfoPanel:", message);

        const whitePlayer = message.whiteName || "White";
        const blackPlayer = message.blackName || "Black";
        const roomId = message.roomId;
        const timeControl = message.timeControl;

        setGameInfo({
          player1: whitePlayer,
          player2: blackPlayer,
          player1Color: "white",
          player2Color: "black",
          roomId,
          timeControl,
        });

        setLoading(false);
      }
    };

    socket.addEventListener("message", handleStatus);

    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        console.log("🟢 Sending status_check from GameInfoPanel");
        socket.send(JSON.stringify({ type: "status_check" }));
        clearInterval(interval);
      }
    }, 100);

    return () => {
      socket.removeEventListener("message", handleStatus);
      clearInterval(interval);
    };
  }, [socket, setGameInfo]);

  if (
    loading ||
    !player1 ||
    !player2 ||
    !roomId ||
    !timeControl ||
    !player1Color ||
    !player2Color
  ) {
    return (
      <div className="flex flex-col items-center justify-center text-white mt-4">
        <div className="text-lg animate-pulse text-gray-300">
          Loading game info...
        </div>
      </div>
    );
  }

  console.log("🔁 Rendered with:", {
    player1,
    player2,
    roomId,
    player1Color,
    player2Color,
    timeControl,
  });

  return (
    <div className="flex flex-col items-center justify-center mt-4 px-4 py-3 rounded-xl bg-[#1A2535] text-white shadow-md w-full max-w-md mx-auto border border-white/10">
      <h2 className="text-xl font-bold mb-4">Game Info</h2>

      <div className="grid grid-cols-2 gap-x-4 gap-y-3 w-full text-sm">
        <div className="text-gray-400">Room Code:</div>
        <div className="font-semibold tracking-wide">{roomId}</div>

        <div className="text-gray-400">Time Control:</div>
        <div className="font-semibold">
          {timeControl.time / 60}+{timeControl.increment || 0}
        </div>

        <div className="text-gray-400">White:</div>
        <div className="font-semibold">
          {player1Color === "white" ? player1 : player2}
        </div>

        <div className="text-gray-400">Black:</div>
        <div className="font-semibold">
          {player1Color === "black" ? player1 : player2}
        </div>
      </div>
    </div>
  );
}
