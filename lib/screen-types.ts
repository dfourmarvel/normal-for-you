// Ransford's screen types: the shapes of public/mock/*.json as his screens read them.
// Kept apart from the shared contract in types.ts, which re-exports them.

export type RoleId = "astronaut" | "medical" | "ops";

export type VitalStatus = "nominal" | "watch" | "attention";

export type Vital = {
  value: number;
  unit: string;
  baseline: number;
  delta_pct: number;
  status: VitalStatus;
};

export type ActiveFinding = {
  region: string;
  code: string;
  title: string;
  severity: string;
  last_update: string;     // ISO date-time
  summary: string;
};

export type Hotspot = {
  id: string;
  label: string;
  x: number;
  y: number;
  color: string;
  status: VitalStatus;
  active?: boolean;
};

export type CrewMember = {
  id: string;
  name: string;
  callsign: string;
  role: string;
  nationality: string;
  age: number;
  avatar_color: string;
  initials: string;
  status: VitalStatus;
  active_finding: ActiveFinding | null;
  vitals: Record<string, Vital>;   // hr_rest, hrv_rmssd, spo2, sleep_efficiency, temp_c, bp_sys
  hotspots?: Hotspot[];
};

export type Mission = {
  id: string;
  name: string;
  vehicle: string;
  elapsed_days: number;
  remaining_days: number;
  environment: {
    radiation_uGy_day: number;
    radiation_status: string;
    gravity: string;
    isolation_index: number;
    cabin_co2_ppm: number;
    cabin_humidity_pct: number;
    water_recycle_pct: number;
  };
  data_quality: {
    telemetry_coverage_pct: number;
    baseline_freshness_days: number;
    sensor_offline: number;
  };
};

export type GuidancePlanItem = {
  time: string;            // "HH:MM"
  title: string;
  detail: string;
  actor: { name: string; initials: string };
  type: string;
};

export type Countermeasure = {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  category: string;
};

export type DocumentLink = {
  title: string;
  type: string;            // "PDF" | "CSV" | "JSON" in the mock data
  size: string;
  updated: string;
};

export type Guidance = {
  crew_id: string;
  plan: GuidancePlanItem[];
  countermeasures: Countermeasure[];
  documents: DocumentLink[];
  simulated?: boolean;
};

export type Solver = {
  id: string;
  name: string;
  family: string;
  disclaimer: string;
  runtime_ms: number;
  objective_value: number;
  feasibility: number;
  iterations: number;
  energy_trace_end: number;
  winner: boolean;
};

export type Optimization = {
  problem: {
    name: string;
    description: string;
    variables: number;
    constraints: number;
    objective: string;
  };
  solvers: Solver[];
  comparison: {
    objective_improvement_pct: number;
    speedup: number;
    same_feasibility: boolean;
    notes: string;
  };
  recommendation_summary: string[];
  simulated?: boolean;
};

export type ScenarioPhase = {
  label: string;
  window: string;
  notes: string;
  metrics: Record<string, number | string>;
};

export type Scenario = {
  id: string;
  title: string;
  type: string;
  status: string;          // "tabletop" | "active-watch" in the mock data
  severity: string;
  started: string;         // ISO date-time
  summary: string;
  phases: Record<"before" | "during" | "after", ScenarioPhase>;
};

export type TelemetryPoint = { t: string; v: number };

export type TelemetryResponse = {
  crew_id: string;
  metric: string;
  unit: string;
  simulated?: boolean;
  baseline_mean: number;
  baseline_band: [number, number];
  series: TelemetryPoint[];
  interactions: { source: string; target: string; weight: number }[];
  state_distribution: {
    bins: string[];
    values: number[];
    active: string;
    entropy_index: number;
    entropy_label: string;
    experimental: boolean;
  };
};
