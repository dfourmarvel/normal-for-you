import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Prototype preferences · no authentication · no wearable integration"
      />
      <div className="grid md:grid-cols-2 gap-4">
        <Card>
          <div className="font-semibold text-[15px] mb-3">Role & display</div>
          <SettingRow title="Default role" sub="Mission Health Ops" trailing="Switcher in header" />
          <SettingRow title="Show experimental badges" sub="Entropy & BEI panels" on />
          <SettingRow title="Persistent disclaimer" sub="Always visible" on />
          <SettingRow title="Simulated-data tags" on />
        </Card>
        <Card>
          <div className="font-semibold text-[15px] mb-3">Data source</div>
          <SettingRow title="API base" sub="/api or static JSON" trailing="mock" />
          <SettingRow title="Mission profile" sub="ISS-EXP-72 simulated" trailing="locked" />
          <SettingRow title="Wearable ingest" sub="Out of scope for hackathon FE" trailing="disabled" />
          <SettingRow title="Auth" sub="Not required" trailing="off" />
        </Card>
      </div>
      <div className="mt-5 flex gap-2">
        <Button variant="ghost" href="/mission">
          ← Back to overview
        </Button>
        <Button variant="ghost" href="/crew/cm-reyes">
          Crew detail (hero)
        </Button>
      </div>
    </>
  );
}

function SettingRow({
  title,
  sub,
  trailing,
  on,
}: {
  title: string;
  sub?: string;
  trailing?: string;
  on?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b border-border-soft last:border-0">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        {sub && <div className="text-xs text-secondary">{sub}</div>}
      </div>
      {on != null ? (
        <div role="switch" aria-checked={on} className={`w-10 h-6 rounded-full relative shrink-0 ${on ? "bg-primary" : "bg-border"}`}>
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow ${on ? "left-4" : "left-0.5"}`} />
        </div>
      ) : (
        <span className="text-sm text-secondary">{trailing}</span>
      )}
    </div>
  );
}
