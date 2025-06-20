import { WebSocketServer } from "ws";
import { createServer } from "http";
import {
  createRoom,
  joinRoom,
  markDisconnected,
  removeClient,
  getRoomId,
  getRoom,
  getOpponent,
  getAllSocketsInRoom,
  rooms,
} from "./roomManager";
import {
  createGame,
  makeMove,
  resignGame,
  forceTimeoutLoss,
  getGame,
  removeGame,
} from "./gameManager";
import { startClock } from "./clock";
import type { ServerMessage, ClientMessage } from "./types";

const server = createServer();
const wss = new WebSocketServer({ server });

wss.on("connection", (socket) => {
  console.log("[WS] ✅ New client connected");

  // 👉 Send confirmation of connection
  socket.send(
    JSON.stringify({
      type: "connected",
      message: "Connection established",
    })
  );

  socket.on("message", (data) => {
    let parsed: ClientMessage;
    try {
      parsed = JSON.parse(data.toString());
    } catch {
      return;
    }

    const send = (msg: ServerMessage) => {
      if (socket.readyState === socket.OPEN) {
        socket.send(JSON.stringify(msg));
      }
    };
    switch (parsed.type) {
      case "create": {
        const roomId = createRoom(
          socket,
          parsed.timeControl,
          parsed.creatorColorChoice,
          parsed.userId
        );
        createGame(roomId, parsed.timeControl);
        send({ type: "room_created", roomId });
        break;
      }

      case "join": {
        const role = joinRoom(socket, parsed.roomId, parsed.userId);
        if (role === "not_found") {
          send({ type: "error", message: "Room not found" });
          return;
        }
        const room = getRoom(socket);
        const game = getGame(parsed.roomId);
        send({ type: "joined", role, roomId: parsed.roomId });

        if (role === "player" && room && room.players.length === 2 && game) {
          getAllSocketsInRoom(room.id).forEach((client) => {
            const color = room.players.find((p) => p.socket === client)?.color;
            client.send(
              JSON.stringify({
                type: "game_start",
                fen: game.chess.fen(),
                color,
                timeControl: game.timeControl,
              })
            );
          });

          // ✅ START THE CLOCK
          startClock(game);
        }
        break;
      }

      case "reconnect": {
        const { roomId, userId } = parsed;
        const room = roomId ? rooms.get(roomId) : null;
        const game = roomId ? getGame(roomId) : null;

        if (!roomId || !userId || !room || !game) {
          send({ type: "error", message: "Failed to reconnect" });
          return;
        }

        const client = room.players.find((p) => p.userId === userId);
        if (!client) {
          send({ type: "error", message: "Player not found" });
          return;
        }

        client.socket = socket;
        client.disconnected = false;
        if (client.reconnectTimeout) clearTimeout(client.reconnectTimeout);

        send({ type: "joined", role: "player", roomId });
        send({
          type: "game_start",
          fen: game.chess.fen(),
          color: client.color!,
          timeControl: game.timeControl,
        });

        break;
      }

      case "move": {
        console.log("[server] Received move:", parsed);

        const roomId = getRoomId(socket);
        const room = getRoom(socket);
        if (!roomId || !room) {
          console.log("[server] No room found for move");
          return;
        }

        const player = room.players.find((p) => p.socket === socket);
        if (!player || !player.color) {
          console.log("[server] No valid player or color");
          return;
        }

        const result = makeMove(
          roomId,
          parsed.from,
          parsed.to,
          parsed.promotion,
          player.color
        );

        if (!result.valid) {
          console.log("[server] Invalid move:", result.reason);
          if (result.timedOut) {
            getAllSocketsInRoom(roomId).forEach((s) =>
              s.send(
                JSON.stringify({
                  type: "game_over",
                  reason: "timeout",
                  winner: result.winner,
                })
              )
            );
            removeGame(roomId);
            return;
          }

          send({
            type: "error",
            message: result.reason || "Invalid move",
          });
          return;
        }

        const message: ServerMessage = {
          type: "move_made",
          move: result.move!,
          fen: result.fen!,
          remainingTime: result.remainingTime!,
          history: result.history!,
        };

        getAllSocketsInRoom(roomId).forEach((s) =>
          s.send(JSON.stringify(message))
        );

        if (result.gameOver) {
          const gameWinner =
            message.history.length % 2 === 0 ? "black" : "white";
          console.log(
            `[game_over] ♟️ Game over in room ${roomId}, winner: ${gameWinner}`
          );
          getAllSocketsInRoom(roomId).forEach((s) =>
            s.send(
              JSON.stringify({
                type: "game_over",
                winner: gameWinner,
                reason: "checkmate",
              })
            )
          );
          removeGame(roomId);
        }
        break;
      }
      case "status_check": {
        const roomId = getRoomId(socket);
        const game = roomId ? getGame(roomId) : null;

        send({
          type: "status",
          inGame: !!(roomId && game),
          roomId: roomId || null,
        });
        break;
      }

      case "resign": {
        const roomId = getRoomId(socket);
        const room = getRoom(socket);
        if (!roomId || !room) return;

        const player = room.players.find((p) => p.socket === socket);
        if (!player || !player.color) return;

        const result = resignGame(roomId, player.color);

        if (result.success) {
          getAllSocketsInRoom(roomId).forEach((s) =>
            s.send(
              JSON.stringify({
                type: "game_over",
                reason: "resign",
                winner: result.winner,
              })
            )
          );
          removeGame(roomId);
        }
        break;
      }

      case "draw_offer": {
        const opponent = getOpponent(socket);
        if (opponent) {
          opponent.send(JSON.stringify({ type: "draw_offer" }));
        }
        break;
      }

      case "draw_response": {
        const { accepted } = parsed;
        const roomId = getRoomId(socket);
        const room = getRoom(socket);
        if (!roomId || !room) return;

        if (accepted) {
          getAllSocketsInRoom(roomId).forEach((s) =>
            s.send(JSON.stringify({ type: "game_over", reason: "draw" }))
          );
          removeGame(roomId);
        } else {
          const opponent = getOpponent(socket);
          if (opponent) {
            opponent.send(JSON.stringify({ type: "draw_rejected" }));
          }
        }
        break;
      }

      default: {
        send({ type: "error", message: "Unknown message type" });
        break;
      }
    }
  });

  socket.on("close", () => {
    markDisconnected(socket, (roomId, userId) => {
      const game = getGame(roomId);
      if (!game) return;

      const result = forceTimeoutLoss(
        roomId,
        game.currentTurn === "w" ? "white" : "black"
      );

      if (!result.success) return;

      getAllSocketsInRoom(roomId).forEach((s) =>
        s.send(
          JSON.stringify({
            type: "game_over",
            reason: "timeout",
            loser: result.loser,
          })
        )
      );

      removeGame(roomId);
    });

    removeClient(socket);
  });
});

server.listen(3001, () => {
  console.log("WebSocket server listening on port 3001");
});
