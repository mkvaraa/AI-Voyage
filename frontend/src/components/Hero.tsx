import { ArrowRight } from 'lucide-react';
import { useState } from 'react';
import ItineraryCard from './ItineraryCard';
import { Link } from 'react-router';

export default function Hero() {
  const [activeDay, setActiveDay] = useState(0);
  const [replacingIdx, setReplacingIdx] = useState<number | null>(null);

  const handleReplace = (i: number) => {
    setReplacingIdx(i);
    setTimeout(() => setReplacingIdx(null), 1400);
  };

  return (
    <section className="flex items-center py-16 lg:py-18 px-6">
      <div className="w-full max-w-7xl mx-auto grid lg:grid-cols-[1fr_1fr] gap-10 xl:gap-16 items-center">
        {/* Left */}
        <div>
          <h1 className="font-display text-5xl md:text-6xl xl:text-7xl font-semibold leading-[1.04] tracking-tight mb-6">
            Your journey,
            <br />
            <em className="font-display italic font-light text-primary">intelligently</em>
            <br />
            planned.
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mb-10">
            Tell us where you want to go, your budget, and what excites you. We handle the rest —
            itinerary, routing, logistics, and the local details you'd never find on your own.
          </p>

          <Link
            to="/plan"
            className="group inline-flex items-center gap-2 bg-primary text-primary-foreground rounded-xl px-6 py-3.5 text-sm font-semibold shadow-sm hover:opacity-90 transition-opacity duration-200"
          >
            Generate my itinerary
            <ArrowRight className="w-4 h-4 transition-transform duration-200 ease-out group-hover:translate-x-1" />
          </Link>

          <p className="text-xs text-muted-foreground mt-4 font-mono">
            No account needed · Free to try · Results in under 30 seconds
          </p>
        </div>

        {/* Right — itinerary preview card */}
        <div className="block">
          <ItineraryCard
            activeDay={activeDay}
            setActiveDay={setActiveDay}
            replacingIdx={replacingIdx}
            handleReplace={handleReplace}
            compact
          />
        </div>
      </div>
    </section>
  );
}
