import { notFound } from "next/navigation";
import { BodyMap3D } from "@/components/biological/BodyMap3D";
import { CountermeasureCard } from "@/components/crew/CountermeasureCard";
import { CrewProfile } from "@/components/crew/CrewProfile";
import { GuidanceTimeline } from "@/components/crew/GuidanceTimeline";
import { DocLink } from "@/components/shared/DocLink";
import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import { VitalCard } from "@/components/telemetry/VitalCard";
import { getCrewById, getGuidance, getMission } from "@/lib/data";

const VITAL_ORDER = ["hr_rest", "hrv_rmssd", "sleep_efficiency", "spo2", "temp_c", "bp_sys"];

export default async function CrewDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = getCrewById(id);
  if (!member) notFound();
  const mission = getMission();
  const guidance = getGuidance(id);
  const finding = member.active_finding;
  const lastUpdate = finding?.last_update
    ? new Date(finding.last_update).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
        timeZone: "UTC",
      })
    : "—";

  return (
    <>
      <CrewProfile member={member} mission={mission} />

      <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)_320px]">
        {/* LEFT */}
        <div className="space-y-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
              Health indicators vs baseline
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {VITAL_ORDER.map((key) =>
                member.vitals[key] ? (
                  <VitalCard key={key} vitalKey={key} vital={member.vitals[key]} />
                ) : null
              )}
            </div>
          </div>

          <Card id="guidance">
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
              Guidance / response plan
            </div>
            <p className="text-sm text-secondary mb-3">Constraint-aware schedule for today (simulated)</p>
            <GuidanceTimeline plan={guidance.plan} />
          </Card>
        </div>

        {/* CENTER */}
        <BodyMap3D
          activeLabel={
            finding?.code?.startsWith("MSK")
              ? "MSK legs"
              : finding?.region?.split("—")[0]?.trim() || "Overview"
          }
        />

        {/* RIGHT */}
        <div className="space-y-4">
          <Card>
            <div className="flex items-start justify-between gap-2">
              <div className="font-semibold text-[15px]">
                {finding?.region?.split("—")[0]?.trim() || "No active finding"}
              </div>
              <div className="text-[11px] font-medium text-teal-dark uppercase tracking-wide whitespace-nowrap">
                Last update · {lastUpdate}
              </div>
            </div>
            {finding ? (
              <>
                <div className="text-primary font-bold text-lg mt-2 tracking-wide">{finding.code}</div>
                <p className="text-sm text-secondary mt-2 leading-relaxed">
                  {finding.summary} Interpretable assessment — not a clinical diagnosis.
                </p>
                <div className="flex flex-wrap gap-2 mt-3">
                  <Tag tone="coral">Severity: {finding.severity}</Tag>
                  <Tag tone="teal">Coupled stress</Tag>
                  <Tag>Hazard: altered gravity</Tag>
                </div>
              </>
            ) : (
              <p className="text-sm text-secondary mt-2">No active finding for this crew member. Telemetry within personal baseline band.</p>
            )}
          </Card>

          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-2">
              Recommended countermeasures
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {guidance.countermeasures.map((cm) => (
                <CountermeasureCard key={cm.id} item={cm} />
              ))}
            </div>
          </div>

          <Card tight>
            <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">
              Additional information
            </div>
            <div>
              {guidance.documents.map((d) => (
                <DocLink key={d.title} doc={d} />
              ))}
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
