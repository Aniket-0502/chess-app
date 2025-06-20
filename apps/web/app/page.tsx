// app/page.tsx

import { LandingHero } from "../components/landing/LandingHero";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-black text-white">
      <LandingHero />
    </main>
  );
}
