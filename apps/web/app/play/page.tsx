// app/play/page.tsx

"use client";

import { Header } from "../../components/common/Header";
import GameInfoPanel from "../../components/chess/GameInfoPanel";
import ChessBoardSection from "../../components/chess/ChessBoardSection";
import MoveHistory from "../../components/chess/MoveHistory";
import GameActions from "../../components/chess/GameActions";
import { useEffect } from "react";

export default function PlayPage() {
  useEffect(() => {
    // Prevent vertical scroll on desktop
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, []);

  return (
    <div className="flex flex-col h-screen w-full bg-black text-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Game Info */}
        <div className="w-[430px] p-4 flex flex-col justify-center items-center border-r border-white/5">
          <GameInfoPanel />
        </div>

        {/* Center Panel: Chessboard + Timers */}
        <div className="flex-1 flex items-center justify-center">
          <ChessBoardSection />
        </div>

        {/* Right Panel: Move History + Game Actions */}
        <div className="w-[350px] border-l border-white/5 p-4 flex flex-col justify-between items-center">
          <div className="w-[330px] flex-1 overflow-y-auto">
            <MoveHistory />
          </div>
          <div className="w-[330px] border-l border-white/5 p-4">
            <GameActions />
          </div>
        </div>
      </div>
    </div>
  );
}
