---
summary: Learn to measure how fast and how memory-hungry your code is. Big O classes, how to count loops and recursion, amortized cost and how constraints tell you the target complexity.
tags: [big-o, complexity, time-complexity, space-complexity, amortized]
videos: [g2o22C3CRfU, jOMxKsUd6e0, PwKv8fOcriM, 7dz8Iaf_weM]
---

Every interview solution is judged on two questions: **does it work**, and **how does it scale**. Big O notation is the shared language for the second question. It describes how the number of steps (time) or the amount of extra memory (space) grows when the input size `n` grows. It deliberately ignores constants and tiny details, because what matters is the **shape of the growth**.

## What Big O means

- We count **basic operations** as a function of the input size, usually `n`.
- We keep only the **fastest-growing term** and drop constants: `3n² + 10n + 7` is `O(n²)`.
- By default we describe the **worst case**: the input that makes the algorithm work hardest.
- Different inputs get different letters: for a grid it may be `O(rows × cols)`. Always say what your variables mean.

## The classes you must know

| Class | Name | Typical example | n = 1,000 | n = 1,000,000 |
| --- | --- | --- | --- | --- |
| O(1) | constant | array index, Map lookup (average) | 1 | 1 |
| O(log n) | logarithmic | binary search | ~10 | ~20 |
| O(n) | linear | one loop over the input | 1,000 | 1,000,000 |
| O(n log n) | linearithmic | good sorting algorithms | ~10,000 | ~20,000,000 |
| O(n²) | quadratic | two nested loops over the input | 1,000,000 | 10¹² (too slow) |
| O(2ⁿ) | exponential | all subsets | astronomically large | impossible |
| O(n!) | factorial | all permutations | impossible | impossible |

A modern machine does roughly 10⁸ to 10⁹ simple operations per second, so a solution should stay around **10⁸ operations** for a time limit of a second or two.

## How to count

**One loop is O(n).**

```ts
function sum(nums: number[]): number {
  let total = 0;
  for (const value of nums) total += value; // n steps
  return total;
}
```

**Loops one after another add up: O(n) + O(n) = O(n).** Loops **inside** loops multiply.

```ts
function hasPair(nums: number[], target: number): boolean {
  for (let i = 0; i < nums.length; i++) {
    for (let j = i + 1; j < nums.length; j++) { // n * n / 2 steps: O(n^2)
      if (nums[i] + nums[j] === target) return true;
    }
  }
  return false;
}
```

**Halving the problem every step is O(log n).** Binary search does this: 1,000 items need about 10 steps.

**Recursion:** count the work per call times the number of calls. A function that calls itself twice per level for `n` levels makes about `2ⁿ` calls.

## Space complexity

Space complexity counts the **extra memory** your algorithm uses, not the input itself. The recursion call stack counts too.

- A few variables: `O(1)`.
- A `Map` or `Set` that can hold up to `n` items: `O(n)`.
- Recursion that goes `n` levels deep: `O(n)` stack space.

Trading space for time is the most common optimization. The hash-map version of Two Sum uses `O(n)` space to turn `O(n²)` time into `O(n)`.

## Amortized cost

Some operations are occasionally expensive but cheap on average. `array.push` is `O(1)` **amortized**: when the internal buffer is full the engine copies the array to a bigger one, but that happens so rarely that the average cost per push stays constant. Say "amortized O(1)" in an interview.

## Hidden costs in JavaScript

| Operation | Cost |
| --- | --- |
| `arr[i]`, `arr.push`, `arr.pop` | O(1) |
| `arr.shift`, `arr.unshift`, `arr.splice` | O(n) |
| `arr.includes`, `arr.indexOf`, `arr.find` | O(n) |
| `arr.slice`, `[...arr]`, `arr.concat` | O(n) |
| `arr.sort` | O(n log n) |
| `map.get`, `map.set`, `set.has`, `set.add` | O(1) average |

Calling `includes` or `slice` **inside** a loop quietly turns an `O(n)` solution into `O(n²)`.

## Constraints tell you the target

| Input size | Aim for |
| --- | --- |
| n up to about 20 | O(2ⁿ) or O(n!) is fine (backtracking) |
| n up to about 500 | O(n³) |
| n up to about 5,000 | O(n²) |
| n up to about 10⁵ | O(n log n) or O(n) |
| n up to about 10⁶ or more | O(n) or O(log n) |

Read the constraints first. They often reveal the intended solution before you write a line of code.

## Common mistakes

- Saying two loops are always `O(n²)`. Only **nested** loops multiply.
- Forgetting that building a string or copying an array inside a loop costs `O(n)` each time.
- Forgetting recursion stack space.
- Mixing up best, average and worst case without saying which one you mean.

## Practice

Before you solve any practice problem, say its brute-force complexity out loud. After you solve it, say the new complexity and what you traded to get it. Try this on **Fizz Buzz**, **Missing Number** and **Contains Duplicate**.

## Recap

- Big O describes growth, not exact time. Drop constants and small terms.
- Sequential steps add, nested steps multiply, halving gives log n.
- Count extra memory and the recursion stack too.
- Use the input constraints to choose the complexity you should aim for.
