import type { TrackSlug } from '@dlos/shared';
import { create } from 'zustand';

export interface LogSessionPrefill {
  trackSlug?: TrackSlug;
  planTaskId?: number;
  lessonSlug?: string;
}

interface OverlayState {
  commandOpen: boolean;
  logSession: { open: boolean; prefill: LogSessionPrefill };
  timerDialogOpen: boolean;
  setCommandOpen: (open: boolean) => void;
  openLogSession: (prefill?: LogSessionPrefill) => void;
  closeLogSession: () => void;
  setTimerDialogOpen: (open: boolean) => void;
}

/** Cross-page overlays that several screens can open (not persisted). */
export const useOverlayStore = create<OverlayState>()((set) => ({
  commandOpen: false,
  logSession: { open: false, prefill: {} },
  timerDialogOpen: false,
  setCommandOpen: (open) => set({ commandOpen: open }),
  openLogSession: (prefill = {}) => set({ logSession: { open: true, prefill } }),
  closeLogSession: () => set((state) => ({ logSession: { ...state.logSession, open: false } })),
  setTimerDialogOpen: (open) => set({ timerDialogOpen: open }),
}));
