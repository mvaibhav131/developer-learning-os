---
summary: Solve longest and shortest substring or subarray problems with a window that grows and shrinks. Learn the expand-then-shrink template, when it works, and where to update the answer.
tags: [sliding-window, variable-window, substring, two-pointers, longest-shortest]
videos: [wiGpQwVHdE0, jSto0O4AJbM, uqGxFk0cEdI]
---

A **variable-size sliding window** is a segment `[left, right]` whose length changes. You **expand** `right` to include a new element, and when the window stops satisfying a rule you **shrink** `left` until it is valid again. Because both pointers only move forward, each element enters and leaves the window at most once, so the whole scan is `O(n)`.

## When to use it

- "longest substring or subarray such that ..." (window must stay valid)
- "shortest or minimum-length subarray with sum at least ..." (window must become valid)
- "at most `k` distinct characters", "no repeated characters"
- The data has a property that makes shrinking meaningful, such as **all positive numbers** or a condition you can maintain with counts.

## Template A: longest valid window

```ts
let left = 0;
let best = 0;
for (let right = 0; right < n; right++) {
  // add element at right to the window state
  while (/* window is invalid */) {
    // remove element at left from the window state
    left++;
  }
  best = Math.max(best, right - left + 1); // window is valid here
}
```

## Template B: shortest valid window

```ts
let left = 0;
let best = Infinity;
for (let right = 0; right < n; right++) {
  // add element at right to the window state
  while (/* window is valid */) {
    best = Math.min(best, right - left + 1); // record BEFORE shrinking
    // remove element at left from the window state
    left++;
  }
}
```

The difference is **where you record the answer**. For the longest window, record after the window is valid again. For the shortest window, record while it is valid, inside the shrinking loop.

## Example 1: longest substring without repeating characters

State: a Set (or a Map of last positions) of the characters in the window. When the new character is already inside, shrink from the left until it is removed.

```ts
function lengthOfLongestSubstring(s: string): number {
  const lastSeen = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    const previous = lastSeen.get(s[right]);
    if (previous !== undefined && previous >= left) left = previous + 1;
    lastSeen.set(s[right], right);
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

Storing the last index lets `left` **jump** instead of moving one step at a time.

## Example 2: minimum size subarray sum

All numbers are positive, so adding an element increases the sum and removing one decreases it. That makes the window monotonic.

```ts
function minSubArrayLen(target: number, nums: number[]): number {
  let left = 0;
  let sum = 0;
  let best = Infinity;
  for (let right = 0; right < nums.length; right++) {
    sum += nums[right];
    while (sum >= target) {
      best = Math.min(best, right - left + 1);
      sum -= nums[left];
      left++;
    }
  }
  return best === Infinity ? 0 : best;
}
```

## Example 3: at most k distinct values

```ts
function longestWithAtMostKDistinct(s: string, k: number): number {
  const counts = new Map<string, number>();
  let left = 0;
  let best = 0;
  for (let right = 0; right < s.length; right++) {
    counts.set(s[right], (counts.get(s[right]) ?? 0) + 1);
    while (counts.size > k) {
      const ch = s[left];
      const remaining = (counts.get(ch) ?? 0) - 1;
      if (remaining === 0) counts.delete(ch);
      else counts.set(ch, remaining);
      left++;
    }
    best = Math.max(best, right - left + 1);
  }
  return best;
}
```

## Example 4: replacing characters

For **Longest Repeating Character Replacement**, a window is valid when `window length - count of its most frequent letter <= k`. The leftover letters are the ones you replace.

## Why negative numbers break the sum window

If a subarray can contain negative numbers, adding an element can reduce the sum and removing an element can increase it, so you cannot decide whether to shrink or expand. Use **prefix sums with a hash map** instead (see the prefix-sum lessons).

## Common mistakes

- Recording the answer in the wrong place (see Template A and Template B).
- Using `if` instead of `while` when the window may need to shrink more than once.
- Forgetting to remove the element at `left` from the state before moving `left`.
- Using a variable window when the numbers can be negative.
- Returning `Infinity` instead of `0` when no valid window exists.

## Practice

Solve **Longest Substring Without Repeating Characters**, **Minimum Size Subarray Sum** and **Longest Repeating Character Replacement**. For each, write down what the window state is and what makes the window invalid or valid before you code.

## Recap

- Expand with `right`, shrink with `left`. Each pointer only moves forward, so the scan is `O(n)`.
- Longest window: record after restoring validity. Shortest window: record while valid.
- Choose the state that makes validity cheap to test: a Set, a Map of counts, or a running sum.
- Windows with negative numbers need prefix sums instead.
