import { Room, ConnectedClient, TimeControl } from "./types";
import { WebSocket } from "ws";

export const rooms: Map<string, Room> = new Map(); // Exported for index.ts
const socketRoomMap: Map<WebSocket, string> = new Map();
const RECONNECT_GRACE_PERIOD = 15 * 1000; // 15 seconds

function generateRoomId(length: number = 6): string {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let id = "";
  for (let i = 0; i < length; i++) {
    id += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return id;
}

export function createRoom(
  socket: WebSocket,
  timeControl: TimeControl,
  creatorColorChoice: "white" | "black" = "white",
  userId?: string
): string {
  const roomId = generateRoomId();
  const player: ConnectedClient = {
    socket,
    userId,
    role: "player",
    color: creatorColorChoice,
  };

  const room: Room = {
    id: roomId,
    players: [player],
    spectators: [],
    timeControl,
    creatorColorChoice,
    createdAt: Date.now(),
  };

  rooms.set(roomId, room);
  socketRoomMap.set(socket, roomId);
  return roomId;
}

export function joinRoom(
  socket: WebSocket,
  roomId: string,
  userId?: string
): "player" | "spectator" | "not_found" {
  const room = rooms.get(roomId);
  if (!room) return "not_found";

  const existing = room.players.find((p) => p.userId && p.userId === userId);
  if (existing) {
    if (existing.reconnectTimeout) {
      clearTimeout(existing.reconnectTimeout);
    }
    existing.socket = socket;
    existing.disconnected = false;
    existing.reconnectTimeout = undefined;
    socketRoomMap.set(socket, roomId);
    return "player";
  }

  if (room.players.length >= 2) {
    const spectator: ConnectedClient = {
      socket,
      userId,
      role: "spectator",
    };
    room.spectators.push(spectator);
    socketRoomMap.set(socket, roomId);
    return "spectator";
  }

  const existingColor = room.players[0]?.color;
  const newColor = existingColor === "white" ? "black" : "white";

  const newPlayer: ConnectedClient = {
    socket,
    userId,
    role: "player",
    color: newColor,
  };

  room.players.push(newPlayer);
  socketRoomMap.set(socket, roomId);
  return "player";
}

export function markDisconnected(
  socket: WebSocket,
  onTimeout: (roomId: string, userId?: string) => void
) {
  const roomId = socketRoomMap.get(socket);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  const player = room.players.find((p) => p.socket === socket);
  if (!player) return;

  player.disconnected = true;

  player.reconnectTimeout = setTimeout(() => {
    onTimeout(roomId, player.userId);
  }, RECONNECT_GRACE_PERIOD);
}

export function removeClient(socket: WebSocket) {
  const roomId = socketRoomMap.get(socket);
  if (!roomId) return;

  const room = rooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter((p) => p.socket !== socket);
  room.spectators = room.spectators.filter((s) => s.socket !== socket);
  socketRoomMap.delete(socket);

  if (room.players.length === 0) {
    rooms.delete(roomId);
  }
}

export function getRoomId(socket: WebSocket): string | undefined {
  return socketRoomMap.get(socket);
}

export function getRoom(socket: WebSocket): Room | undefined {
  const roomId = getRoomId(socket);
  return roomId ? rooms.get(roomId) : undefined;
}

// ✅ Added for general access
export function getRoomById(roomId: string): Room | undefined {
  return rooms.get(roomId);
}

export function getOpponent(socket: WebSocket): WebSocket | null {
  const room = getRoom(socket);
  if (!room) return null;

  const opponent = room.players.find(
    (p) => p.socket !== socket && !p.disconnected
  );
  return opponent ? opponent.socket : null;
}

export function removeRoom(roomId: string): boolean {
  if (!rooms.has(roomId)) return false;
  return rooms.delete(roomId);
}

export function getSpectators(roomId: string): ConnectedClient[] {
  const room = rooms.get(roomId);
  return room ? room.spectators : [];
}

export function getAllSocketsInRoom(roomId: string): WebSocket[] {
  const room = rooms.get(roomId);
  if (!room) return [];
  return [
    ...room.players.map((p) => p.socket),
    ...room.spectators.map((s) => s.socket),
  ];
}
