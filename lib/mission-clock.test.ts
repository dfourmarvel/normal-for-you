import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createMissionClockStore,
  formatMissionClock,
  MISSION_CLOCK_WIDTH_SAMPLE,
  nextSecondDelay,
  startLiveClock,
  type LiveClockEnv,
} from "./mission-clock.ts";

function fakeEnv(startMs: number) {
  let now = startMs;
  let seq = 1;
  const timers = new Map<number, { cb: () => void; due: number }>();
  const wakes = new Set<() => void>();

  const env: LiveClockEnv = {
    now: () => now,
    setTimer(cb, delayMs) {
      const id = seq++;
      timers.set(id, { cb, due: now + delayMs });
      return id;
    },
    clearTimer(id) {
      timers.delete(id);
    },
    subscribeWake(listener) {
      wakes.add(listener);
      return () => {
        wakes.delete(listener);
      };
    },
  };

  return {
    env,
    setNow(ms: number) {
      now = ms;
    },
    advance(ms: number) {
      now += ms;
      this.flush();
    },
    flush() {
      const due = [...timers.entries()]
        .filter(([, timer]) => timer.due <= now)
        .sort((a, b) => a[1].due - b[1].due || a[0] - b[0]);
      for (const [id, timer] of due) {
        if (!timers.has(id)) continue;
        timers.delete(id);
        timer.cb();
      }
    },
    wake() {
      for (const listener of [...wakes]) listener();
    },
    pendingDelays() {
      return [...timers.values()].map((timer) => timer.due - now);
    },
    pendingCount() {
      return timers.size;
    },
  };
}

describe("formatMissionClock", () => {
  it("labels the current UTC time", () => {
    const clock = formatMissionClock(new Date("2026-11-05T14:14:07.000Z"));
    assert.equal(clock.dateTime, "NOV 05, 14:14:07");
    assert.equal(clock.zone, "UTC");
    assert.equal(clock.text, "NOV 05, 14:14:07 UTC");
    assert.equal(clock.iso, "2026-11-05T14:14:07.000Z");
  });

  it("rolls the UTC calendar at midnight and on New Year", () => {
    assert.equal(formatMissionClock(new Date("2026-11-06T23:59:59.000Z")).text, "NOV 06, 23:59:59 UTC");
    assert.equal(formatMissionClock(new Date("2026-11-07T00:00:00.000Z")).text, "NOV 07, 00:00:00 UTC");
    assert.equal(formatMissionClock(new Date("2026-12-31T23:59:59.000Z")).text, "DEC 31, 23:59:59 UTC");
    assert.equal(formatMissionClock(new Date("2027-01-01T00:00:00.000Z")).text, "JAN 01, 00:00:00 UTC");
  });

  it("stays within the reserved header width for every day of the year", () => {
    const start = Date.parse("2026-01-01T00:00:00.000Z");
    for (let day = 0; day < 366; day += 1) {
      for (const hour of [0, 9, 12, 23]) {
        const clock = formatMissionClock(new Date(start + day * 86_400_000 + hour * 3_600_000 + 59 * 60_000 + 59_000));
        assert.equal(clock.dateTime.length, MISSION_CLOCK_WIDTH_SAMPLE.length, clock.text);
        assert.equal(clock.zone, "UTC");
      }
    }
  });
});

describe("nextSecondDelay", () => {
  it("waits until the next whole second", () => {
    assert.equal(nextSecondDelay(1_000), 1000);
    assert.equal(nextSecondDelay(1_001), 999);
    assert.equal(nextSecondDelay(1_999), 1);
  });
});

describe("startLiveClock", () => {
  it("ticks on second boundaries, rolls the date, and clears its timer", () => {
    const env = fakeEnv(Date.parse("2026-11-06T23:59:58.400Z"));
    const seen: string[] = [];
    const stop = startLiveClock(env.env, (instant) => {
      seen.push(formatMissionClock(instant).text);
    });

    assert.deepEqual(seen, ["NOV 06, 23:59:58 UTC"]);
    assert.deepEqual(env.pendingDelays(), [600]);

    env.advance(600);
    assert.equal(seen.at(-1), "NOV 06, 23:59:59 UTC");

    env.advance(1000);
    assert.equal(seen.at(-1), "NOV 07, 00:00:00 UTC");
    assert.equal(env.pendingCount(), 1);

    stop();
    assert.equal(env.pendingCount(), 0);
    const count = seen.length;
    env.advance(5000);
    env.wake();
    assert.equal(seen.length, count);
  });

  it("shows the actual UTC time when a throttled timer fires late", () => {
    const start = Date.parse("2026-11-06T01:02:03.500Z");
    const env = fakeEnv(start);
    const seen: string[] = [];
    startLiveClock(env.env, (instant) => {
      seen.push(formatMissionClock(instant).text);
    });

    env.setNow(start + 10_500);
    env.flush();
    assert.equal(seen.at(-1), "NOV 06, 01:02:14 UTC");
  });

  it("catches up when the document wakes after time has jumped", () => {
    const start = Date.parse("2026-11-06T06:00:00.250Z");
    const env = fakeEnv(start);
    const seen: string[] = [];
    startLiveClock(env.env, (instant) => {
      seen.push(formatMissionClock(instant).text);
    });

    assert.equal(seen[0], "NOV 06, 06:00:00 UTC");
    env.setNow(start + 125_000);
    env.wake();

    assert.equal(seen.at(-1), "NOV 06, 06:02:05 UTC");
    assert.deepEqual(env.pendingDelays(), [nextSecondDelay(start + 125_000)]);
  });

  it("ignores a timer callback that fires after cleanup", () => {
    const env = fakeEnv(Date.parse("2026-11-06T12:00:00.000Z"));
    const callbacks: Array<() => void> = [];
    const originalSet = env.env.setTimer;
    env.env.setTimer = (cb, delay) => {
      callbacks.push(cb);
      return originalSet(cb, delay);
    };

    const seen: number[] = [];
    const stop = startLiveClock(env.env, (instant) => {
      seen.push(instant.getTime());
    });
    const fire = callbacks.at(-1);
    if (!fire) throw new Error("timer was not armed");
    stop();
    fire();
    assert.equal(seen.length, 1);
  });
});

describe("createMissionClockStore", () => {
  it("feeds every subscriber from one timer and stops after the last unsubscribe", () => {
    const env = fakeEnv(Date.parse("2026-11-06T23:59:59.100Z"));
    const store = createMissionClockStore(env.env);
    const desktop: Array<string | null> = [];
    const mobile: Array<string | null> = [];

    const stopDesktop = store.subscribe(() => {
      desktop.push(store.getSnapshot()?.text ?? null);
    });
    assert.equal(store.getSnapshot()?.text, "NOV 06, 23:59:59 UTC");
    assert.deepEqual(desktop, ["NOV 06, 23:59:59 UTC"]);

    const stopMobile = store.subscribe(() => {
      mobile.push(store.getSnapshot()?.text ?? null);
    });
    assert.equal(mobile.length, 0);
    assert.equal(store.getSnapshot()?.text, "NOV 06, 23:59:59 UTC");
    assert.equal(env.pendingCount(), 1);

    env.advance(900);
    assert.equal(store.getSnapshot()?.text, "NOV 07, 00:00:00 UTC");
    assert.equal(desktop.at(-1), "NOV 07, 00:00:00 UTC");
    assert.equal(mobile.at(-1), "NOV 07, 00:00:00 UTC");
    assert.equal(env.pendingCount(), 1);

    stopDesktop();
    assert.equal(env.pendingCount(), 1);
    env.advance(1000);
    assert.equal(store.getSnapshot()?.text, "NOV 07, 00:00:01 UTC");
    assert.equal(mobile.at(-1), "NOV 07, 00:00:01 UTC");

    stopMobile();
    assert.equal(env.pendingCount(), 0);
    assert.equal(store.getSnapshot(), null);
    env.wake();
    env.advance(5000);
    assert.equal(store.getSnapshot(), null);
  });
});
