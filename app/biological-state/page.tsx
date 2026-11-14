import { EntropyPanel } from "@/components/biological/EntropyPanel";
import { InteractionGraph } from "@/components/biological/InteractionGraph";
import { StateDistribution } from "@/components/biological/StateDistribution";
import { StateTimeline } from "@/components/biological/StateTimeline";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tag } from "@/components/shared/Tag";
import { getTelemetry } from "@/lib/data";

export default function BiologicalStatePage() {
  const tel = getTelemetry();
  const dist = tel.state_distribution;

  return (
    <>
      <PageHeader
        title="Biological state"
        subtitle="Temporal state estimation · coupled-system interactions · Cmdr. Reyes · simulated"
        actions={<Tag tone="exp">EXPERIMENTAL MODULES</Tag>}
      />

      <div className="grid lg:grid-cols-[1.2fr_1fr] gap-4 mb-4">
        <InteractionGraph />
        <div className="space-y-4">
          <EntropyPanel value={dist.entropy_index} />
          <StateDistribution bins={dist.bins} values={dist.values} active={dist.active} />
        </div>
      </div>

      <StateTimeline />
    </>
  );
}
