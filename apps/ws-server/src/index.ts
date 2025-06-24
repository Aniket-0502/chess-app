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

  socket.send(
    JSON.stringify({ type: "connected", message: "Connection established" })
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
          parsed.userId,
          parsed.name
        );
        createGame(roomId, parsed.timeControl);
        send({ type: "room_created", roomId });
        break;
      }

      case "join": {
        const role = joinRoom(
          socket,
          parsed.roomId,
          parsed.userId,
          parsed.name
        );
        if (role === "not_found") {
          send({ type: "error", message: "Room not found" });
          return;
        }

        const room = getRoom(socket);
        const game = getGame(parsed.roomId);
        send({ type: "joined", role, roomId: parsed.roomId });

        if (room && room.players.length === 2 && game) {
          const [player1, player2] = room.players;

          const playersMap = Object.fromEntries(
            room.players.map((p) => [p.color!, p.userId ?? "Unknown"])
          );

          getAllSocketsInRoom(room.id).forEach((client) => {
            const color = room.players.find((p) => p.socket === client)?.color;
            client.send(
              JSON.stringify({
                type: "game_start",
                fen: game.chess.fen(),
                color,
                timeControl: game.timeControl,
                player1: player1?.userId ?? "Unknown",
                player2: player2?.userId ?? "Unknown",
                player1Color: player1?.color ?? "white",
                player2Color: player2?.color ?? "black",
              })
            );

            client.send(
              JSON.stringify({
                type: "status",
                inGame: true,
                roomId: room.id,
                players: playersMap,
                whiteName:
                  room.players.find((p) => p.color === "white")?.name ||
                  "White",
                blackName:
                  room.players.find((p) => p.color === "black")?.name ||
                  "Black",
                timeControl: game.timeControl,
                whitePlayerUserId:
                  room.players.find((p) => p.color === "white")?.userId ||
                  "White",
                blackPlayerUserId:
                  room.players.find((p) => p.color === "black")?.userId ||
                  "Black",
              })
            );
          });

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
          player1: room.players[0]?.userId ?? "Unknown",
          player2: room.players[1]?.userId ?? "Unknown",
          player1Color: room.players[0]?.color ?? "white",
          player2Color: room.players[1]?.color ?? "black",
        });

        break;
      }

      case "move": {
        const roomId = getRoomId(socket);
        const room = getRoom(socket);
        if (!roomId || !room) return;

        const player = room.players.find((p) => p.socket === socket);
        if (!player || !player.color) return;

        const result = makeMove(
          roomId,
          parsed.from,
          parsed.to,
          parsed.promotion ?? undefined, // ✅ only pass promotion if available
          player.color
        );

        if (!result.valid) {
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

          send({ type: "error", message: result.reason || "Invalid move" });
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
        const room = roomId ? rooms.get(roomId) : null;
        const game = roomId ? getGame(roomId) : null;

        if (!room || !game) {
          send({ type: "status", inGame: false, roomId: null });
          return;
        }

        const whitePlayer = room.players.find((p) => p.color === "white");
        const blackPlayer = room.players.find((p) => p.color === "black");

        send({
          type: "status",
          inGame: true,
          roomId: roomId ?? null,
          players: {
            white: whitePlayer?.userId || "White",
            black: blackPlayer?.userId || "Black",
          },
          whiteName: whitePlayer?.name || "White",
          blackName: blackPlayer?.name || "Black",
          timeControl: room.timeControl,
          whitePlayerUserId: whitePlayer?.userId || "White",
          blackPlayerUserId: blackPlayer?.userId || "Black",
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
