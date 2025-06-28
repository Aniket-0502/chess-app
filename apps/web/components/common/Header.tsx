"use client";

import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSocketStore } from "../../store/socketStore";
import { useGameStore } from "../../store/gameStore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../components/ui/dialog";
import { Button } from "../components/ui/button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { socket } = useSocketStore();
  const { color } = useGameStore();

  const [showLeaveButton, setShowLeaveButton] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    setShowLeaveButton(pathname === "/play");
  }, [pathname]);

  const handleConfirmLeave = () => {
    if (socket && socket.readyState === WebSocket.OPEN && color) {
      socket.send(JSON.stringify({ type: "resign" }));
    }
    router.push("/");
  };

  return (
    <>
      <header className="w-full h-[88px] bg-black border-b border-white px-[50px] flex items-center justify-between">
        {/* Left: Logo and Brand Name */}
        <div className="flex items-center">
          <Image src="/brandLogo.svg" alt="Logo" width={55} height={55} />
          <h1 className="text-[26px] font-bold font-sans text-white ml-2">
            KwikChess
          </h1>
        </div>

        {/* Right: User Icon and optional Leave button */}
        <div className="flex items-center gap-4">
          {showLeaveButton && (
            <button
              onClick={() => setShowDialog(true)}
              className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-red-700 transition"
            >
              <Image
                src="/leaveIcon.svg"
                alt="Leave Icon"
                width={20}
                height={20}
              />
              Leave
            </button>
          )}

          <button className="rounded-full p-2 hover:bg-white/10 transition">
            <Image src="/userIcon.svg" alt="User Icon" width={40} height={40} />
          </button>
        </div>
      </header>

      {/* Confirmation Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#1e1e2f] text-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Leave Game?</DialogTitle>
          </DialogHeader>
          <p className="text-sm mt-2">
            Leaving the game now will count as a resignation. Are you sure you
            want to leave?
          </p>
          <DialogFooter className="flex justify-end gap-2 mt-4">
            <Button
              variant="ghost"
              onClick={() => setShowDialog(false)}
              className="text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmLeave}
              className="bg-red-600 hover:bg-red-500 text-white"
            >
              Resign & Leave
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
