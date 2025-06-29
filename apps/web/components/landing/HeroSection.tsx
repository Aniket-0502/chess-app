import Image from "next/image";

export function HeroSection() {
  return (
    <section className="flex flex-col-reverse lg:flex-row items-center justify-between gap-10 px-6 md:px-12 py-10 bg-black text-white min-h-[550px]">
      {/* Text Content */}
      <div className="flex flex-col justify-center items-center text-center max-w-xl">
        <h1 className="font-bebas text-[36px] sm:text-[44px] md:text-[56px] lg:text-[64px] leading-tight">
          CHECKMATE AT <span className="text-[#8E51FF]">WARP SPEED</span>
        </h1>
        <p className="text-[16px] sm:text-[18px] md:text-[20px] font-inter font-bold mt-4">
          Join instant <span className="text-[#FFB900]">blitz battles</span>— no
          logins, no waits, just pure chess.
        </p>
      </div>

      {/* Image */}
      <div className="flex justify-center items-center">
        <Image
          src="/chessBoard.svg"
          alt="chess board"
          width={320}
          height={320}
          className="w-[240px] sm:w-[280px] md:w-[340px] lg:w-[400px]"
        />
      </div>
    </section>
  );
}
