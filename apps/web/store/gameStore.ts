import { create } from "zustand";

interface GameStoreState {
  player1: string | null;
  player2: string | null;
  player1Color: "white" | "black" | null;
  player2Color: "white" | "black" | null;
  roomId: string | null;
  timeControl: { time: number; increment: number } | null;

  fen: string;
  color: "white" | "black" | null;

  userId: string | null;
  whitePlayerUserId: string | null;
  blackPlayerUserId: string | null;

  setGameInfo: (data: {
    player1: string;
    player2: string;
    player1Color: "white" | "black";
    player2Color: "white" | "black";
    roomId: string;
    timeControl: { time: number; increment: number };
  }) => void;

  setFullGameState: (data: {
    fen: string;
    color: "white" | "black";
    player1: string;
    player2: string;
    player1Color: "white" | "black";
    player2Color: "white" | "black";
    roomId: string;
    timeControl: { time: number; increment: number };
  }) => void;

  setPlayerUserIds: (data: {
    whitePlayerUserId: string;
    blackPlayerUserId: string;
  }) => void;

  setFen: (fen: string) => void;
  setColor: (color: "white" | "black") => void;

  setUserId: (id: string) => void;
}

export const useGameStore = create<GameStoreState>((set) => ({
  player1: null,
  player2: null,
  player1Color: null,
  player2Color: null,
  roomId: null,
  timeControl: null,

  fen: "start",
  color: null,

  userId: null,
  whitePlayerUserId: null,
  blackPlayerUserId: null,

  setGameInfo: (data) => {
    console.log("🛠️ setGameInfo called with:", data);
    set({
      player1: data.player1,
      player2: data.player2,
      player1Color: data.player1Color,
      player2Color: data.player2Color,
      roomId: data.roomId,
      timeControl: data.timeControl,
    });
  },

  setFullGameState: (data) => {
    console.log("🎯 setFullGameState:", data);
    set({
      fen: data.fen,
      color: data.color,
      player1: data.player1,
      player2: data.player2,
      player1Color: data.player1Color,
      player2Color: data.player2Color,
      roomId: data.roomId,
      timeControl: data.timeControl,
    });
  },

  setPlayerUserIds: ({ whitePlayerUserId, blackPlayerUserId }) => {
    set({ whitePlayerUserId, blackPlayerUserId });
  },

  setFen: (fen) => set({ fen }),
  setColor: (color) => set({ color }),
  setUserId: (id) => set({ userId: id }),
}));
