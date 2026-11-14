import { Button } from "@/components/shared/Button";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusPill } from "@/components/shared/StatusPill";
import { Tag } from "@/components/shared/Tag";
import type { CrewMember, Mission } from "@/lib/types";
import Link from "next/link";

export function CrewProfile({ member, mission }: { member: CrewMember; mission?: Mission }) {
  const focus =
    member.active_finding?.code === "MSK-DECOND-L"
      ? "musculoskeletal deconditioning"
      : member.active_finding?.title?.toLowerCase() || "nominal monitoring";
  return (
    <PageHeader
      title={member.name}
      subtitle={`${member.role} · Day ${mission?.elapsed_days ?? 94} · Personal baselines active · Focus: ${focus}`}
      crumbs={
        <>
          <Link href="/crew" className="text-sm text-secondary hover:text-charcoal">
            ← Crew
          </Link>
          <StatusPill status={member.status}>
            {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
          </StatusPill>
          <Tag tone="teal">ISS Expedition 72 · simulated</Tag>
        </>
      }
      actions={
        <>
          <Button variant="ghost">Export brief</Button>
          <Button variant="primary" href="#guidance">
            Open guidance
          </Button>
        </>
      }
    />
  );
}
