import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AstronautView } from "@/components/astronaut/AstronautView";
import { CREW_IDS, isCrewId } from "../model";

export const dynamicParams = false;

export function generateStaticParams() {
  return CREW_IDS.map((id) => ({ id }));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  return { title: `Test astronaut ${id} self-check · Normal for you`, description: "Simulated astronaut: made-up person. Screening, not a diagnosis." };
}

export default async function AstronautPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!isCrewId(id)) notFound();
  return <AstronautView id={id} />;
}
