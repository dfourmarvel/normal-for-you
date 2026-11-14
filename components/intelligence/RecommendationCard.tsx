import { Card } from "@/components/shared/Card";
import { Tag } from "@/components/shared/Tag";

export function RecommendationCard({
  title,
  priority,
  body,
  tags,
}: {
  title: string;
  priority: "high" | "medium";
  body: string;
  tags: string[];
}) {
  return (
    <Card>
      <div className="flex items-start justify-between gap-3">
        <div className="font-semibold text-[15px]">{title}</div>
        <Tag tone={priority === "high" ? "coral" : "default"}>
          Priority {priority}
        </Tag>
      </div>
      <p className="text-sm text-secondary mt-2">{body}</p>
      <div className="flex flex-wrap gap-2 mt-3">
        {tags.map((t) => (
          <Tag key={t} tone={t === tags[0] ? "teal" : "default"}>
            {t}
          </Tag>
        ))}
      </div>
    </Card>
  );
}
