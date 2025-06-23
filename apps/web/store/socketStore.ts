// stores/socketStore.ts
import { create } from "zustand";

interface SocketStore {
  socket: WebSocket | null;
  setSocket: (socket: WebSocket) => void;
}

export const useSocketStore = create<SocketStore>((set) => ({
  socket: null,
  setSocket: (socket: WebSocket) => set({ socket }),
}));
