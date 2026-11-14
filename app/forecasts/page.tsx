import { ForecastPanel } from "@/components/intelligence/ForecastPanel";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";

export default function ForecastsPage() {
  return (
    <>
      <PageHeader
        title="Forecasts"
        subtitle="72-hour trend forecasts from temporal state estimation · simulated · not event prediction"
      />
      <ForecastPanel />
      <Card>
        <div className="font-semibold text-[15px] mb-3">Forecast table</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-muted border-b border-border">
                <th className="py-2 font-medium">Crew</th>
                <th className="py-2 font-medium">Metric</th>
                <th className="py-2 font-medium">Now</th>
                <th className="py-2 font-medium">T+24h</th>
                <th className="py-2 font-medium">T+72h</th>
                <th className="py-2 font-medium">Confidence</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Reyes", "Stress index", "0.52", "0.45", "0.38", "Medium"],
                ["Reyes", "HRV RMSSD", "32 ms", "34 ms", "37 ms", "Medium"],
                ["Park", "Sleep eff.", "71%", "76%", "83%", "Low–Med"],
                ["Okafor", "Stress index", "0.22", "0.23", "0.24", "High"],
                ["Volkov", "Stress index", "0.25", "0.25", "0.26", "High"],
              ].map((r) => (
                <tr key={r.join("-")} className="border-b border-border-soft last:border-0">
                  {r.map((c) => (
                    <td key={c} className="py-3 pr-3">
                      {c}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-sm text-secondary mt-3">
          Not a proven cardiac-event predictor. Forecasts support human evaluation only.
        </p>
      </Card>
    </>
  );
}
