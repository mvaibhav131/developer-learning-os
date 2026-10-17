import type { CaseResult, HarnessConfig, HarnessTest, PracticeLanguage } from '@dlos/shared';

export interface RunRequest {
  code: string;
  language: PracticeLanguage;
  config: HarnessConfig;
  tests: HarnessTest[];
}

/** Messages the worker sends back while it runs the tests one by one. */
export type WorkerMessage =
  | { type: 'compile-error'; message: string }
  | { type: 'start'; index: number }
  | { type: 'result'; result: CaseResult }
  | { type: 'done' };
