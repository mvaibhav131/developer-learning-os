import type { HarnessCodec, HarnessOrdering } from '../constants';

export class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val = 0, next: ListNode | null = null) {
    this.val = val;
    this.next = next;
  }
}

export class TreeNode {
  val: number;
  left: TreeNode | null;
  right: TreeNode | null;
  constructor(val = 0, left: TreeNode | null = null, right: TreeNode | null = null) {
    this.val = val;
    this.left = left;
    this.right = right;
  }
}

const MAX_LIST_LENGTH = 100_000;

export function listFromArray(values: readonly number[]): ListNode | null {
  let head: ListNode | null = null;
  for (let index = values.length - 1; index >= 0; index -= 1) {
    head = new ListNode(values[index] ?? 0, head);
  }
  return head;
}

export function listToArray(head: ListNode | null): number[] {
  const values: number[] = [];
  let node = head;
  while (node) {
    if (values.length >= MAX_LIST_LENGTH) throw new Error('The returned list has a cycle or is too long.');
    values.push(node.val);
    node = node.next;
  }
  return values;
}

/** LeetCode-style level order: [1,null,2,3] is 1 with a right child 2 whose left child is 3. */
export function treeFromLevelOrder(values: ReadonlyArray<number | null>): TreeNode | null {
  const first = values[0];
  if (first === undefined || first === null) return null;
  const root = new TreeNode(first);
  const queue: TreeNode[] = [root];
  let cursor = 1;
  for (let head = 0; head < queue.length && cursor < values.length; head += 1) {
    const node = queue[head];
    if (!node) break;
    const left = values[cursor];
    cursor += 1;
    if (left !== undefined && left !== null) {
      node.left = new TreeNode(left);
      queue.push(node.left);
    }
    if (cursor >= values.length) break;
    const right = values[cursor];
    cursor += 1;
    if (right !== undefined && right !== null) {
      node.right = new TreeNode(right);
      queue.push(node.right);
    }
  }
  return root;
}

export function treeToLevelOrder(root: TreeNode | null): Array<number | null> {
  if (!root) return [];
  const output: Array<number | null> = [];
  const queue: Array<TreeNode | null> = [root];
  // The queue grows while it is walked; for-of keeps following the appended nodes.
  for (const node of queue) {
    if (output.length > MAX_LIST_LENGTH) throw new Error('The returned tree has a cycle or is too large.');
    if (node) {
      output.push(node.val);
      queue.push(node.left ?? null, node.right ?? null);
    } else {
      output.push(null);
    }
  }
  while (output.length > 0 && output[output.length - 1] === null) output.pop();
  return output;
}

function decode(value: unknown, codec: HarnessCodec): unknown {
  if (codec === 'list') return listFromArray(value as number[]);
  if (codec === 'tree') return treeFromLevelOrder(value as Array<number | null>);
  return structuredClone(value);
}

function encode(value: unknown, codec: HarnessCodec): unknown {
  if (codec === 'list') {
    if (value !== null && !(value instanceof ListNode)) {
      throw new Error('Return a ListNode (or null for an empty list).');
    }
    return listToArray(value);
  }
  if (codec === 'tree') {
    if (value !== null && !(value instanceof TreeNode)) {
      throw new Error('Return a TreeNode (or null for an empty tree).');
    }
    return treeToLevelOrder(value);
  }
  return value;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, item: unknown) =>
    typeof item === 'number' && !Number.isFinite(item) ? String(item) : item,
  );
}

function deepEqual(expected: unknown, actual: unknown, float: boolean): boolean {
  if (typeof expected === 'number' && typeof actual === 'number') {
    if (Number.isNaN(expected) && Number.isNaN(actual)) return true;
    if (float) return Math.abs(expected - actual) <= 1e-5 * Math.max(1, Math.abs(expected));
    return expected === actual;
  }
  if (Array.isArray(expected) || Array.isArray(actual)) {
    if (!Array.isArray(expected) || !Array.isArray(actual) || expected.length !== actual.length) return false;
    return expected.every((item, index) => deepEqual(item, actual[index], float));
  }
  if (expected && actual && typeof expected === 'object' && typeof actual === 'object') {
    const left = expected as Record<string, unknown>;
    const right = actual as Record<string, unknown>;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every((key) => key in right && deepEqual(left[key], right[key], float));
  }
  return expected === actual;
}

function normalise(value: unknown, ordering: HarnessOrdering): unknown {
  if (!Array.isArray(value)) return value;
  const items: unknown[] = value;
  const byCanonical = (a: unknown, b: unknown) => canonical(a).localeCompare(canonical(b));
  if (ordering === 'any-order') return [...items].sort(byCanonical);
  if (ordering === 'any-order-groups') {
    return items
      .map((group) => (Array.isArray(group) ? [...(group as unknown[])].sort(byCanonical) : group))
      .sort(byCanonical);
  }
  return items;
}

export function valuesMatch(
  expected: unknown,
  actual: unknown,
  options: { ordering?: HarnessOrdering | undefined; float?: boolean | undefined } = {},
): boolean {
  const ordering = options.ordering ?? 'exact';
  return deepEqual(normalise(expected, ordering), normalise(actual, ordering), options.float ?? false);
}

export function formatValue(value: unknown, max = 400): string {
  let text: string;
  if (value === undefined) text = 'undefined';
  else if (typeof value === 'function') text = '[Function]';
  else if (typeof value === 'symbol') text = value.toString();
  else {
    try {
      const json = JSON.stringify(value, (_key, item: unknown) => {
        if (typeof item === 'number' && !Number.isFinite(item)) return String(item);
        if (typeof item === 'bigint') return `${item}n`;
        return item;
      }) as string | undefined;
      text = json ?? 'undefined';
    } catch {
      text = Object.prototype.toString.call(value);
    }
  }
  return text.length > max ? `${text.slice(0, max)}…` : text;
}

function describeError(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  return String(error);
}

export interface HarnessConfig {
  functionName: string;
  argCodecs?: readonly HarnessCodec[] | undefined;
  returnCodec?: HarnessCodec | undefined;
  ordering?: HarnessOrdering | undefined;
  /** Compare the (mutated) first argument instead of the return value. */
  inPlace?: boolean | undefined;
  float?: boolean | undefined;
}

export interface HarnessTest {
  args: readonly unknown[];
  expected: unknown;
  hidden?: boolean | undefined;
}

export interface CaseResult {
  index: number;
  hidden: boolean;
  passed: boolean;
  args: string;
  expected: string;
  actual: string;
  error: string | null;
  timeMs: number;
  logs: string[];
}

const MAX_LOG_LINES = 200;

export interface LogCollector {
  console: Pick<Console, 'log' | 'info' | 'warn' | 'error' | 'debug'>;
  take: () => string[];
}

export function createLogCollector(): LogCollector {
  let lines: string[] = [];
  const write =
    (prefix: string) =>
    (...parts: unknown[]) => {
      if (lines.length >= MAX_LOG_LINES) return;
      const text = parts.map((part) => (typeof part === 'string' ? part : formatValue(part, 500))).join(' ');
      lines.push(`${prefix}${text.length > 1000 ? `${text.slice(0, 1000)}…` : text}`);
    };
  return {
    console: { log: write(''), info: write(''), debug: write(''), warn: write('warn: '), error: write('error: ') },
    take: () => {
      const taken = lines;
      lines = [];
      return taken;
    },
  };
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

export type CompiledSolution =
  | { ok: true; fn: (...args: unknown[]) => unknown }
  | { ok: false; error: string };

/** `js` must already be plain JavaScript; TypeScript is transpiled by the caller. */
export function compileSolution(js: string, functionName: string, collector: LogCollector): CompiledSolution {
  if (!IDENTIFIER.test(functionName)) return { ok: false, error: `Invalid function name "${functionName}".` };
  const source = js.replace(/^[ \t]*export\s+(default\s+)?/gm, '');
  try {
    // Running the learner's own code is the point of the practice editor; the browser does it inside a Worker.
    // eslint-disable-next-line @typescript-eslint/no-implied-eval
    const factory = new Function(
      'ListNode',
      'TreeNode',
      'console',
      `"use strict";\n${source}\n;return typeof ${functionName} === 'function' ? ${functionName} : undefined;`,
    ) as (list: unknown, tree: unknown, log: unknown) => unknown;
    const fn = factory(ListNode, TreeNode, collector.console);
    if (typeof fn !== 'function') return { ok: false, error: `Define a function named "${functionName}".` };
    return { ok: true, fn: fn as (...args: unknown[]) => unknown };
  } catch (error) {
    return { ok: false, error: describeError(error) };
  }
}

export function runCase(
  fn: (...args: unknown[]) => unknown,
  config: HarnessConfig,
  test: HarnessTest,
  index: number,
  collector: LogCollector,
): CaseResult {
  const base = {
    index,
    hidden: test.hidden ?? false,
    args: test.args.map((arg) => formatValue(arg)).join(', '),
    expected: formatValue(test.expected),
  };
  const fail = (error: string, timeMs: number): CaseResult => ({
    ...base,
    passed: false,
    actual: '',
    error,
    timeMs,
    logs: collector.take(),
  });

  let args: unknown[];
  try {
    const codecs = config.argCodecs ?? [];
    args = test.args.map((arg, position) => decode(arg, codecs[position] ?? 'plain'));
  } catch (error) {
    return fail(`Could not prepare the test input: ${describeError(error)}`, 0);
  }

  const started = performance.now();
  let returned: unknown;
  try {
    returned = fn(...args);
  } catch (error) {
    return fail(describeError(error), performance.now() - started);
  }
  const timeMs = performance.now() - started;

  if (returned instanceof Promise) {
    void returned.catch(() => undefined);
    return fail('Your function returned a Promise. Write a regular (synchronous) function.', timeMs);
  }

  let encoded: unknown;
  try {
    const target = config.inPlace ? args[0] : returned;
    const codec = config.inPlace ? (config.argCodecs?.[0] ?? 'plain') : (config.returnCodec ?? 'plain');
    encoded = encode(target, codec);
  } catch (error) {
    return fail(describeError(error), timeMs);
  }

  return {
    ...base,
    passed: valuesMatch(test.expected, encoded, { ordering: config.ordering, float: config.float }),
    actual: formatValue(encoded),
    error: null,
    timeMs,
    logs: collector.take(),
  };
}

export interface RunReport {
  compileError: string | null;
  results: CaseResult[];
}

/** Synchronous runner used by the Node content checks. The browser runs the same pieces in a worker. */
export function runTests(js: string, config: HarnessConfig, tests: readonly HarnessTest[]): RunReport {
  const collector = createLogCollector();
  const compiled = compileSolution(js, config.functionName, collector);
  if (!compiled.ok) return { compileError: compiled.error, results: [] };
  return {
    compileError: null,
    results: tests.map((test, index) => runCase(compiled.fn, config, test, index, collector)),
  };
}
