export interface Clock {
  now(): Date;
}

export const systemClock: Clock = { now: () => new Date() };

/** A controllable clock for tests. */
export function createFixedClock(initialIso: string): Clock & { set(iso: string): void; advanceMinutes(minutes: number): void } {
  let current = new Date(initialIso);
  return {
    now: () => new Date(current),
    set(iso: string) {
      current = new Date(iso);
    },
    advanceMinutes(minutes: number) {
      current = new Date(current.getTime() + minutes * 60_000);
    },
  };
}
