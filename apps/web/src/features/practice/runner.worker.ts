import { compileSolution, createLogCollector, runCase } from '@dlos/shared';
import { transform } from 'sucrase';
import type { RunRequest, WorkerMessage } from './runner-types';

interface WorkerScope {
  postMessage: (message: WorkerMessage) => void;
  onmessage: ((event: MessageEvent<RunRequest>) => void) | null;
}
const scope = self as unknown as WorkerScope;

/** Runs in a Web Worker: no DOM access, and the page can terminate it if user code never returns. */
scope.onmessage = ({ data }) => {
  let javascript = data.code;
  if (data.language === 'typescript') {
    try {
      javascript = transform(data.code, { transforms: ['typescript'] }).code;
    } catch (error) {
      scope.postMessage({ type: 'compile-error', message: error instanceof Error ? error.message : String(error) });
      scope.postMessage({ type: 'done' });
      return;
    }
  }

  const collector = createLogCollector();
  const compiled = compileSolution(javascript, data.config.functionName, collector);
  if (!compiled.ok) {
    scope.postMessage({ type: 'compile-error', message: compiled.error });
    scope.postMessage({ type: 'done' });
    return;
  }

  data.tests.forEach((test, index) => {
    scope.postMessage({ type: 'start', index });
    scope.postMessage({ type: 'result', result: runCase(compiled.fn, data.config, test, index, collector) });
  });
  scope.postMessage({ type: 'done' });
};
