import { RealScheduler } from "@/components/optimization/RealScheduler";
import { PageHeader } from "@/components/shared/PageHeader";

export default function OptimizationPage() {
  return (
    <>
      <PageHeader
        title="Optimization"
        subtitle="Crew exercise scheduling for one week · the plans below are worked out in your browser"
      />

      <div
        role="note"
        className="flex items-start gap-3 rounded-[14px] bg-[#F3EEF8] text-[#5A4A6A] px-4 py-3 mb-5 text-[12.5px] leading-relaxed"
      >
        <div>
          <strong>Both solvers run on an ordinary computer: this browser.</strong> The demo also includes a simulated bifurcation method that is not built yet, so it does not show a result.
        </div>
      </div>

      <RealScheduler />
    </>
  );
}

