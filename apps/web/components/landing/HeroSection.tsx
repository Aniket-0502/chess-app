import Image from "next/image";

export function HeroSection() {
  return (
    <section className="flex items-center justify-around h-[550px] bg-black text-white">
      <div className="flex justify-center items-center">
        <Image
          src="/chessBoard.svg"
          alt="chess board"
          width={400}
          height={400}
          className="mx-auto"
        />
      </div>

      {/* Centered Text Content */}
      <div className="flex flex-col justify-center items-center text-center">
        <div className="font-bebas text-[56px] md:text-[64px]">
          CHECKMATE AT <span className="text-[#8E51FF]">WARP SPEED</span>
        </div>
        <p className="text-[20px] font-inter font-bold mt-4">
          Join instant <span className="text-[#FFB900]">blitz battles</span>—no
          logins, no waits, just pure chess.
        </p>
      </div>
    </section>
  );
}
