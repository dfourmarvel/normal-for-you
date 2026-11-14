import type { Assignment, BlockedSlot } from "@/lib/types";
import { DAYS, weekGrid } from "./realSchedule";

/** 7-day × crew grid of the plan a solver produced. Scrolls inside its own box on a phone. */
export function OptimizationResults({ assignments, blockedSlots, caption }: {
  assignments: Assignment[];
  blockedSlots: BlockedSlot[];
  caption: string;
}) {
  const rows = weekGrid(assignments, blockedSlots);
  return (
    <div className="overflow-x-auto rounded-[14px] border border-border">
      <table className="w-full min-w-[720px] text-[12px] border-collapse">
        <caption className="sr-only">{caption}</caption>
        <thead>
          <tr className="bg-card-muted text-left">
            <th scope="col" className="p-2 font-semibold">Crew</th>
            {DAYS.map((d) => (
              <th key={d} scope="col" className="p-2 font-semibold">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ crew, cells }) => (
            <tr key={crew.id} className="border-t border-border-soft align-top">
              <th scope="row" className="p-2 text-left font-medium w-[140px]">{crew.name}</th>
              {cells.map((cell, day) => (
                <td key={day} className="p-2 space-y-1">
                  {cell.sessions.map((s) => (
                    <div key={s.time}>{s.time} {s.machine}</div>
                  ))}
                  {cell.recovery && (
                    <div className="rounded bg-teal-soft text-teal-dark px-1">Recovery {cell.recovery}</div>
                  )}
                  {cell.shelter && (
                    <div className="rounded bg-yellow-soft text-[#9A7A20] px-1">Shelter {cell.shelter}</div>
                  )}
                  {!cell.sessions.length && !cell.recovery && !cell.shelter && (
                    <span className="text-muted">Rest</span>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
