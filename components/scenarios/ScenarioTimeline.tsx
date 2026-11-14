import { Card } from "@/components/shared/Card";
import type { Scenario } from "@/lib/types";

export function ScenarioTimeline({ scenario }: { scenario: Scenario }) {
  const phases: { key: "before" | "during" | "after"; tone: string }[] = [
    { key: "before", tone: "border-border" },
    { key: "during", tone: "border-primary ring-1 ring-primary/20" },
    { key: "after", tone: "border-teal/40" },
  ];
  return (
    <div className="grid md:grid-cols-3 gap-4 mb-4">
      {phases.map((p) => {
        const phase = scenario.phases[p.key];
        return (
          <Card key={p.key} className={`relative ${p.tone}`}>
            <div className="w-2.5 h-2.5 rounded-full bg-primary mb-2" />
            <div className="text-[11px] uppercase tracking-wide text-muted">
              {phase.label} · {phase.window}
            </div>
            <h3 className="font-semibold text-[15px] mt-2">{headingTitle(p.key, scenario)}</h3>
            <p className="text-sm text-secondary mt-2">{phase.notes}</p>
            <div className="mt-3 space-y-1.5 text-sm">
              {Object.entries(phase.metrics).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-secondary capitalize">{k.replace(/_/g, " ")}</span>
                  <span
                    className={`font-medium ${
                      p.key === "during" && k.includes("stress") ? "text-primary" : ""
                    }`}
                  >
                    {typeof v === "number" ? v : String(v)}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

function headingTitle(key: "before" | "during" | "after", s: Scenario) {
  if (s.id.startsWith("spe")) {
    if (key === "before") return "Nominal ops";
    if (key === "during") return "SPE peak";
    return "Recovery";
  }
  return s.phases[key].label;
}
