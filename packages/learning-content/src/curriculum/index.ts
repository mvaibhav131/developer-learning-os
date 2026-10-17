import type { TrackDef } from '../types';
import { aiTrack } from './ai';
import { dsaTrack } from './dsa';
import { englishTrack } from './english';
import { fullStackTrack } from './full-stack';
import { interviewTrack } from './interview';
import { systemDesignTrack } from './system-design';

export const curriculum: readonly TrackDef[] = [
  aiTrack,
  dsaTrack,
  systemDesignTrack,
  fullStackTrack,
  interviewTrack,
  englishTrack,
];

export { aiTrack, dsaTrack, englishTrack, fullStackTrack, interviewTrack, systemDesignTrack };
