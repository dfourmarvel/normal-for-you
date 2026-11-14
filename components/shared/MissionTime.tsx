"use client";

import { useSyncExternalStore } from "react";
import {
  createMissionClockStore,
  MISSION_CLOCK_WIDTH_SAMPLE,
  type LiveClockEnv,
  type MissionClockParts,
} from "@/lib/mission-clock";

function subscribeWake(listener: () => void) {
  const onVisible = () => {
    if (document.visibilityState === "visible") listener();
  };
  document.addEventListener("visibilitychange", onVisible);
  window.addEventListener("focus", listener);
  window.addEventListener("pageshow", listener);
  return () => {
    document.removeEventListener("visibilitychange", onVisible);
    window.removeEventListener("focus", listener);
    window.removeEventListener("pageshow", listener);
  };
}

function browserClockEnv(): LiveClockEnv {
  return {
    now: () => Date.now(),
    setTimer: (callback, delayMs) => window.setTimeout(callback, delayMs) as unknown as number,
    clearTimer: (id) => window.clearTimeout(id),
    subscribeWake,
  };
}

const clockStore = createMissionClockStore(browserClockEnv());

function serverClock(): MissionClockParts | null {
  return null;
}

export function MissionTime() {
  const clock = useSyncExternalStore(clockStore.subscribe, clockStore.getSnapshot, serverClock);

  return (
    <time
      dateTime={clock?.iso}
      translate="no"
      data-testid="mission-clock"
      title="Current time in Coordinated Universal Time"
      className="inline-flex items-baseline gap-1 text-xs font-medium text-secondary tabular-nums whitespace-nowrap"
    >
      <span className="inline-grid">
        <span className="invisible col-start-1 row-start-1" aria-hidden>
          {MISSION_CLOCK_WIDTH_SAMPLE}
        </span>
        <span className="col-start-1 row-start-1">
          {clock ? (
            clock.dateTime
          ) : (
            <span className="sr-only">Loading current Coordinated Universal Time</span>
          )}
        </span>
      </span>
      <abbr title="Coordinated Universal Time" className="text-[10px] font-semibold tracking-[0.06em] text-teal-dark no-underline">
        UTC
      </abbr>
    </time>
  );
}
