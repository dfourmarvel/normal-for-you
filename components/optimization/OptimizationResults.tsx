import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";

export function OptimizationResults({ items }: { items: string[] }) {
  return (
    <Card>
      <div className="font-semibold text-[15px] mb-3">Recommended schedule (from SB)</div>
      <ul className="space-y-2">
        {items.map((t) => (
          <li key={t} className="text-sm text-charcoal">
            • {t}
          </li>
        ))}
      </ul>
      <Button variant="ghost" href="/recommendations" className="mt-4">
        Open recommendations
      </Button>
    </Card>
  );
}
