import { Header } from "../../components/common/Header";
import GameInfoPanel from "../../components/chess/GameInfoPanel";
import ChessBoardSection from "../../components/chess/ChessBoardSection";
import MoveHistory from "../../components/chess/MoveHistory";
import GameActions from "../../components/chess/GameActions";

export default function PlayPage() {
  return (
    <div className="flex flex-col h-screen w-full bg-black text-white overflow-hidden">
      {/* Header */}
      <Header />

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col items-center gap-6 md:flex-row md:items-start md:justify-center">
        {/* 1. Chessboard - always prioritized */}
        <div className="w-full flex justify-center order-1 md:order-2">
          <ChessBoardSection />
        </div>

        {/* 2. Game Info Panel */}
        <div className="w-full max-w-[400px] flex justify-center order-2 md:order-1">
          <GameInfoPanel />
        </div>

        {/* 3. Game Actions */}
        <div className="w-full max-w-[400px] flex justify-center order-3 md:order-3">
          <GameActions />
        </div>

        {/* 4. Move History */}
        <div className="w-full max-w-[400px] flex justify-center order-4 md:order-4">
          <MoveHistory />
        </div>
      </div>
    </div>
  );
}
