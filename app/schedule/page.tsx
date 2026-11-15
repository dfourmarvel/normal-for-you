import { shelterBlocks } from "@/lib/environment/shelter";
import { buildSimpleSchedule } from "@/lib/scheduler/simple";

export default function SchedulePage() {
  const crewIds = [
    "crew-1",
    "crew-2",
    "crew-3",
    "crew-4",
  ];

  const weeklyTargets = {
    "crew-1": 3,
    "crew-2": 3,
    "crew-3": 3,
    "crew-4": 3,
  };

  const normal = buildSimpleSchedule({
    crewIds,
    blockedSlots: [],
    weeklyTargets,
    recoveryCrewIds: [],
  });

  const storm = buildSimpleSchedule({
    crewIds,
    blockedSlots: shelterBlocks(3, [4, 5, 6]),
    weeklyTargets,
    recoveryCrewIds: [],
  });

  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="mb-6 text-4xl font-bold">
        Crew Scheduler
      </h1>

      <div className="grid gap-6 md:grid-cols-2">
        <SolverCard
          title="Normal Week"
          assignments={normal.assignments.length}
          penalty={normal.penalty}
          hardBreaks={normal.hardBreaks}
          runtime={normal.ms}
        />

        <SolverCard
          title="Storm Week"
          assignments={storm.assignments.length}
          penalty={storm.penalty}
          hardBreaks={storm.hardBreaks}
          runtime={storm.ms}
        />
      </div>

      <section className="mt-8 rounded-lg border p-4">
        <h2 className="mb-4 text-xl font-semibold">
          Storm Impact
        </h2>

        <p>
          Shelter blocks added:
          <strong> Day 3 Slots 4-6</strong>
        </p>

        <p>
          Schedule rebuilt automatically with shelter
          constraints.
        </p>
      </section>
    </main>
  );
}

type SolverCardProps = {
  title: string;
  assignments: number;
  penalty: number;
  hardBreaks: number;
  runtime: number;
};

function SolverCard({
  title,
  assignments,
  penalty,
  hardBreaks,
  runtime,
}: SolverCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <h2 className="mb-3 text-2xl font-semibold">
        {title}
      </h2>

      <div>Assignments: {assignments}</div>

      <div>Penalty: {penalty}</div>

      <div>Hard Breaks: {hardBreaks}</div>

      <div>Runtime: {runtime} ms</div>
    </div>
  );
}