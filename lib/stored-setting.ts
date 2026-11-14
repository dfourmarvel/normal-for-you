import { useSyncExternalStore } from "react";

// A localStorage value read once on the client and then kept in memory. React reads it through
// useSyncExternalStore: the static HTML renders the fallback, the browser swaps in the saved value.
export function storedSetting<T extends string>(key: string, fallback: T, isValid: (v: string) => v is T) {
  let value: T | undefined;
  const listeners = new Set<() => void>();

  function get(): T {
    if (value === undefined) {
      try {
        const saved = localStorage.getItem(key);
        value = saved !== null && isValid(saved) ? saved : fallback;
      } catch {
        value = fallback;
      }
    }
    return value;
  }

  function set(next: T) {
    value = next;
    try {
      localStorage.setItem(key, next);
    } catch {
      /* ignore */
    }
    listeners.forEach((l) => l());
  }

  function subscribe(l: () => void) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }

  return { get, set, subscribe, fallback };
}

export function useStoredSetting<T extends string>(s: ReturnType<typeof storedSetting<T>>): T {
  return useSyncExternalStore(s.subscribe, s.get, () => s.fallback);
}
