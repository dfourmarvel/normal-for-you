// Shared data shapes for the whole team (spec section 4).
// Ask in the group before changing this file; one person makes the change.

export type Indicator =
  | "restingHR" | "sbp" | "dbp" | "spo2" | "tempC" | "glucose" | "bodyMass"
  | "sleepHours" | "fatigueSP" | "moodPHQ2" | "pvtLapses" | "hrvRMSSD"
  | "lymphAbs" | "neutAbs" | "wbc" | "hb" | "plt"
  | "co2" | "radDose";

export type Phase =
  | "preflight" | "first72h" | "cruise" | "preEVA" | "preLanding" | "surface" | "postflight";

export type Status = "nominal" | "watch" | "act" | "notMeasured";

export type Region = "heart" | "brainSleepMood" | "bonesMuscles" | "eyes" | "bloodImmune" | "environment";

export type Astronaut = {
  id: string;
  name: string;            // made-up names only; never a real mission or crew
  simulated: boolean;      // true → every screen shows "simulated astronaut"
};

export type Reading = {
  id: string;
  astronautId: string;
  indicator: Indicator;
  value: number;
  unit: string;
  takenAt: string;         // ISO date-time
  missionDay: number;      // 0 = launch; negative = pre-flight (L-92 → -92)
  phase: Phase;
  source: "checkin" | "sensor" | "analyser" | "osd569" | "simulated";
};

export type Answer = {
  question: "people" | "you" | "today";
  status: Status;
  value: number;
  compareTo: string;       // e.g. "lab range 850–3,900 /µL" or "your band 1,980–2,510"
  changePct?: number;      // vs personal baseline
  rcvPct?: number;         // the RCV used
  source: string;          // citation shown under the answer
};

export type ActionCard = {
  kind: "none" | "watchDrift" | "actLimit" | "expected" | "notMeasured" | "combinedDrift";
  saw: string;             // one line, with the numbers
  why: string;             // one line
  source: string;
  doNow: string;
  recheckWhen: string;
  callGroundWhen?: string;
};

export type Verdict = {
  reading: Reading;
  answers: [Answer, Answer, Answer];
  overall: Status;
  action: ActionCard;
};

export type RegionStatus = { region: Region; status: Status; reasons: string[] };

export type BuddyCheck = {
  fromId: string;
  aboutId: string;
  weekOf: string;          // ISO date of the Monday
  mood: 0 | 1 | 2 | 3;     // 0 = no concern … 3 = serious concern
  sleep: 0 | 1 | 2 | 3;
  confusion: 0 | 1 | 2 | 3;
  conflict: 0 | 1 | 2 | 3;
  note?: string;
};

// Scheduler contract. The environment module supplies shelter slots as BlockedSlot.
export type Machine = "treadmill" | "bike";

export type BlockedSlot = {
  crewId: string | "all";
  day: number;             // 0–6
  slot: number;            // 0–15, the 16 waking hours
  reason: "task" | "sleep" | "shelter";
};

export type Assignment = { crewId: string; day: number; slot: number; machine: Machine };

export type SolverResult = {
  solver: "simple" | "sa" | "sb";
  assignments: Assignment[];
  penalty: number;
  hardBreaks: number;      // must be 0 to ship
  ms: number;
};

// Ransford's screen types (mock-data shapes for his screens), kept in their own file.
export * from "./screen-types";
