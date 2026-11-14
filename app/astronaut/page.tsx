import type { Metadata } from "next";
import Link from "next/link";
import { CARD, FOCUS, SimulatedBadge } from "@/components/astronaut/StatusChip";
import { crewCards, SCREENING, SIMULATED_LABEL } from "./model";

export const metadata: Metadata = {
  title: "Astronaut self-check · Normal for you",
  description: "Three simulated test astronauts. Every reading gets three answers: normal for people, for you, and for this mission day.",
};

export default function AstronautPickerPage() {
  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-8 sm:py-10">
      <header className="max-w-2xl">
        <SimulatedBadge text={SIMULATED_LABEL} />
        <h1 className="mt-3 text-[28px] leading-tight font-bold">Astronaut self-check</h1>
        <p className="mt-2 text-secondary">
          Every reading gets three answers: normal for people, normal for you, and normal for this mission day. Pick a test astronaut.
        </p>
      </header>
      <ul className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-3">
        {crewCards().map(({ astronaut, oneLine, storyDays }) => (
          <li key={astronaut.id}>
            <Link href={`/astronaut/${astronaut.id}`} className={`block h-full ${CARD} hover:border-primary ${FOCUS}`}>
              <span className="text-xs font-semibold tracking-[0.08em] text-secondary uppercase">Simulated astronaut</span>
              <h2 className="mt-1 text-lg font-semibold">{astronaut.name}</h2>
              <p className="mt-2 text-sm">{oneLine}</p>
              <p className="mt-3 text-sm font-medium text-chip-act">Opens at {storyDays.map((d) => d.label.toLowerCase()).join(", ")}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-6 text-sm font-semibold">{SCREENING}</p>
    </div>
  );
}
