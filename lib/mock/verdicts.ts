// Dev fixtures so screens can be built before the engine lands.
// Shape only: these numbers are NOT computed. No shipped screen imports this file once lib/engine exists.
import type { Astronaut, RegionStatus, Verdict } from "@/lib/types";

export const mockCrew: Astronaut[] = [
  { id: "A", name: "Test astronaut A", simulated: true },
  { id: "B", name: "Test astronaut B", simulated: true },
  { id: "C", name: "Test astronaut C", simulated: true },
];

const base = { astronautId: "C", takenAt: "2030-03-01T07:30:00Z", missionDay: 180, phase: "preLanding" as const, source: "simulated" as const };

export const mockVerdicts: Verdict[] = [
  {
    reading: { ...base, id: "m1", indicator: "restingHR", value: 74, unit: "bpm" },
    answers: [
      { question: "people", status: "nominal", value: 74, compareTo: "NEWS2 band 51–90 bpm", source: "MOCK" },
      { question: "you", status: "watch", value: 74, compareTo: "your band 55–66 bpm", changePct: 21, rcvPct: 18, source: "MOCK" },
      { question: "today", status: "watch", value: 74, compareTo: "no rise expected before landing", source: "MOCK" },
    ],
    overall: "watch",
    action: {
      kind: "watchDrift",
      saw: "Resting HR 74 bpm: inside the normal range, but 21% above your own normal.",
      why: "A real change for you is more than 18%.",
      source: "MOCK",
      doNow: "Re-check tomorrow morning, seated, after 5 minutes still.",
      recheckWhen: "tomorrow 07:30",
      callGroundWhen: "if it rises again",
    },
  },
  {
    reading: { ...base, id: "m2", indicator: "spo2", value: 97, unit: "%" },
    answers: [
      { question: "people", status: "nominal", value: 97, compareTo: "≥96%", source: "MOCK" },
      { question: "you", status: "nominal", value: 97, compareTo: "your band 96–99%", changePct: -1, rcvPct: 3, source: "MOCK" },
      { question: "today", status: "nominal", value: 97, compareTo: "no change expected", source: "MOCK" },
    ],
    overall: "nominal",
    action: { kind: "none", saw: "", why: "", source: "", doNow: "", recheckWhen: "next check-in" },
  },
  {
    reading: { ...base, id: "m3", indicator: "glucose", value: NaN, unit: "mg/dL" },
    answers: [
      { question: "people", status: "notMeasured", value: NaN, compareTo: "<100 mg/dL fasting", source: "MOCK" },
      { question: "you", status: "notMeasured", value: NaN, compareTo: "no recent reading", source: "MOCK" },
      { question: "today", status: "notMeasured", value: NaN, compareTo: "no recent reading", source: "MOCK" },
    ],
    overall: "notMeasured",
    action: {
      kind: "notMeasured",
      saw: "No glucose reading for 9 days.",
      why: "This counts as unknown, not normal.",
      source: "MOCK",
      doNow: "Measure fasting glucose tomorrow before breakfast.",
      recheckWhen: "tomorrow",
    },
  },
];

export const mockRegions: RegionStatus[] = [
  { region: "heart", status: "watch", reasons: ["Resting HR above your band"] },
  { region: "brainSleepMood", status: "watch", reasons: ["Combined drift: sleep, fatigue, mood"] },
  { region: "bonesMuscles", status: "nominal", reasons: [] },
  { region: "eyes", status: "notMeasured", reasons: ["No vision check this week"] },
  { region: "bloodImmune", status: "notMeasured", reasons: ["Glucose not measured for 9 days"] },
  { region: "environment", status: "nominal", reasons: [] },
];
