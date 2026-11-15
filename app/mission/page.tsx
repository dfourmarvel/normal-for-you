import Link from "next/link";
import { CrewCard } from "@/components/crew/CrewCard";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { runWeek } from "@/components/optimization/realSchedule";
import { getCrew, getMission } from "@/lib/data";

export default function MissionPage() {
  const mission = getMission();
  const crew = getCrew();
  const week = runWeek(false); // real scheduler, run once when the page is built (fixed seed, so it repeats)
  const watches = crew.filter((c) => c.status === "watch").length;
  const attentions = crew.filter((c) => c.status === "attention").length;
  const env = mission.environment;
  const dq = mission.data_quality;

  return (
    <>
      <PageHeader
        title="Mission overview"
        subtitle={`ISS ${mission.name} · Day ${mission.elapsed_days} of ${
          mission.elapsed_days + mission.remaining_days
        } · Mission Health Operations view`}
        actions={
          <>
            <StatusPill status="watch">
              {watches} watch · {attentions || 1} attention
            </StatusPill>
            <Button href="/scenarios/spe-2026-11">Open SPE scenario</Button>
          </>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <MetricCard label="Radiation" value="214" unit="µGy/day · elevated" width={68} />
        <MetricCard label="Gravity" value="µ-g" unit="Altered gravity hazard" width={100} teal />
        <MetricCard label="Isolation index" value={String(env.isolation_index)} unit="Closed environment" width={72} />
        <MetricCard label="Cabin CO₂" value={String(env.cabin_co2_ppm)} unit="ppm · night peak watch" width={62} />
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-5">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">Crew status</div>
          <div className="grid sm:grid-cols-2 gap-4">
            {crew.map((m) => (
              <CrewCard key={m.id} member={m} />
            ))}
          </div>
        </div>
        <div className="space-y-4">
          <Card>
            <div className="font-semibold text-[15px] mb-3">Data quality</div>
            <Row label="Telemetry coverage" value={`${dq.telemetry_coverage_pct}%`} />
            <Row label="Baseline freshness" value={`${dq.baseline_freshness_days} days`} />
            <Row label="Sensors offline" value={`${dq.sensor_offline} (Park skin-temp)`} />
            <Row label="Water recycle" value={`${env.water_recycle_pct}%`} />
            <p className="text-sm text-secondary mt-3">
              Closed-loop air/water monitored for confounders on physiological signals. All values simulated.
            </p>
          </Card>
          <Card>
            <div className="font-semibold text-[15px] mb-2">Optimization snapshot</div>
            <p className="text-sm text-secondary mb-3">
              One exercise week, 4 crew, 1 treadmill, 1 bike · penalty, lower is better
            </p>
            <Row label="Simple plan" value={week.simple.penalty.toFixed(2)} />
            <Row label="Simulated annealing" value={week.sa.penalty.toFixed(2)} />
            <Row label="Simulated bifurcation" value="Not built" />
            <Link
              href="/optimization"
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-border bg-white px-4 py-2.5 text-[13px] font-semibold hover:bg-card-muted"
            >
              View full comparison
            </Link>
          </Card>
          <Card>
            <div className="font-semibold text-[15px] mb-2">NASA challenge focus</div>
            <p className="text-sm text-secondary">
              Gather health indicators and help astronauts evaluate and act under radiation, isolation,
              altered gravity, and closed-environment hazards.
            </p>
          </Card>
        </div>
      </div>
    </>
  );
}

function MetricCard({
  label,
  value,
  unit,
  width,
  teal,
}: {
  label: string;
  value: string;
  unit: string;
  width: number;
  teal?: boolean;
}) {
  return (
    <Card tight>
      <div className="text-[11px] uppercase tracking-wide text-muted mb-1">{label}</div>
      <div className="text-[26px] font-bold leading-none text-charcoal">{value}</div>
      <div className="text-xs text-secondary mt-1 mb-3">{unit}</div>
      <div className="h-1.5 rounded-full bg-border-soft overflow-hidden">
        <div className={`h-full rounded-full ${teal ? "bg-teal" : "bg-primary"}`} style={{ width: `${width}%` }} />
      </div>
    </Card>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-sm py-1">
      <span className="text-secondary">{label}</span>
      <span className={`font-medium ${accent ? "text-primary" : ""}`}>{value}</span>
    </div>
  );
}
