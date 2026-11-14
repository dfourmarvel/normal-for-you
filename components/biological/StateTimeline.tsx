import { Card } from "@/components/shared/Card";

export function StateTimeline() {
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-3">State timeline (7 days)</div>
      <svg viewBox="0 0 900 80" width="100%" height="80" aria-label="State timeline">
        <rect x="10" y="30" width="120" height="20" rx="4" fill="#5BA88A" opacity="0.7" />
        <rect x="130" y="30" width="160" height="20" rx="4" fill="#E8A054" opacity="0.75" />
        <rect x="290" y="30" width="280" height="20" rx="4" fill="#EE6D52" opacity="0.8" />
        <rect x="570" y="30" width="200" height="20" rx="4" fill="#E8A054" opacity="0.75" />
        <rect x="770" y="30" width="120" height="20" rx="4" fill="#7DA7B0" opacity="0.7" />
        <text x="70" y="22" fontSize="10" fill="#6B6560" fontFamily="Inter" textAnchor="middle">
          Stable
        </text>
        <text x="210" y="22" fontSize="10" fill="#6B6560" fontFamily="Inter" textAnchor="middle">
          Mild
        </text>
        <text x="430" y="22" fontSize="10" fill="#6B6560" fontFamily="Inter" textAnchor="middle">
          Coupled stress
        </text>
        <text x="670" y="22" fontSize="10" fill="#6B6560" fontFamily="Inter" textAnchor="middle">
          Mild
        </text>
        <text x="830" y="22" fontSize="10" fill="#6B6560" fontFamily="Inter" textAnchor="middle">
          Watch
        </text>
        <text x="10" y="70" fontSize="10" fill="#9A948C" fontFamily="Inter">
          D−6
        </text>
        <text x="880" y="70" fontSize="10" fill="#9A948C" fontFamily="Inter" textAnchor="end">
          Now
        </text>
      </svg>
    </Card>
  );
}
