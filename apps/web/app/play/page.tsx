import { Header } from "../../components/common/Header";
import GameInfoPanel from "../../components/chess/GameInfoPanel";
import ChessBoardSection from "../../components/chess/ChessBoardSection";
import MoveHistory from "../../components/chess/MoveHistory";
import GameActions from "../../components/chess/GameActions";

export default function PlayPage() {
  return (
    // Make sure this is h-full (not h-screen)
    <div className="flex flex-col h-full w-full bg-black text-white overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content (This container is correct) */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        {/* 1. Chessboard */}
        <div className="w-full max-w-[480px] flex justify-center order-1 md:order-2">
          <ChessBoardSection />
        </div>

        {/* 2. Game Info Panel */}
        {/* --- FIX: Changed to 480px --- */}
        <div className="w-full max-w-[480px] flex justify-center order-2 md:order-1">
          <GameInfoPanel />
        </div>

        {/* 3. Game Actions */}
        {/* --- FIX: Changed to 480px --- */}
        <div className="w-full max-w-[480px] flex justify-center order-3 md:order-3">
          <GameActions />
        </div>

        {/* 4. Move History */}
        {/* --- FIX: Changed to 480px --- */}
        <div className="w-full max-w-[480px] flex justify-center order-4 md:order-4">
          <MoveHistory />
        </div>
      </div>
    </div>
  );
}
