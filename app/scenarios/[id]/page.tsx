import Link from "next/link";
import { notFound } from "next/navigation";
import { ScenarioTimeline } from "@/components/scenarios/ScenarioTimeline";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tag } from "@/components/shared/Tag";
import { getScenarioById } from "@/lib/data";

export default async function ScenarioDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const scenario = getScenarioById(id);
  if (!scenario) notFound();

  return (
    <>
      <PageHeader
        title={scenario.title}
        subtitle={`${scenario.summary.slice(0, 80)}… · simulated`}
        crumbs={
          <>
            <Link href="/scenarios" className="text-sm text-secondary">
              ← Scenarios
            </Link>
            <Tag tone="coral">{scenario.type.charAt(0).toUpperCase() + scenario.type.slice(1)}</Tag>
            <Tag>{scenario.status === "tabletop" ? "Tabletop" : "Active watch"}</Tag>
          </>
        }
        actions={
          <>
            <Button variant="ghost">Export timeline</Button>
            <Button href="/optimization">Optimize response</Button>
          </>
        }
      />

      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">Event timeline</div>
      <ScenarioTimeline scenario={scenario} />

      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="font-semibold text-[15px] mb-3">Controls</div>
          <ToggleRow title="Include MSK constraint (Reyes)" sub="Keep ARED feasible post-shelter" on />
          <ToggleRow title="Force shared shelter window" sub="All crew overlapping 2h" on />
          <ToggleRow title="Defer science for Park" sub="Protect sleep recovery nights" />
        </Card>
        <Card>
          <div className="font-semibold text-[15px] mb-3">Hazard mapping (NASA challenge)</div>
          <Row label="Radiation" value="Primary driver" />
          <Row label="Isolation" value="Secondary (sleep)" />
          <Row label="Altered gravity" value="MSK interaction" />
          <Row label="Closed environment" value="CO₂ confounder" />
        </Card>
      </div>
    </>
  );
}

function ToggleRow({ title, sub, on }: { title: string; sub: string; on?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border-soft last:border-0">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        <div className="text-xs text-secondary">{sub}</div>
      </div>
      <div
        role="switch"
        aria-checked={!!on}
        className={`w-10 h-6 rounded-full relative shrink-0 ${on ? "bg-primary" : "bg-border"}`}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${
            on ? "left-4" : "left-0.5"
          }`}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 text-sm py-1.5">
      <span className="text-secondary">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
