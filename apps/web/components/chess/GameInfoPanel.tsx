"use client";

import { useEffect, useState } from "react";
import { useGameStore } from "../../store/gameStore";
import { useSocketStore } from "../../store/socketStore";
import Image from "next/image";

export default function GameInfoPanel() {
  const {
    player1,
    player2,
    roomId,
    player1Color,
    player2Color,
    timeControl,
    setGameInfo,
    history,
    userId,
    whitePlayerUserId,
    blackPlayerUserId,
  } = useGameStore();
  const { socket } = useSocketStore();

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const handleStatus = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.type === "status") {
        const whitePlayer = message.whiteName || "White";
        const blackPlayer = message.blackName || "Black";

        setGameInfo({
          player1: whitePlayer,
          player2: blackPlayer,
          player1Color: "white",
          player2Color: "black",
          roomId: message.roomId,
          timeControl: message.timeControl,
        });

        setLoading(false);
      }
    };

    socket.addEventListener("message", handleStatus);

    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: "status_check" }));
        clearInterval(interval);
      }
    }, 100);

    return () => {
      socket.removeEventListener("message", handleStatus);
      clearInterval(interval);
    };
  }, [socket, setGameInfo]);

  const handleCopy = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Determine if it's the user's turn
  const isMyTurn = (() => {
    const moveCount = history.length;
    const currentTurn = moveCount % 2 === 0 ? "white" : "black";
    const myColor =
      userId === whitePlayerUserId
        ? "white"
        : userId === blackPlayerUserId
          ? "black"
          : null;
    return currentTurn === myColor;
  })();

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

  return (
    <div className="flex flex-col gap-6 items-center bg-black border border-white/10 rounded-xl px-4 py-4 w-full max-w-[360px] text-white shadow-lg">
      {/* Room Code with Copy */}
      <div className="flex justify-between items-center w-full bg-[#1D1D1D] px-4 py-3 rounded-lg relative">
        <span className="text-sm tracking-wide font-medium break-all">
          Room Code : {roomId}
        </span>
        <button onClick={handleCopy}>
          <Image
            src="/copyIcon.svg"
            alt="Copy"
            width={18}
            height={18}
            className="ml-2 cursor-pointer"
          />
        </button>
        {copied && (
          <div className="absolute -bottom-6 right-2 bg-[#1A2535] px-2 py-1 rounded text-xs text-green-400">
            Copied!
          </div>
        )}
      </div>

      {/* Players and Time Control */}
      <div className="flex flex-col justify-between items-center w-full gap-4 bg-[#1D1D1D] px-4 py-4 rounded-lg">
        {/* Player 1 */}
        <div className="flex items-center w-full gap-3 bg-[#1D1D1D] px-4 py-3 rounded-lg">
          <Image
            src="/whitePlayerPhoto.svg"
            alt="White Player"
            width={20}
            height={20}
          />
          <span className="text-sm truncate">
            {player1} <span className="text-gray-400">(White)</span>
          </span>
        </div>

        {/* Player 2 */}
        <div className="flex items-center w-full gap-3 bg-[#1D1D1D] px-4 py-3 rounded-lg">
          <Image
            src="/blackPlayerPhoto.svg"
            alt="Black Player"
            width={20}
            height={20}
          />
          <span className="text-sm truncate">
            {player2} <span className="text-gray-400">(Black)</span>
          </span>
        </div>

        {/* Time Control */}
        <div className="flex items-center w-full gap-3 bg-[#1D1D1D] px-4 py-3 rounded-lg">
          <Image
            src="/timeControlPhoto.svg"
            alt="Time Control"
            width={20}
            height={20}
          />
          <span className="text-sm">
            Time Control:{" "}
            <span className="text-white font-medium">
              {timeControl.time / 60}+{timeControl.increment || 0}
            </span>{" "}
            <span className="text-gray-400 text-xs ml-1">
              (
              {timeControl.time >= 600
                ? "Classical"
                : timeControl.time >= 300
                  ? "Rapid"
                  : "Blitz"}
              )
            </span>
          </span>
        </div>
      </div>

      {/* Dynamic Turn Indicator */}
      <div className="w-full bg-[#1D1D1D] text-center py-3 rounded-lg text-sm font-bold">
        {isMyTurn ? "Your Turn to Play" : "Opponent is Thinking..."}
      </div>
    </div>
  );
}
