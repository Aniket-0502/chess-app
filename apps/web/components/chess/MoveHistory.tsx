"use client";

import { useGameStore } from "../../store/gameStore";

export default function MoveHistory() {
  const { history } = useGameStore();

  // Convert ["e2e4", "e7e5", "g1f3", "b8c6", ...] into rows: [[e4, e5], [Nf3, Nc6], ...]
  const formattedMoves: [string?, string?][] = [];
  for (let i = 0; i < history.length; i += 2) {
    formattedMoves.push([history[i], history[i + 1]]);
  }

  return (
    <div className="bg-[#1e1e2f] text-white p-4 rounded-lg w-full max-w-[320px] border border-white/10 shadow-lg">
      <h2 className="text-xl font-semibold text-center mb-3">Moves</h2>
      <div className="grid grid-cols-3 text-sm font-medium border-b border-white/20 pb-2">
        <div className="text-center">#</div>
        <div className="text-center">White</div>
        <div className="text-center">Black</div>
      </div>

      <div className="max-h-[400px] overflow-y-auto mt-2">
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
