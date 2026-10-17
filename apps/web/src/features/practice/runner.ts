import { runTests, type AttemptStatus, type CaseResult } from '@dlos/shared';
import { transform } from 'sucrase';
import type { RunRequest, WorkerMessage } from './runner-types';

export interface RunOutcome {
  compileError: string | null;
  results: CaseResult[];
  /** Index of the test that never returned, when the time limit was hit. */
  timedOutAt: number | null;
  status: AttemptStatus;
  passed: number;
  total: number;
  runtimeMs: number;
}

const PER_TEST_LIMIT_MS = 2000;

export function summarise(request: RunRequest, partial: Pick<RunOutcome, 'compileError' | 'results' | 'timedOutAt'>): RunOutcome {
  const total = request.tests.length;
  const passed = partial.results.filter((result) => result.passed).length;
  const status: AttemptStatus = partial.compileError
    ? 'error'
    : partial.timedOutAt !== null
      ? 'timeout'
      : passed === total
        ? 'passed'
        : passed === 0
          ? 'failed'
          : 'partial';
  const runtimeMs = Math.round(partial.results.reduce((sum, result) => sum + result.timeMs, 0));
  return { ...partial, status, passed, total, runtimeMs };
}

/** Test environments (and very old browsers) have no Worker; this path blocks the page, so it is a fallback only. */
function runOnMainThread(request: RunRequest): RunOutcome {
  let javascript = request.code;
  if (request.language === 'typescript') {
    try {
      javascript = transform(request.code, { transforms: ['typescript'] }).code;
    } catch (error) {
      return summarise(request, { compileError: error instanceof Error ? error.message : String(error), results: [], timedOutAt: null });
    }
  }
  const report = runTests(javascript, request.config, request.tests);
  return summarise(request, { compileError: report.compileError, results: report.results, timedOutAt: null });
}

/** Runs the learner's code in a Web Worker and stops it if a single test takes longer than two seconds. */
export function runInWorker(request: RunRequest, perTestMs = PER_TEST_LIMIT_MS): Promise<RunOutcome> {
  if (typeof Worker === 'undefined') return Promise.resolve(runOnMainThread(request));

  return new Promise((resolve) => {
    const worker = new Worker(new URL('./runner.worker.ts', import.meta.url), { type: 'module' });
    const results: CaseResult[] = [];
    let compileError: string | null = null;
    let timer: number | undefined;
    let current = 0;
    let finished = false;

    const finish = (timedOutAt: number | null) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timer);
      worker.terminate();
      resolve(summarise(request, { compileError, results, timedOutAt }));
    };
    const arm = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => finish(current), perTestMs);
    };

    worker.onmessage = ({ data }: MessageEvent<WorkerMessage>) => {
      if (data.type === 'compile-error') compileError = data.message;
      else if (data.type === 'start') {
        current = data.index;
        arm();
      } else if (data.type === 'result') results.push(data.result);
      else finish(null);
    };
    worker.onerror = (event) => {
      compileError = event.message || 'The code runner stopped unexpectedly.';
      finish(null);
    };

    arm();
    worker.postMessage(request);
  });
}
