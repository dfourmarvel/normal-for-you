/** Header clock for BioTensor Q-Health. Wall time in UTC only — not telemetry. */

export const MISSION_TIME_ZONE = "UTC";

/** Widest date/time string the header reserves (two-digit day, tabular numerals). */
export const MISSION_CLOCK_WIDTH_SAMPLE = "NOV 30, 23:59:59";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"] as const;

export type MissionClockParts = {
  dateTime: string;
  zone: typeof MISSION_TIME_ZONE;
  text: string;
  iso: string;
};

export type TimerId = number;

export type LiveClockEnv = {
  now: () => number;
  setTimer: (callback: () => void, delayMs: number) => TimerId;
  clearTimer: (id: TimerId) => void;
  /** Visibility, window focus, and pageshow. Caller decides which events count as a wake. */
  subscribeWake: (listener: () => void) => () => void;
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function formatMissionClock(date: Date): MissionClockParts {
  const dateTime = `${MONTHS[date.getUTCMonth()]} ${pad(date.getUTCDate())}, ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
  return {
    dateTime,
    zone: MISSION_TIME_ZONE,
    text: `${dateTime} ${MISSION_TIME_ZONE}`,
    iso: date.toISOString(),
  };
}

/** Milliseconds until the next UTC second boundary. Never zero, so the timer cannot spin. */
export function nextSecondDelay(nowMs: number): number {
  const remainder = nowMs % 1000;
  return remainder === 0 ? 1000 : 1000 - remainder;
}

export function startLiveClock(env: LiveClockEnv, onChange: (now: Date) => void): () => void {
  let timer: TimerId | null = null;
  let stopped = false;

  const publish = () => {
    onChange(new Date(env.now()));
  };

  const arm = () => {
    if (timer !== null) {
      env.clearTimer(timer);
      timer = null;
    }
    timer = env.setTimer(() => {
      timer = null;
      if (stopped) return;
      publish();
      arm();
    }, nextSecondDelay(env.now()));
  };

  publish();
  arm();

  const unsubscribe = env.subscribeWake(() => {
    if (stopped) return;
    publish();
    arm();
  });

  return () => {
    stopped = true;
    if (timer !== null) {
      env.clearTimer(timer);
      timer = null;
    }
    unsubscribe();
  };
}

export type MissionClockStore = {
  subscribe: (listener: () => void) => () => void;
  getSnapshot: () => MissionClockParts | null;
};

/** One shared clock for every header surface. The timer stops when the last subscriber leaves. */
export function createMissionClockStore(env: LiveClockEnv): MissionClockStore {
  let current: MissionClockParts | null = null;
  let stop: (() => void) | null = null;
  const listeners = new Set<() => void>();

  const emit = () => {
    for (const listener of [...listeners]) listener();
  };

  return {
    subscribe(listener) {
      listeners.add(listener);
      if (!stop) {
        stop = startLiveClock(env, (instant) => {
          current = formatMissionClock(instant);
          emit();
        });
      }
      return () => {
        listeners.delete(listener);
        if (listeners.size === 0 && stop) {
          stop();
          stop = null;
          current = null;
        }
      };
    },
    getSnapshot() {
      return current;
    },
  };
}
