import type { Metadata } from "next";
import { HeartRhythmView } from "./HeartRhythmView";

export const metadata: Metadata = {
  title: "Heart rhythm complexity on real data · Normal for you",
  description: "Sample entropy of heartbeat intervals for 40 healthy adults (PhysioNet Fantasia), worked out in the browser.",
};

export default function HeartRhythmPage() {
  return <HeartRhythmView />;
}
