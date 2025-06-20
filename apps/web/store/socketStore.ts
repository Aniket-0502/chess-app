// stores/socketStore.ts
import { create } from "zustand";

type SocketStore = {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket) => void;
};

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  setSocket: (socket) => set({ socket }),
}));
