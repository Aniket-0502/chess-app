"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Button } from "../components/ui/button";
import Image from "next/image";
import { useSocketStore } from "../../store/socketStore";
import { useGameStore } from "../../store/gameStore";

export default function GameSetupCard() {
  const [userId, setUserId] = useState("");
  const { socket, setSocket } = useSocketStore();
  const { setGameInfo } = useGameStore();
  const router = useRouter();

  const [createName, setCreateName] = useState("");
  const [createColor, setCreateColor] = useState("");
  const [createTime, setCreateTime] = useState("");
  const [joinName, setJoinName] = useState("");
  const [roomId, setRoomId] = useState("");

  const [errors, setErrors] = useState({
    createName: false,
    createColor: false,
    createTime: false,
    joinName: false,
    roomId: false,
  });

  useEffect(() => {
    const existing = localStorage.getItem("userId");
    const newId = existing || uuidv4();
    if (!existing) localStorage.setItem("userId", newId);
    setUserId(newId);
    useGameStore.getState().setUserId(newId);

    if (!socket) {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL!;
      const newSocket = new WebSocket(wsUrl);
      setSocket(newSocket);

      newSocket.onmessage = (event) => {
        const message = JSON.parse(event.data);

        if (message.type === "error") {
          alert(message.message);
          return;
        }

        if (message.type === "room_created" || message.type === "joined") {
          newSocket.send(JSON.stringify({ type: "status_check" }));
          router.push("/play");
        }

        if (message.type === "status" && message.players) {
          useGameStore.getState().setPlayerUserIds({
            whitePlayerUserId: message.players.white,
            blackPlayerUserId: message.players.black,
          });
        }

        console.log("[WS] Message from server:", message);
      };
    }
  }, [router, socket, setSocket]);

  const parseTimeControl = (
    str: string
  ): { time: number; increment: number } => {
    const [minStr, incStr] = str.split("+");
    const minutes = Number(minStr) || 1;
    const increment = Number(incStr) || 0;
    return {
      time: minutes * 60,
      increment,
    };
  };

  const validateCreate = () => {
    const newErrors = {
      createName: createName.trim() === "",
      createColor: createColor === "",
      createTime: createTime === "",
      joinName: false,
      roomId: false,
    };
    setErrors(newErrors);

    const valid =
      !newErrors.createName && !newErrors.createColor && !newErrors.createTime;

    if (valid && socket?.readyState === WebSocket.OPEN) {
      const parsed = parseTimeControl(createTime);
      const finalColor: "white" | "black" =
        createColor === "random"
          ? Math.random() < 0.5
            ? "white"
            : "black"
          : (createColor as "white" | "black");

      setGameInfo({
        player1: createName,
        player2: "",
        player1Color: finalColor,
        player2Color: finalColor === "white" ? "black" : "white",
        roomId: "",
        timeControl: parsed,
      });

      socket.send(
        JSON.stringify({
          type: "create",
          userId,
          name: createName,
          creatorColorChoice: finalColor,
          timeControl: parsed,
        })
      );
    }
  };

  const validateJoin = () => {
    const newErrors = {
      createName: false,
      createColor: false,
      createTime: false,
      joinName: joinName.trim() === "",
      roomId: roomId.trim() === "",
    };
    setErrors(newErrors);

    const valid = !newErrors.joinName && !newErrors.roomId;

    if (valid && socket?.readyState === WebSocket.OPEN) {
      setGameInfo({
        player1: "",
        player2: joinName,
        player1Color: "white",
        player2Color: "black",
        roomId: roomId,
        timeControl: { time: 0, increment: 0 },
      });

      socket.send(
        JSON.stringify({
          type: "join",
          userId,
          name: joinName,
          roomId,
        })
      );
    }
  };

  return (
    <div className="flex flex-col md:flex-row gap-6 px-4 md:px-6 w-full max-w-6xl mx-auto mb-10">
      {/* CREATE GAME CARD */}
      <Card className="text-white min-h-[540px] flex-1 border-white/5 bg-gradient-to-b from-[#0F172B] to-[#1D293D]">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-[22px] sm:text-[25px] font-bold font-poppins">
              Create Game
            </h2>
            <div className="mt-3 text-[#99A1AF] text-[14px] max-w-xs mx-auto font-medium">
              Set up a game and share the code with your opponent
            </div>
          </div>
          <div className="flex flex-col gap-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="flex items-center">
                <Image
                  src="/personIcon.svg"
                  alt="User Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Name
              </Label>
              <Input
                id="name"
                maxLength={20}
                placeholder="Enter your name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-md ${
                  errors.createName
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10"
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="color" className="flex items-center">
                <Image
                  src="/controllerIcon.svg"
                  alt="Controller Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Play As
              </Label>
              <Select value={createColor} onValueChange={setCreateColor}>
                <SelectTrigger
                  className={`w-full rounded-md px-3 py-2 text-sm ${
                    errors.createColor
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 border"
                  }`}
                >
                  <SelectValue placeholder="Select color" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="white">White</SelectItem>
                  <SelectItem value="black">Black</SelectItem>
                  <SelectItem value="random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="time" className="flex items-center">
                <Image
                  src="/clockIcon.svg"
                  alt="Clock Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Time Control
              </Label>
              <Select value={createTime} onValueChange={setCreateTime}>
                <SelectTrigger
                  className={`w-full rounded-md px-3 py-2 text-sm ${
                    errors.createTime
                      ? "border-red-500 focus:ring-red-500"
                      : "border-white/10 border"
                  }`}
                >
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "1+0",
                    "3+0",
                    "3+2",
                    "5+0",
                    "5+3",
                    "10+0",
                    "10+5",
                    "30+0",
                  ].map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={validateCreate}
            className="w-full mt-5 h-[52px] bg-[#8E51FF] font-semibold font-poppins text-[18px] hover:bg-[#7a3ed6]"
          >
            Create & Get Code
          </Button>
        </CardContent>
      </Card>

      {/* JOIN GAME CARD */}
      <Card className="text-white min-h-[540px] flex-1 border-white/5 bg-gradient-to-b from-[#0F172B] to-[#1D293D]">
        <CardContent className="space-y-4 pt-6">
          <div className="flex flex-col items-center text-center">
            <h2 className="text-[22px] sm:text-[25px] font-bold font-poppins">
              Join Game
            </h2>
            <div className="mt-3 text-[#99A1AF] text-[14px] max-w-xs mx-auto font-medium">
              Enter your name and room ID shared by your opponent
            </div>
          </div>
          <div className="flex flex-col gap-6 mt-6">
            <div className="space-y-2">
              <Label htmlFor="join-name" className="flex items-center">
                <Image
                  src="/personIcon.svg"
                  alt="User Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Name
              </Label>
              <Input
                id="join-name"
                maxLength={20}
                placeholder="Enter your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className={`w-full px-3 py-2 text-sm border rounded-md ${
                  errors.joinName
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10"
                }`}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-id" className="flex items-center">
                <Image
                  src="/trophy.svg"
                  alt="Room Icon"
                  width={20}
                  height={20}
                  className="mr-2"
                />
                Room ID
              </Label>
              <Input
                id="room-id"
                placeholder="Enter 6-digit code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className={`tracking-[0.23em] px-3 py-2 text-sm border rounded-md ${
                  errors.roomId
                    ? "border-red-500 focus:border-red-500"
                    : "border-white/10"
                }`}
              />
              <div className="text-[#99A1AF] text-[11px] text-center font-medium font-poppins">
                Ask your opponent for the game code they received
              </div>
            </div>
          </div>
          <Button
            onClick={validateJoin}
            className="w-full mt-5 h-[52px] bg-[#00C950] font-semibold font-poppins text-[18px] hover:bg-[#00B347]"
          >
            Join Game
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
