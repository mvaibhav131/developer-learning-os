---
summary: The array patterns behind many interview questions. Track running state in one pass, use Kadane's algorithm, build prefix and suffix products, sort then scan, and avoid the classic initialization bugs.
tags: [arrays, kadane, one-pass, running-state, patterns]
videos: [5WZl3MMT0Eg, 9IZYqostl2M, AHZpyENo7k4, bNvIQI2wAjk]
---

Most array questions are not about a trick, they are about **spotting a pattern**. Once you recognise the pattern, the code is short. This lesson shows the patterns that appear most often in interviews and how to choose between them.

## The pattern catalog

| The problem sounds like | Reach for |
| --- | --- |
| "best / largest / smallest so far", one pass | running state (min, max, sum) |
| "best contiguous subarray" | Kadane's algorithm |
| "everything except me", "range sums" | prefix and suffix arrays |
| "have I seen this value?" | hash set or map |
| "pairs in sorted data" | two pointers |
| "order does not matter" | sort first, then scan |
| "do it in place" | write pointer, swaps |

## Pattern 1: one pass with running state

When the answer depends on something you have already seen, carry it along. **Best Time to Buy and Sell Stock** only needs the lowest price so far:

```ts
function maxProfit(prices: number[]): number {
  let lowest = Infinity;
  let best = 0;
  for (const price of prices) {
    if (price < lowest) lowest = price;
    else best = Math.max(best, price - lowest);
  }
  return best;
}
```

One pass, two variables: `O(n)` time and `O(1)` space.

## Pattern 2: Kadane's algorithm (best subarray)

For the largest sum of a **contiguous** subarray, ask at each index: "what is the best subarray that **ends here**?" It is either the current number alone, or the current number added to the best subarray that ended just before.

```ts
function maxSubArray(nums: number[]): number {
  let current = nums[0];
  let best = nums[0];
  for (let i = 1; i < nums.length; i++) {
    current = Math.max(nums[i], current + nums[i]);
    best = Math.max(best, current);
  }
  return best;
}
```

Dry run for `[-2, 1, -3, 4, -1, 2, 1, -5, 4]`:

| i | value | current | best |
| --- | --- | --- | --- |
| 0 | -2 | -2 | -2 |
| 1 | 1 | 1 | 1 |
| 2 | -3 | -2 | 1 |
| 3 | 4 | 4 | 4 |
| 4 | -1 | 3 | 4 |
| 5 | 2 | 5 | 5 |
| 6 | 1 | 6 | 6 |
| 7 | -5 | 1 | 6 |
| 8 | 4 | 5 | 6 |

The answer is 6, from the subarray `[4, -1, 2, 1]`.

## Pattern 3: prefix and suffix

If the answer for position `i` combines "everything to the left" and "everything to the right", compute the left part in one pass and the right part in another. **Product of Array Except Self** uses this: store left products in the output array, then multiply by a running right product. You will meet the idea again in the prefix-sum lessons.

## Pattern 4: sort first, then scan

Sorting costs `O(n log n)` but often turns a hard question into an easy scan: duplicates become neighbours, ranges become adjacent, and pairs can be found with two pointers. Use it when the original order does not matter.

## Choosing initial values

Many bugs come from the starting value of a running variable.

- For a **maximum**, start from the first element or `-Infinity`, **not 0**. Otherwise an array of only negative numbers returns 0.
- For a **minimum**, start from the first element or `Infinity`.
- For a **count or sum**, 0 is correct.

## Common mistakes

- Initializing the best sum with `0` when all numbers can be negative.
- Off-by-one errors: `i <= nums.length` reads past the end.
- Changing an array while iterating over it.
- Forgetting a one-element or empty array.
- Optimizing too early: write the brute force first so you understand the question.

## A way to practise

1. Say the brute-force solution and its complexity.
2. Name the pattern from the catalog above.
3. Write the optimized solution.
4. Test with an empty array, one element, all negatives and duplicates.

## Practice

Open **Best Time to Buy and Sell Stock** and **Maximum Subarray**. Solve them yourself first, then compare with the hints and the explanation. Try to explain the path from brute force to the optimized solution aloud.

## Recap

- Spot the pattern: running state, Kadane, prefix and suffix, sort then scan.
- Kadane asks "best subarray ending here".
- Start maximums from the first element, not from zero.
- Always test the empty, one-element and all-negative cases.
