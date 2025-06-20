"use client";

import Image from "next/image";

export function Header() {
  return (
    <header className="w-full h-[88px] bg-black border-b border-white px-[50px] flex items-center justify-between">
      {/* Left: Logo and Brand Name */}
      <div className="flex items-center">
        <Image src="/brandLogo.svg" alt="Logo" width={55} height={55} />
        <h1 className="text-[26px] font-bold font-sans text-white">
          KwikChess
        </h1>
      </div>

      {/* Right: User Icon */}
      <button className="rounded-full p-2 hover:bg-white/10 transition">
        <Image src="/userIcon.svg" alt="User Icon" width={40} height={40} />
      </button>
    </header>
  );
}
