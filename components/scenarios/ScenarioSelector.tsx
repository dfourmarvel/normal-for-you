import Link from "next/link";
import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";
import type { Scenario } from "@/lib/types";

export function ScenarioSelector({ scenarios }: { scenarios: Scenario[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      {scenarios.map((s) => (
        <Link key={s.id} href={`/scenarios/${s.id}`} className="block">
          <Card className="h-full hover:border-primary/30 transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="font-semibold text-[15px]">{s.title}</div>
              <Tag tone={s.severity === "high" ? "coral" : "default"}>
                {s.severity.charAt(0).toUpperCase() + s.severity.slice(1)}
              </Tag>
            </div>
            <p className="text-sm text-secondary mt-2">{s.summary}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              <Tag tone="teal">{s.type.charAt(0).toUpperCase() + s.type.slice(1)}</Tag>
              {s.status === "active-watch" ? (
                <Tag tone="coral">Active watch</Tag>
              ) : (
                <Tag>Tabletop</Tag>
              )}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  );
}
