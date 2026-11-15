import { RecommendationCard } from "@/components/intelligence/RecommendationCard";
import { Button } from "@/components/shared/Button";
import { PageHeader } from "@/components/shared/PageHeader";

export default function RecommendationsPage() {
  return (
    <>
      <PageHeader
        title="Recommendations"
        subtitle="Constraint-aware countermeasures · human-in-the-loop · SB optimizer: not built"
        actions={<Button href="/optimization">View solver</Button>}
      />
      <div className="space-y-4">
        <RecommendationCard
          title="Reyes — ARED MSK-R3 at 08:30"
          priority="high"
          body="Addresses MSK-DECOND-L before high-CO₂ work window."
          tags={["Exercise", "45 min", "Hazard: altered gravity"]}
        />
        <RecommendationCard
          title="Park — protected sleep 21:00–06:00"
          priority="high"
          body="Defers noncritical science ops. Targets CIRC-FRAG-M. Pair with night CO₂ scrubber priority."
          tags={["Sleep", "Isolation / closed env"]}
        />
        <RecommendationCard
          title="All crew — SPE shelter drill 18:40"
          priority="medium"
          body="Tabletop + path rehearsal. Radiation hazard preparedness without conflicting with Reyes recovery block."
          tags={["Radiation", "Shared module time"]}
        />
        <RecommendationCard
          title="Reyes — hydration 3.2 L + electrolyte review"
          priority="medium"
          body="Supports fluid-shift and post-exercise recovery. Self-check at 11:00."
          tags={["Hydration"]}
        />
      </div>
    </>
  );
}
