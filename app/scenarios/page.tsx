import { ScenarioSelector } from "@/components/scenarios/ScenarioSelector";
import { PageHeader } from "@/components/shared/PageHeader";
import { getScenarios } from "@/lib/data";

export default function ScenariosPage() {
  return (
    <>
      <PageHeader
        title="Scenarios"
        subtitle="Before / during / after event timelines · tabletop and active-watch · simulated"
      />
      <ScenarioSelector scenarios={getScenarios()} />
    </>
  );
}
