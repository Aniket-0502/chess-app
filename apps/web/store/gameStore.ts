import { create } from "zustand";

interface GameStoreState {
  player1: string | null;
  player2: string | null;
  player1Color: "white" | "black" | null;
  player2Color: "white" | "black" | null;
  roomId: string | null;
  timeControl: { time: number; increment: number } | null;

  setGameInfo: (data: {
    player1: string;
    player2: string;
    player1Color: "white" | "black" | "";
    player2Color: "white" | "black" | "";
    roomId: string;
    timeControl: { time: number; increment: number };
  }) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  player1: null,
  player2: null,
  player1Color: null,
  player2Color: null,
  roomId: null,
  timeControl: null,

  setGameInfo: (data) => {
    console.log("🛠️ setGameInfo called with:", data);

    set({
      player1: data.player1,
      player2: data.player2,
      player1Color: data.player1Color === "" ? null : data.player1Color,
      player2Color: data.player2Color === "" ? null : data.player2Color,
      roomId: data.roomId,
      timeControl: data.timeControl,
    });
  },
}));
