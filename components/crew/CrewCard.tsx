import Link from "next/link";
import { StatusPill } from "@/components/shared/StatusPill";
import type { CrewMember } from "@/lib/types";

export function CrewCard({ member }: { member: CrewMember }) {
  const hrv = member.vitals.hrv_rmssd;
  const sleep = member.vitals.sleep_efficiency;
  return (
    <Link
      href={`/crew/${member.id}`}
      className="block bg-white rounded-[20px] border border-border shadow-card p-5 hover:border-primary/30 transition-colors"
    >
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-11 h-11 rounded-full text-white font-bold text-sm flex items-center justify-center shrink-0"
          style={{ background: member.avatar_color }}
        >
          {member.initials}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-[15px] text-charcoal truncate">{member.name}</h3>
          <div className="text-xs text-secondary truncate">
            {member.role} · {member.nationality}
            {member.age ? ` · ${member.age}` : ""}
          </div>
        </div>
        <StatusPill status={member.status}>
          {member.status === "attention"
            ? "Attention"
            : member.status.charAt(0).toUpperCase() + member.status.slice(1)}
        </StatusPill>
      </div>
      <div className="space-y-1.5 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-secondary">Finding</span>
          <span className={member.active_finding ? "text-primary font-medium" : "text-charcoal"}>
            {member.active_finding?.code ?? "None"}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-secondary">HRV</span>
          <span className="font-medium">
            {hrv.value} {hrv.unit}
            {hrv.delta_pct <= -10 ? ` (${hrv.delta_pct}%)` : ""}
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-secondary">Sleep</span>
          <span className="font-medium">
            {sleep.value}
            {sleep.unit}
            {sleep.delta_pct <= -10 ? ` (${Math.round(sleep.delta_pct)}%)` : ""}
          </span>
        </div>
      </div>
    </Link>
  );
}
