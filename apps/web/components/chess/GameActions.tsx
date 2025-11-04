// components/chess/GameActions.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { useSocketStore } from "../../store/socketStore";
// No longer need useGameStore here
// import { useGameStore } from "../../store/gameStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";

export default function GameActions() {
  const { socket } = useSocketStore();
  // const { color } = useGameStore(); // No longer needed

  const [drawOfferedByOpponent, setDrawOfferedByOpponent] = useState(false);

  // --- 1. REMOVED THIS STATE ---
  // const [gameOverInfo, setGameOverInfo] = useState<{...} | null>(null);

  const handleDrawOffer = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "draw_offer" }));
    }
  };

  const handleDrawResponse = (accepted: boolean) => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "draw_response", accepted }));
    }
    setDrawOfferedByOpponent(false);
  };

  const handleResign = () => {
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "resign" }));
    }
  };

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);
      console.log("[GameActions] WS Message:", message);

      if (message.type === "draw_offer") {
        setDrawOfferedByOpponent(true);
      }

      // --- 2. REMOVED THIS BLOCK ---
      // if (message.type === "game_over") {
      //   setGameOverInfo({
      //     reason: message.reason,
      //     winner: message.winner,
      //   });
      // }

      if (message.type === "draw_rejected") {
        alert("Opponent declined the draw offer.");
      }
    };

    socket.addEventListener("message", handleMessage);
    return () => socket.removeEventListener("message", handleMessage);
  }, [socket]);

  return (
    <div className="flex flex-col sm:flex-row justify-center items-center gap-4 w-full">
      <Button
        variant="secondary"
        onClick={handleDrawOffer}
        className="w-full sm:w-auto"
      >
        Offer Draw
      </Button>
      <Button
        variant="destructive"
        onClick={handleResign}
        className="w-full sm:w-auto"
      >
        Resign
      </Button>

      {/* Modal for draw offer (This is good, keep it) */}
      <Dialog
        open={drawOfferedByOpponent}
        onOpenChange={setDrawOfferedByOpponent}
      >
        <DialogContent className="bg-[#1e1e2f] text-white">
          <DialogHeader>
            <DialogTitle>Your opponent offered a draw</DialogTitle>
            <DialogDescription className="text-lg mt-2">
              Would you like to accept the draw?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex justify-end gap-4 mt-4">
            <Button onClick={() => handleDrawResponse(true)}>Accept</Button>
            <Button
              variant="destructive"
              onClick={() => handleDrawResponse(false)}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 3. REMOVED THIS ENTIRE DIALOG --- */}
      {/* <Dialog open={!!gameOverInfo} onOpenChange={() => setGameOverInfo(null)}>
        ...
      </Dialog>
      */}
    </div>
  );
}
