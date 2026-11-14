import type { Vital } from "@/lib/types";

const ICONS: Record<string, string> = {
  hr_rest: "♥",
  hrv_rmssd: "⚠",
  sleep_efficiency: "💤",
  spo2: "O₂",
  temp_c: "°C",
  bp_sys: "BP",
};

const LABELS: Record<string, string> = {
  hr_rest: "Resting HR",
  hrv_rmssd: "HRV (RMSSD)",
  sleep_efficiency: "Sleep efficiency",
  spo2: "SpO₂",
  temp_c: "Core proxy",
  bp_sys: "Systolic",
};

export function VitalCard({
  vitalKey,
  vital,
}: {
  vitalKey: string;
  vital: Vital;
}) {
  const attention = vital.status === "attention";
  const delta =
    Math.abs(vital.delta_pct) < 1
      ? "nominal"
      : `${vital.delta_pct > 0 ? "+" : ""}${vital.delta_pct}%`;

  return (
    <div
      className={`rounded-[16px] border p-3.5 ${
        attention
          ? "bg-teal-soft border-teal/40"
          : "bg-white border-border shadow-card"
      }`}
    >
      <div className={`text-base mb-1 ${attention ? "text-teal-dark" : "text-secondary"}`}>
        {ICONS[vitalKey] || "•"}
      </div>
      <div className={`text-[11px] font-medium uppercase tracking-wide mb-1 ${attention ? "text-teal-dark" : "text-secondary"}`}>
        {LABELS[vitalKey] || vitalKey}
      </div>
      <div className={`text-[22px] font-bold leading-none ${attention ? "text-teal-dark" : "text-charcoal"}`}>
        {vital.value}
        <span className="text-xs font-medium ml-1 opacity-70">{vital.unit}</span>
      </div>
      <div className={`text-[11px] mt-1.5 ${attention ? "text-teal-dark" : "text-muted"}`}>
        {attention ? (
          <>
            Baseline {vital.baseline} · <span className="font-semibold">−{Math.abs(vital.delta_pct)}% · needs attention</span>
          </>
        ) : Math.abs(vital.delta_pct) < 1 ? (
          "Within band"
        ) : (
          <>
            Baseline {vital.baseline} ·{" "}
            <span className={vital.delta_pct > 5 || vital.delta_pct < -5 ? "text-warning font-medium" : ""}>
              {delta}
              {vital.status === "nominal" && Math.abs(vital.delta_pct) < 5 ? " · nominal" : ""}
            </span>
          </>
        )}
      </div>
    </div>
  );
}
