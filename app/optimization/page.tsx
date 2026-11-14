import { BenchmarkComparison } from "@/components/optimization/BenchmarkComparison";
import { OptimizationResults } from "@/components/optimization/OptimizationResults";
import { SolverPanel } from "@/components/optimization/SolverPanel";
import { Button } from "@/components/shared/Button";
import { Card } from "@/components/shared/Card";
import { PageHeader } from "@/components/shared/PageHeader";
import { Tag } from "@/components/shared/Tag";
import { getOptimization } from "@/lib/data";

export default function OptimizationPage() {
  const opt = getOptimization();

  return (
    <>
      <PageHeader
        title="Optimization"
        subtitle="Constraint-aware countermeasure scheduling · quantum-inspired Simulated Bifurcation on classical hardware"
        actions={<Button>Re-run solvers</Button>}
      />

      <div
        role="note"
        className="flex items-start gap-3 rounded-[14px] bg-[#F3EEF8] text-[#5A4A6A] px-4 py-3 mb-5 text-[12.5px] leading-relaxed"
      >
        <span aria-hidden>⚛️</span>
        <div>
          <strong>Simulated Bifurcation is quantum-inspired, not a quantum computer.</strong> Both
          solvers below run on classical CPU. Comparison is for research / hackathon demonstration of
          the optimization engine (extra innovation beyond the NASA challenge baseline).
        </div>
      </div>

      <Card className="mb-5">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-1">Problem</div>
        <div className="font-semibold text-[15px]">{opt.problem.name}</div>
        <p className="text-sm text-secondary mt-2 mb-3">{opt.problem.description}</p>
        <div className="flex flex-wrap gap-2">
          <Tag>{opt.problem.variables} variables</Tag>
          <Tag>{opt.problem.constraints} constraints</Tag>
          <Tag tone="teal">Feasibility required = 1.0</Tag>
          <Tag tone="coral">Simulated instance</Tag>
        </div>
      </Card>

      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted mb-3">
        Solver comparison — Simulated Bifurcation vs classical
      </div>
      <div className="mb-5">
        <BenchmarkComparison solvers={opt.solvers} />
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-5">
        <Card>
          <div className="font-semibold text-[15px] mb-3">Comparison summary</div>
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-secondary">Objective improvement (SB)</span>
              <span className="font-medium text-primary">{opt.comparison.objective_improvement_pct}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Wall-time speedup</span>
              <span className="font-medium">{opt.comparison.speedup}×</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary">Same feasibility</span>
              <span className="font-medium">{opt.comparison.same_feasibility ? "Yes" : "No"}</span>
            </div>
          </div>
          <p className="text-sm text-secondary mt-4">{opt.comparison.notes}</p>
        </Card>
        <OptimizationResults items={opt.recommendation_summary} />
      </div>

      <SolverPanel />
    </>
  );
}
