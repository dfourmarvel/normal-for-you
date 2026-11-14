"use client";

import { StatusPill } from "@/components/shared/StatusPill";
import type { TelemetryPoint } from "@/lib/types";

export function TelemetryChart({
  title,
  meta,
  series,
  baselineMean,
  baselineBand,
  badge,
  badgeStatus = "attention",
  legendTelem = "Telemetry (simulated)",
  legendBase = "Personal baseline band",
  color = "#EE6D52",
  showBand = true,
}: {
  title: string;
  meta?: string;
  series: TelemetryPoint[];
  baselineMean?: number;
  baselineBand?: [number, number];
  badge?: string;
  badgeStatus?: string;
  legendTelem?: string;
  legendBase?: string;
  color?: string;
  showBand?: boolean;
}) {
  const w = 560;
  const h = 180;
  const padL = 40;
  const padR = 20;
  const padT = 20;
  const padB = 30;
  const vals = series.map((s) => s.v);
  const minV = Math.min(...vals, ...(baselineBand || []), (baselineMean ?? vals[0]) - 5);
  const maxV = Math.max(...vals, ...(baselineBand || []), (baselineMean ?? vals[0]) + 5);
  const span = maxV - minV || 1;

  const xAt = (i: number) => padL + (i / Math.max(series.length - 1, 1)) * (w - padL - padR);
  const yAt = (v: number) => padT + (1 - (v - minV) / span) * (h - padT - padB);

  const points = series.map((s, i) => `${xAt(i)},${yAt(s.v)}`).join(" ");
  const bandTop = baselineBand ? yAt(baselineBand[1]) : 0;
  const bandBot = baselineBand ? yAt(baselineBand[0]) : 0;

  return (
    <div className="bg-white rounded-[20px] border border-border shadow-card p-5">
      <div className="flex items-start justify-between gap-3 mb-2">
        <div>
          <div className="font-semibold text-[15px] text-charcoal">{title}</div>
          {meta && <div className="text-[11px] text-secondary mt-0.5">{meta}</div>}
        </div>
        {badge && <StatusPill status={badgeStatus}>{badge}</StatusPill>}
      </div>
      <svg className="w-full h-auto" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-label={`${title} chart`}>
        {showBand && baselineBand && (
          <rect x={padL} y={bandTop} width={w - padL - padR} height={Math.max(bandBot - bandTop, 4)} fill="#E8F1F3" opacity="0.85" />
        )}
        {baselineMean != null && (
          <line
            x1={padL}
            y1={yAt(baselineMean)}
            x2={w - padR}
            y2={yAt(baselineMean)}
            stroke="#7DA7B0"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        )}
        <polyline fill="none" stroke={color} strokeWidth="2.5" strokeLinejoin="round" points={points} />
        <text x={padL} y={h - 8} fontSize="10" fill="#9A948C" fontFamily="Inter">
          {series[0]?.t?.split(" ")[0] || "D−6"}
        </text>
        <text x={w / 2} y={h - 8} fontSize="10" fill="#9A948C" fontFamily="Inter" textAnchor="middle">
          mid
        </text>
        <text x={w - padR} y={h - 8} fontSize="10" fill="#9A948C" fontFamily="Inter" textAnchor="end">
          {series[series.length - 1]?.t?.split(" ")[0] || "D0"}
        </text>
      </svg>
      <div className="flex gap-4 text-[11px] text-secondary mt-1">
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-0.5 inline-block" style={{ background: color }} />
          {legendTelem}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <i className="w-3 h-0.5 inline-block bg-teal border-t border-dashed" />
          {legendBase}
        </span>
      </div>
    </div>
  );
}
