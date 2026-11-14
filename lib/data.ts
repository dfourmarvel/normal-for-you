import { readFileSync } from "fs";
import path from "path";
import type {
  CrewMember,
  Guidance,
  Mission,
  Optimization,
  Scenario,
  TelemetryResponse,
} from "./types";

const mockDir = path.join(process.cwd(), "public", "mock");

function readJson<T>(name: string): T {
  return JSON.parse(readFileSync(path.join(mockDir, name), "utf8")) as T;
}

type CrewFile = { mission: Mission; crew: CrewMember[] };

export function getCrewFile(): CrewFile {
  return readJson<CrewFile>("crew.json");
}

export function getMission(): Mission & { simulated: true } {
  const { mission } = getCrewFile();
  return { ...mission, simulated: true };
}

export function getCrew(): CrewMember[] {
  return getCrewFile().crew;
}

export function getCrewById(id: string): CrewMember | undefined {
  return getCrew().find((c) => c.id === id);
}

export function getGuidance(crewId?: string): Guidance {
  const g = readJson<Guidance>("guidance.json");
  return { ...g, crew_id: crewId || g.crew_id, simulated: true };
}

export function getOptimization(): Optimization {
  return { ...readJson<Optimization>("optimization.json"), simulated: true };
}

export function getScenarios(): Scenario[] {
  return readJson<{ scenarios: Scenario[] }>("scenarios.json").scenarios;
}

export function getScenarioById(id: string): Scenario | undefined {
  return getScenarios().find((s) => s.id === id);
}

export function getTelemetry(
  crewId = "cm-reyes",
  metric = "hrv_rmssd"
): TelemetryResponse {
  const base = readJson<TelemetryResponse>("telemetry.json");
  return { ...base, crew_id: crewId, metric, simulated: true };
}

/** Extra simulated series for charts when metric differs */
export function getTelemetryForMetric(
  crewId: string,
  metric: string
): TelemetryResponse {
  const base = getTelemetry(crewId, metric);
  if (metric === "hrv_rmssd") return base;

  if (metric === "sleep_efficiency") {
    return {
      ...base,
      metric,
      unit: "%",
      baseline_mean: 88,
      baseline_band: [82, 92],
      series: [
        { t: "D-6", v: 86 },
        { t: "D-5", v: 84 },
        { t: "D-4", v: 82 },
        { t: "D-3", v: 80 },
        { t: "D-2", v: 79 },
        { t: "D-1", v: 77 },
        { t: "D0", v: 78 },
      ],
    };
  }

  if (metric === "hr_rest") {
    return {
      ...base,
      metric,
      unit: "bpm",
      baseline_mean: 52,
      baseline_band: [48, 56],
      series: [
        { t: "D-6", v: 53 },
        { t: "D-5", v: 54 },
        { t: "D-4", v: 55 },
        { t: "D-3", v: 56 },
        { t: "D-2", v: 56 },
        { t: "D-1", v: 57 },
        { t: "D0", v: 58 },
      ],
    };
  }

  if (metric === "cabin_co2") {
    return {
      ...base,
      metric,
      unit: "ppm",
      baseline_mean: 2800,
      baseline_band: [2500, 3000],
      series: [
        { t: "D-6", v: 2900 },
        { t: "D-5", v: 3050 },
        { t: "D-4", v: 2800 },
        { t: "D-3", v: 3200 },
        { t: "D-2", v: 3100 },
        { t: "D-1", v: 3300 },
        { t: "D0", v: 3100 },
      ],
    };
  }

  return base;
}
