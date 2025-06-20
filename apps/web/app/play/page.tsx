"use client";

import { useEffect, useState } from "react";

export default function PlayPage() {
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    const storedRoomId = localStorage.getItem("roomId");
    setRoomId(storedRoomId);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-[#0F172B] text-white px-4">
      <h1 className="text-4xl font-bold mb-4">Welcome to the Game Room</h1>
      {roomId ? (
        <p className="text-xl font-medium text-[#8E51FF]">
          Room Code: {roomId}
        </p>
      ) : (
        <p className="text-lg text-gray-400">Loading room code...</p>
      )}
    </div>
  );
}
