import Link from "next/link";
import { Card } from "@/components/shared/Card";

// The simulated crew have no beat-to-beat heart data, so this panel never shows a number.
export function EntropyPanel() {
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-[11px] font-medium uppercase tracking-wide text-secondary">Heart rhythm predictability</h2>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-border-soft px-2.5 py-1 text-xs font-semibold text-chip-none">
          <svg aria-hidden="true" viewBox="0 0 16 16" className="h-3.5 w-3.5">
            <path d="M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Not measured
        </span>
      </div>
      <p className="mt-3 text-sm">
        How predictable the gaps between heartbeats are (sample entropy). A lower number means a more regular rhythm.
      </p>
      <p className="mt-2 text-sm text-secondary">
        Not measured for this simulated crew member: it needs a beat-to-beat recording, such as a chest-strap heart monitor.
      </p>
      <Link
        href="/proof/heart-rhythm"
        className="mt-3 inline-flex min-h-11 items-center text-sm font-medium text-charcoal underline underline-offset-2 hover:text-chip-act"
      >
        See it on real heart recordings
      </Link>
    </Card>
  );
}
