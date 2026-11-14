import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/shared/Button";
import { SensorStatus } from "@/components/telemetry/SensorStatus";
import { TelemetryChart } from "@/components/telemetry/TelemetryChart";
import { getCrew, getTelemetryForMetric } from "@/lib/data";

export default function HealthAnalysisPage() {
  const crew = getCrew();
  const hrv = getTelemetryForMetric("cm-reyes", "hrv_rmssd");
  const sleep = getTelemetryForMetric("cm-reyes", "sleep_efficiency");
  const hr = getTelemetryForMetric("cm-reyes", "hr_rest");
  const co2 = getTelemetryForMetric("cm-reyes", "cabin_co2");

  return (
    <>
      <PageHeader
        title="Health analysis"
        subtitle="Telemetry vs personal baseline · Cmdr. Elena Reyes · 7-day window · simulated"
        actions={
          <>
            <select
              className="rounded-full border border-border bg-white px-4 py-2.5 text-[13px] font-semibold"
              aria-label="Crew"
              defaultValue="cm-reyes"
            >
              {crew.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <Button>Compare metrics</Button>
          </>
        }
      />

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <TelemetryChart
          title="HRV (RMSSD)"
          meta="ms · vs personal baseline band"
          series={hrv.series}
          baselineMean={hrv.baseline_mean}
          baselineBand={hrv.baseline_band}
          badge="−22% vs baseline"
          badgeStatus="attention"
        />
        <TelemetryChart
          title="Sleep efficiency"
          meta="% · nightly · vs baseline 88%"
          series={sleep.series}
          baselineMean={sleep.baseline_mean}
          baselineBand={sleep.baseline_band}
          badge="Watch"
          badgeStatus="watch"
          legendTelem="Nightly efficiency"
          legendBase="Baseline mean"
        />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <TelemetryChart
          title="Resting HR"
          series={hr.series}
          baselineMean={hr.baseline_mean}
          showBand={false}
          legendTelem="58 bpm now"
          legendBase="Baseline 52"
        />
        <TelemetryChart
          title="Cabin CO₂ (confounder)"
          series={co2.series}
          showBand={false}
          color="#7DA7B0"
          legendTelem="Night peaks → sleep / HRV coupling"
          legendBase=""
        />
      </div>

      <SensorStatus />
    </>
  );
}
