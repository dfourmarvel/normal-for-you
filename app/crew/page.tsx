import { CrewCard } from "@/components/crew/CrewCard";
import { PageHeader } from "@/components/shared/PageHeader";
import { getCrew } from "@/lib/data";

export default function CrewPage() {
  const crew = getCrew();
  return (
    <>
      <PageHeader title="Crew" subtitle="4 members · simulated crew and telemetry" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {crew.map((m) => (
          <CrewCard key={m.id} member={m} />
        ))}
      </div>
    </>
  );
}
