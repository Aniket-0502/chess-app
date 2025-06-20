// components/landing/LandingHero.tsx
import { Header } from "../common/Header";
import GameSetupCard from "./GameSetupCard";
import { HeroSection } from "./HeroSection";

export function LandingHero() {
  return (
    <section>
      <Header />
      {/* Add the rest of the hero layout here */}
      <HeroSection />
      <GameSetupCard />
    </section>
  );
}
