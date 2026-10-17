---
summary: Count and find subarrays with a target sum, even with negative numbers, by combining prefix sums with a hash map. Includes the seed entry, variations for longest, divisible and balanced subarrays.
tags: [prefix-sum, hashmap, subarray-sum, counting, negative-numbers]
videos: [fFVZt-6sgyo, KDH4mhFVvHw]
---

Sliding windows only work when removing an element always moves the sum in one direction. When the array can contain **negative numbers or zeros**, that guarantee disappears. The tool that still works is a **prefix sum combined with a hash map**. It is one of the most useful ideas for medium-level interview problems.

## The key observation

Let `prefix[j]` be the sum of the first `j` elements. The sum of a subarray from `i` to `j - 1` is:

```
sum(i..j-1) = prefix[j] - prefix[i]
```

If you want that to equal `k`, you need `prefix[i] = prefix[j] - k`. So when you stand at position `j`, the question becomes: **how many earlier prefix sums equal `prefix[j] - k`?** A hash map answers that in `O(1)`.

## Subarray Sum Equals K

```ts
function subarraySum(nums: number[], k: number): number {
  const seen = new Map<number, number>([[0, 1]]); // prefix sum -> how many times
  let prefix = 0;
  let count = 0;
  for (const value of nums) {
    prefix += value;
    count += seen.get(prefix - k) ?? 0;
    seen.set(prefix, (seen.get(prefix) ?? 0) + 1);
  }
  return count;
}
```

Why the map starts with `0 → 1`: the empty prefix has sum 0. It lets subarrays that start at index 0 be counted, because for them `prefix[j] - k = 0`.

Why you look up **before** you insert the current prefix: with `k = 0`, inserting first would make every position match itself and count an empty subarray.

## Dry run

`nums = [1, 2, 3]`, `k = 3`:

| Value | prefix | look up (prefix - k) | count | map after |
| --- | --- | --- | --- | --- |
| start | 0 | | 0 | {0: 1} |
| 1 | 1 | -2 → 0 | 0 | {0: 1, 1: 1} |
| 2 | 3 | 0 → 1 | 1 | {0: 1, 1: 1, 3: 1} |
| 3 | 6 | 3 → 1 | 2 | {0: 1, 1: 1, 3: 1, 6: 1} |

The subarrays are `[1, 2]` and `[3]`. The answer is 2.

## Variation: longest subarray with sum k

Store the **first index** where each prefix sum appears, and do not overwrite it. At each position, if `prefix - k` exists, the length is `j - firstIndex`.

```ts
function longestSubarrayWithSum(nums: number[], k: number): number {
  const first = new Map<number, number>([[0, -1]]);
  let prefix = 0;
  let best = 0;
  for (let i = 0; i < nums.length; i++) {
    prefix += nums[i];
    const start = first.get(prefix - k);
    if (start !== undefined) best = Math.max(best, i - start);
    if (!first.has(prefix)) first.set(prefix, i);
  }
  return best;
}
```

## Variation: divisible by k

Two prefix sums with the same **remainder** modulo `k` mean the subarray between them is divisible by `k`. Count remainders in a map. In JavaScript the `%` operator can return a negative result, so normalise it: `((x % k) + k) % k`.

## Variation: equal numbers of 0s and 1s

Replace every `0` with `-1`. A subarray with equal counts now has sum 0, which is the "longest subarray with sum 0" problem above.

## Complexity

| | Time | Space |
| --- | --- | --- |
| Prefix sum + hash map | O(n) | O(n) |

## Common mistakes

- Forgetting the seed entry `0 → 1` (or `0 → -1` for the longest version).
- Inserting the current prefix before looking up the matching one.
- Using a sliding window even though the array has negative numbers.
- Overwriting the first index when you want the **longest** subarray.
- Not normalising negative remainders.

## Practice

Solve **Subarray Sum Equals K**. After you pass the tests, change the code to return the length of the longest such subarray, and test it on `[1, -1, 5, -2, 3]` with `k = 3` (the answer is 4).

## Recap

- `sum(i..j-1) = prefix[j] - prefix[i]`. You need an earlier prefix equal to `prefix[j] - k`.
- Keep a map of prefix sums seen so far, seeded with the empty prefix.
- Look up before you insert.
- This handles negatives and zeros, unlike a sliding window.
