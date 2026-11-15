import { RealScheduler } from "@/components/optimization/RealScheduler";
import { PageHeader } from "@/components/shared/PageHeader";

export default function OptimizationPage() {
  return (
    <>
      <PageHeader title="Optimization" subtitle="Crew exercise scheduling for one week · the plans below are worked out in your browser" />
      <div role="note" className="rounded-[14px] bg-[#F3EEF8] text-[#5A4A6A] px-4 py-3 mb-5 text-[12.5px] leading-relaxed">
        <strong>Both solvers run on an ordinary computer: this browser.</strong> Simulated bifurcation is not built yet and has no result.
      </div>
      <RealScheduler />
    </>
  );
}
