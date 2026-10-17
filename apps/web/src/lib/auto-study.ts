import * as contract from '@dlos/shared';
import { useEffect } from 'react';
import { callApi } from './api';
import { keys, queryClient } from './queries';
import { useTimerStore } from '../stores/timer-store';
import { useUiStore } from '../stores/ui-store';

const TICK_MS = 1000;
/** A long gap between ticks means the computer slept, which is not study time. */
const MAX_GAP_SECONDS = 5;

/**
 * Counts the seconds a lesson or problem is open in a visible tab and logs them as a study session,
 * so nobody has to start timers or type minutes by hand. Off while a manual timer runs.
 */
export function useAutoStudyTimer(target: { trackSlug: contract.TrackSlug; lessonSlug?: string } | null): void {
  const enabled = useUiStore((state) => state.autoTrackStudy);
  const manualTimerRunning = useTimerStore((state) => state.active !== null);
  const active = enabled && !manualTimerRunning && target !== null;
  const trackSlug = target?.trackSlug;
  const lessonSlug = target?.lessonSlug;

  useEffect(() => {
    if (!active || !trackSlug) return;
    let seconds = 0;
    let last = Date.now();

    const flush = () => {
      const minutes = Math.floor(seconds / 60);
      if (minutes < 1) return;
      seconds -= minutes * 60;
      void callApi(
        contract.createStudySession,
        {
          body: {
            trackSlug,
            durationMinutes: Math.min(minutes, contract.MAX_SESSION_MINUTES),
            source: 'timer',
            ...(lessonSlug ? { lessonSlug } : {}),
          },
        },
        { keepalive: true },
      )
        .then(() => {
          void queryClient.invalidateQueries({ queryKey: keys.dashboard });
          void queryClient.invalidateQueries({ queryKey: ['calendar'] });
          void queryClient.invalidateQueries({ queryKey: ['sessions'] });
        })
        .catch(() => undefined);
    };

    const id = window.setInterval(() => {
      const now = Date.now();
      if (document.visibilityState === 'visible') seconds += Math.min((now - last) / 1000, MAX_GAP_SECONDS);
      last = now;
    }, TICK_MS);
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
      last = Date.now();
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(id);
      document.removeEventListener('visibilitychange', onVisibility);
      flush();
    };
  }, [active, trackSlug, lessonSlug]);
}
