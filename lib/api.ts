import type {
  CrewMember,
  Guidance,
  Mission,
  Optimization,
  Scenario,
  TelemetryResponse,
} from "./types";

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.json() as Promise<T>;
}

export function fetchMission() {
  return getJson<Mission & { simulated?: boolean }>("/api/mission");
}

export function fetchCrew() {
  return getJson<{ crew: CrewMember[]; simulated?: boolean }>("/api/crew");
}

export function fetchCrewMember(id: string) {
  return getJson<CrewMember & { simulated?: boolean }>(`/api/crew/${id}`);
}

export function fetchGuidance(id: string) {
  return getJson<Guidance>(`/api/crew/${id}/guidance`);
}

export function fetchTelemetry(crewId: string, metric?: string) {
  const q = new URLSearchParams({ crew_id: crewId });
  if (metric) q.set("metric", metric);
  return getJson<TelemetryResponse>(`/api/telemetry?${q}`);
}

export function fetchOptimization() {
  return getJson<Optimization>("/api/optimization");
}

export function fetchScenarios() {
  return getJson<{ scenarios: Scenario[]; simulated?: boolean }>("/api/scenarios");
}

export function fetchScenario(id: string) {
  return getJson<Scenario & { simulated?: boolean }>(`/api/scenarios/${id}`);
}
