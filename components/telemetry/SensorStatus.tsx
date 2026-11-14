import { Card } from "@/components/shared/Card";
import { StatusPill } from "@/components/shared/StatusPill";

const ROWS = [
  { sensor: "Chest HR / HRV", crew: "Reyes", last: "2 min ago", quality: "98%", status: "Online", tone: "nominal" },
  { sensor: "Sleep actigraphy", crew: "Reyes", last: "Last night", quality: "94%", status: "Online", tone: "nominal" },
  { sensor: "Skin temperature", crew: "Park", last: "6 h ago", quality: "—", status: "Offline", tone: "offline" },
  { sensor: "Cabin CO₂", crew: "Vehicle", last: "1 min ago", quality: "99%", status: "Online", tone: "nominal" },
  { sensor: "Dosimeter", crew: "Vehicle", last: "5 min ago", quality: "97%", status: "Elevated flux", tone: "watch" },
];

export function SensorStatus() {
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-3">Sensor status</div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-border">
              <th className="py-2 pr-3 font-medium">Sensor</th>
              <th className="py-2 pr-3 font-medium">Crew</th>
              <th className="py-2 pr-3 font-medium">Last sample</th>
              <th className="py-2 pr-3 font-medium">Quality</th>
              <th className="py-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.sensor} className="border-b border-border-soft last:border-0">
                <td className="py-3 pr-3 font-medium">{r.sensor}</td>
                <td className="py-3 pr-3 text-secondary">{r.crew}</td>
                <td className="py-3 pr-3 text-secondary">{r.last}</td>
                <td className="py-3 pr-3">{r.quality}</td>
                <td className="py-3">
                  <StatusPill status={r.tone}>{r.status}</StatusPill>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
