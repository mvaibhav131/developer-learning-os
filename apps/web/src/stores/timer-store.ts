import type { TrackSlug } from '@dlos/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface ActiveTimer {
  trackSlug: TrackSlug;
  /** Epoch milliseconds, so the timer survives reloads and tab switches. */
  startedAt: number;
  planTaskId?: number;
  lessonSlug?: string;
}

interface TimerState {
  active: ActiveTimer | null;
  start: (timer: Omit<ActiveTimer, 'startedAt'>, now?: number) => void;
  clear: () => void;
}

export const useTimerStore = create<TimerState>()(
  persist(
    (set) => ({
      active: null,
      start: (timer, now = Date.now()) => set({ active: { ...timer, startedAt: now } }),
      clear: () => set({ active: null }),
    }),
    { name: 'dlos-timer' },
  ),
);

export function elapsedMinutes(timer: ActiveTimer, now: number): number {
  return Math.max(0, Math.floor((now - timer.startedAt) / 60_000));
}
