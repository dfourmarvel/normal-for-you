import type { Metadata } from "next";
import { ProofView } from "./ProofView";

export const metadata: Metadata = {
  title: "Proof on real data · Normal for you",
  description: "Inspiration4 blood counts (NASA OSDR OSD-569): results a lab calls normal can still be a real change for that person.",
};

export default function ProofPage() {
  return <ProofView />;
}
