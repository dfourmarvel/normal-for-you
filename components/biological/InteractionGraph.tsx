import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";

export function InteractionGraph() {
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-2">Interaction network</div>
      <p className="text-sm text-secondary mb-3">
        Edge weight = estimated coupling strength over the last 7 days. Stronger coral links indicate
        interacting stress patterns.
      </p>
      <svg viewBox="0 0 480 320" width="100%" height="300" aria-label="Variable interaction graph">
        <line x1="240" y1="60" x2="120" y2="140" stroke="#EE6D52" strokeWidth="3" opacity="0.7" />
        <line x1="240" y1="60" x2="360" y2="140" stroke="#EE6D52" strokeWidth="2.5" opacity="0.65" />
        <line x1="120" y1="140" x2="180" y2="240" stroke="#EE6D52" strokeWidth="2.5" opacity="0.7" />
        <line x1="360" y1="140" x2="300" y2="240" stroke="#7DA7B0" strokeWidth="1.5" opacity="0.5" />
        <line x1="180" y1="240" x2="300" y2="240" stroke="#EE6D52" strokeWidth="2" opacity="0.55" />
        <line x1="120" y1="140" x2="60" y2="220" stroke="#7DA7B0" strokeWidth="1.5" opacity="0.45" />
        <line x1="360" y1="140" x2="420" y2="220" stroke="#7DA7B0" strokeWidth="1.5" opacity="0.45" />
        <line x1="240" y1="60" x2="240" y2="160" stroke="#7DA7B0" strokeWidth="1.5" opacity="0.45" />
        {[
          { cx: 240, cy: 60, r: 28, label: "Sleep", stroke: "#EE6D52" },
          { cx: 120, cy: 140, r: 26, label: "HRV", stroke: "#EE6D52" },
          { cx: 360, cy: 140, r: 26, label: "CO₂", stroke: "#E8E2DA" },
          { cx: 180, cy: 240, r: 28, label: "MSK", stroke: "#E8C547" },
          { cx: 300, cy: 240, r: 26, label: "HR", stroke: "#E8E2DA" },
          { cx: 60, cy: 220, r: 22, label: "Rad", stroke: "#E8E2DA" },
          { cx: 420, cy: 220, r: 22, label: "Isol.", stroke: "#E8E2DA" },
          { cx: 240, cy: 160, r: 22, label: "Exer.", stroke: "#E8E2DA" },
        ].map((n) => (
          <g key={n.label}>
            <circle cx={n.cx} cy={n.cy} r={n.r} fill="#fff" stroke={n.stroke} strokeWidth="2" />
            <text x={n.cx} y={n.cy + 4} textAnchor="middle" fontSize="12" fontFamily="Inter" fill="#2C2C2C" fontWeight="600">
              {n.label}
            </text>
          </g>
        ))}
      </svg>
      <div className="flex flex-wrap gap-2 mt-2">
        <Tag tone="coral">Sleep ↔ HRV 0.82</Tag>
        <Tag tone="coral">Sleep ↔ MSK 0.71</Tag>
        <Tag tone="teal">CO₂ ↔ Sleep 0.66</Tag>
      </div>
    </Card>
  );
}
