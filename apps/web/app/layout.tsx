import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KwikChess",
  description: "Play chess at warp speed.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // --- 1. THE FIX ---
    // Added h-full to the html tag
    <html lang="en" className="h-full">
      <head>
        {/* ✅ Font Preloading for Performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Playwrite+DE+Grund:wght@100..400&family=Poppins:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;0,800;0,900;1,100;1,200;1,300;1,400;1,500;1,600;1,700;1,800;1,900&family=Stardos+Stencil:wght@400;700&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* --- 2. THE FIX ---
        Added h-full and w-full to the body tag
      */}
      <body className="bg-black text-white font-sans h-full w-full">
        {children}
      </body>
    </html>
  );
}
