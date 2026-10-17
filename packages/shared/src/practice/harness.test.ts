import { describe, expect, it } from 'vitest';
import {
  ListNode,
  listFromArray,
  listToArray,
  runTests,
  treeFromLevelOrder,
  treeToLevelOrder,
  valuesMatch,
} from './harness';

describe('codecs', () => {
  it('round-trips linked lists', () => {
    expect(listToArray(listFromArray([1, 2, 3]))).toEqual([1, 2, 3]);
    expect(listFromArray([])).toBeNull();
  });

  it('refuses to serialise a cyclic list', () => {
    const node = new ListNode(1);
    node.next = node;
    expect(() => listToArray(node)).toThrow(/cycle/);
  });

  it('builds and flattens level-order trees', () => {
    const root = treeFromLevelOrder([1, null, 2, 3]);
    expect(root?.right?.left?.val).toBe(3);
    expect(root?.left).toBeNull();
    expect(treeToLevelOrder(root)).toEqual([1, null, 2, 3]);
    expect(treeToLevelOrder(treeFromLevelOrder([3, 9, 20, null, null, 15, 7]))).toEqual([3, 9, 20, null, null, 15, 7]);
    expect(treeFromLevelOrder([])).toBeNull();
  });
});

describe('valuesMatch', () => {
  it('compares nested values strictly by default', () => {
    expect(valuesMatch([[1, 2], [3]], [[1, 2], [3]])).toBe(true);
    expect(valuesMatch([1, 2], [2, 1])).toBe(false);
    expect(valuesMatch(null, undefined)).toBe(false);
    expect(valuesMatch(NaN, NaN)).toBe(true);
    expect(valuesMatch({ a: 1 }, { a: 1, b: 2 })).toBe(false);
  });

  it('supports any-order results and grouped any-order results', () => {
    expect(valuesMatch([0, 1], [1, 0], { ordering: 'any-order' })).toBe(true);
    expect(valuesMatch([['b', 'a'], ['c']], [['c'], ['a', 'b']], { ordering: 'any-order-groups' })).toBe(true);
    expect(valuesMatch([['a', 'b']], [['a', 'c']], { ordering: 'any-order-groups' })).toBe(false);
  });

  it('tolerates tiny float differences only when asked', () => {
    expect(valuesMatch(2.5, 2.5000001, { float: true })).toBe(true);
    expect(valuesMatch(2.5, 2.5000001)).toBe(false);
  });
});

describe('runTests', () => {
  const sum = 'function sum(a, b) { return a + b; }';

  it('reports passes and failures per test with formatted values', () => {
    const report = runTests(sum, { functionName: 'sum' }, [
      { args: [1, 2], expected: 3 },
      { args: [1, 2], expected: 4, hidden: true },
    ]);
    expect(report.compileError).toBeNull();
    expect(report.results.map((result) => result.passed)).toEqual([true, false]);
    expect(report.results[1]).toMatchObject({ hidden: true, args: '1, 2', expected: '4', actual: '3' });
  });

  it('accepts exported functions and strips TypeScript-free syntax issues', () => {
    const report = runTests('export function sum(a, b) { return a + b; }', { functionName: 'sum' }, [
      { args: [2, 2], expected: 4 },
    ]);
    expect(report.results[0]?.passed).toBe(true);
  });

  it('reports syntax errors and a missing function', () => {
    expect(runTests('function sum( {', { functionName: 'sum' }, []).compileError).toMatch(/SyntaxError/);
    expect(runTests('const x = 1;', { functionName: 'sum' }, []).compileError).toContain('Define a function named "sum"');
  });

  it('captures thrown errors without stopping the other tests', () => {
    const report = runTests('function f(n) { if (n < 0) throw new RangeError("negative"); return n; }', { functionName: 'f' }, [
      { args: [-1], expected: 0 },
      { args: [2], expected: 2 },
    ]);
    expect(report.results[0]).toMatchObject({ passed: false, error: 'RangeError: negative' });
    expect(report.results[1]?.passed).toBe(true);
  });

  it('captures console output per test', () => {
    const report = runTests('function f(n) { console.log("n is", n); return n; }', { functionName: 'f' }, [
      { args: [1], expected: 1 },
      { args: [2], expected: 2 },
    ]);
    expect(report.results.map((result) => result.logs)).toEqual([['n is 1'], ['n is 2']]);
  });

  it('gives every test a fresh copy of its input', () => {
    const tests = [{ args: [[3, 1, 2]], expected: [1, 2, 3] }];
    const code = 'function sortIt(nums) { nums.sort((a, b) => a - b); return nums; }';
    runTests(code, { functionName: 'sortIt' }, tests);
    expect(tests[0]?.args[0]).toEqual([3, 1, 2]);
  });

  it('compares the mutated first argument for in-place problems', () => {
    const code = 'function moveZeroes(nums) { nums.sort((a, b) => (a === 0 ? 1 : b === 0 ? -1 : 0)); }';
    const report = runTests(code, { functionName: 'moveZeroes', inPlace: true }, [
      { args: [[0, 1, 0, 3, 12]], expected: [1, 3, 12, 0, 0] },
    ]);
    expect(report.results[0]?.passed).toBe(true);
  });

  it('decodes list arguments and encodes list results', () => {
    const code = `function reverse(head) { let prev = null; while (head) { const next = head.next; head.next = prev; prev = head; head = next; } return prev; }`;
    const report = runTests(code, { functionName: 'reverse', argCodecs: ['list'], returnCodec: 'list' }, [
      { args: [[1, 2, 3]], expected: [3, 2, 1] },
      { args: [[]], expected: [] },
    ]);
    expect(report.results.map((result) => result.passed)).toEqual([true, true]);
  });

  it('decodes tree arguments', () => {
    const code = 'function depth(root) { return root ? 1 + Math.max(depth(root.left), depth(root.right)) : 0; }';
    const report = runTests(code, { functionName: 'depth', argCodecs: ['tree'] }, [
      { args: [[3, 9, 20, null, null, 15, 7]], expected: 3 },
    ]);
    expect(report.results[0]?.passed).toBe(true);
  });

  it('explains when the wrong type is returned for a list', () => {
    const report = runTests('function f() { return [1]; }', { functionName: 'f', returnCodec: 'list' }, [
      { args: [], expected: [1] },
    ]);
    expect(report.results[0]?.error).toContain('Return a ListNode');
  });

  it('rejects async functions with a helpful message', () => {
    const report = runTests('async function f() { return 1; }', { functionName: 'f' }, [{ args: [], expected: 1 }]);
    expect(report.results[0]?.error).toContain('Promise');
  });

  it('rejects unsafe function names', () => {
    expect(runTests('function f() {}', { functionName: 'f(); evil' }, []).compileError).toContain('Invalid function name');
  });
});
