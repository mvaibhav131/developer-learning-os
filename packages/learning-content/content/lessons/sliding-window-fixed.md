---
summary: Handle windows of a fixed size k in linear time. Slide by adding the entering value and removing the leaving one, track sums, counts and distinct values, and avoid off-by-one errors.
tags: [sliding-window, fixed-window, subarray, sum, linear-time]
videos: [uqGxFk0cEdI, 1pkOgXD63yU]
---

A **fixed-size sliding window** looks at every contiguous block of exactly `k` elements. A naive solution recomputes each block from scratch and costs `O(n × k)`. The window version reuses the previous block: when the window moves one step, **one element leaves and one element enters**, so each step costs `O(1)` and the whole scan costs `O(n)`.

## When to use it

The wording gives it away:

- "subarray of size `k`" or "every window of length `k`"
- "maximum or minimum sum or average of `k` consecutive elements"
- "does any block of `k` contain ...?"

## The template

```ts
function windowSum(nums: number[], k: number): number {
  // 1. Build the first window
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;

  // 2. Slide: add nums[i], remove nums[i - k]
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    best = Math.max(best, sum);
  }
  return best;
}
```

The window at step `i` covers indexes `i - k + 1` to `i`. When you add `nums[i]`, the element that falls out is `nums[i - k]`.

## Example: maximum average subarray

Maximizing the average of `k` elements is the same as maximizing their sum, because `k` is constant. Slide as above and divide by `k` once at the end:

```ts
function findMaxAverage(nums: number[], k: number): number {
  let sum = 0;
  for (let i = 0; i < k; i++) sum += nums[i];
  let best = sum;
  for (let i = k; i < nums.length; i++) {
    sum += nums[i] - nums[i - k];
    best = Math.max(best, sum);
  }
  return best / k;
}
```

## Example: a window with a Map

A window can track more than a sum. To count windows with all distinct values, keep a Map of counts inside the window and add or remove entries as the window slides:

```ts
function countDistinctWindows(nums: number[], k: number): number {
  const counts = new Map<number, number>();
  let result = 0;
  for (let i = 0; i < nums.length; i++) {
    counts.set(nums[i], (counts.get(nums[i]) ?? 0) + 1); // value enters
    if (i >= k) {
      const out = nums[i - k];                           // value leaves
      const left = (counts.get(out) ?? 0) - 1;
      if (left === 0) counts.delete(out);
      else counts.set(out, left);
    }
    if (i >= k - 1 && counts.size === k) result++;
  }
  return result;
}
```

Deleting a key when its count reaches zero keeps `counts.size` equal to the number of distinct values in the window.

## Dry run

For `nums = [1, 12, -5, -6, 50, 3]` and `k = 4`:

| Window | Sum | Best so far |
| --- | --- | --- |
| [1, 12, -5, -6] | 2 | 2 |
| [12, -5, -6, 50] | 51 | 51 |
| [-5, -6, 50, 3] | 42 | 51 |

The best average is `51 / 4 = 12.75`.

## Common mistakes

- Starting the second loop at the wrong index. It should start at `k`, the first element that is not in the first window.
- Removing the wrong element: it is `nums[i - k]`, not `nums[i - k + 1]`.
- Forgetting that `k` may be larger than the array, or equal to its length.
- Recomputing the sum with an inner loop, which brings back `O(n × k)`.
- Using integer division when a decimal result is needed.

## Practice

Solve **Maximum Average Subarray**. Then write `maxSumOfSizeK` yourself, and test it with `k = 1`, `k = nums.length` and negative values.

## Recap

- A fixed window moves one step at a time: one element enters, one leaves.
- The cost drops from `O(n × k)` to `O(n)`.
- Build the first window, then slide.
- For distinct or frequency questions keep a Map inside the window.
