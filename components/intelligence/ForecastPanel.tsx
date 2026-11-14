import { Card } from "@/components/shared/Card";

export function ForecastPanel() {
  return (
    <div className="grid md:grid-cols-2 gap-4 mb-4">
      <Card>
        <div className="font-semibold text-[15px]">Reyes — coupled stress index</div>
        <div className="text-[11px] text-secondary mb-2">Forecast band ± uncertainty</div>
        <svg className="w-full h-auto" viewBox="0 0 560 160" aria-label="Stress forecast">
          <polygon points="40,90 200,85 360,70 520,55 520,95 360,105 200,115 40,120" fill="#FDF0ED" opacity="0.9" />
          <polyline fill="none" stroke="#EE6D52" strokeWidth="2.5" points="40,100 120,98 200,95 280,88 360,80 440,72 520,65" />
          <line x1="200" y1="20" x2="200" y2="140" stroke="#E8E2DA" strokeDasharray="3 2" />
          <text x="205" y="30" fontSize="10" fill="#6B6560" fontFamily="Inter">
            Now →
          </text>
        </svg>
        <p className="text-sm text-secondary">If ARED + sleep blocks adhered: index projected 0.52 → 0.38 by T+72h.</p>
      </Card>
      <Card>
        <div className="font-semibold text-[15px]">Park — sleep efficiency</div>
        <div className="text-[11px] text-secondary mb-2">With / without protected rest</div>
        <svg className="w-full h-auto" viewBox="0 0 560 160">
          <polyline fill="none" stroke="#7DA7B0" strokeWidth="2" strokeDasharray="4 3" points="40,110 200,108 360,90 520,70" />
          <polyline fill="none" stroke="#EE6D52" strokeWidth="2.5" points="40,110 200,108 360,100 520,95" />
        </svg>
        <div className="flex gap-4 text-[11px] text-secondary mt-1">
          <span>No intervention</span>
          <span>With sleep protection</span>
        </div>
      </Card>
    </div>
  );
}
