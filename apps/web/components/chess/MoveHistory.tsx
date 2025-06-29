"use client";

import { useGameStore } from "../../store/gameStore";

export default function MoveHistory() {
  const { history } = useGameStore();

  // Format as [whiteMove, blackMove] pairs
  const formattedMoves: [string?, string?][] = [];
  for (let i = 0; i < history.length; i += 2) {
    formattedMoves.push([history[i], history[i + 1]]);
  }

  return (
    <div className="bg-[#1e1e2f] text-white p-4 rounded-lg w-full sm:max-w-[320px] min-h-[300px] max-h-[450px] border border-white/10 shadow-lg">
      <h2 className="text-xl font-semibold text-center mb-3">Moves</h2>

      {/* Column Headers */}
      <div className="grid grid-cols-3 text-sm font-medium border-b border-white/20 pb-2">
        <div className="text-center">#</div>
        <div className="text-center">White</div>
        <div className="text-center">Black</div>
      </div>

      {/* Move History List */}
      <div className="overflow-y-auto mt-2 pr-1 max-h-[calc(100%-80px)]">
        {formattedMoves.map(([white, black], index) => (
          <div
            key={index}
            className="grid grid-cols-3 py-1 text-sm font-mono text-white/90"
          >
            <div className="text-center">{index + 1}</div>
            <div className="text-center">{white || ""}</div>
            <div className="text-center">{black || ""}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
