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
    <div className="flex flex-col h-screen w-full bg-[#0F172B] text-white">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Game Info */}
        <div className="w-[260px] border-r border-white/5 p-4 overflow-y-auto">
          <GameInfoPanel />
        </div>

        {/* Center Panel: Chessboard + Timers */}
        <div className="flex-1 flex items-center justify-center">
          <ChessBoardSection />
        </div>

        {/* Right Panel: Move History + Game Actions */}
        <div className="w-[320px] border-l border-white/5 p-4 flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto">
            <MoveHistory />
          </div>
          <div className="mt-4">
            <GameActions />
          </div>
        </div>
      </div>
    </div>
  );
}
