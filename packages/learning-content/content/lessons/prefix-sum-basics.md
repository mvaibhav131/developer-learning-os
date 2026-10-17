---
summary: Answer range-sum questions in constant time after one pass. Build prefix sums, use the prefix[r + 1] - prefix[l] formula, find balance points, and use prefix and suffix products without division.
tags: [prefix-sum, range-query, arrays, suffix-product, cumulative]
videos: [yuws7YK0Yng, qmlrMrIObvs, bNvIQI2wAjk]
---

Imagine you must answer thousands of questions like "what is the sum of the numbers from index 3 to index 9?". Adding the numbers each time costs `O(n)` per question. A **prefix sum** array does the work once, up front, so each question takes `O(1)`.

## The idea

`prefix[i]` stores the sum of the **first `i` elements**. It has `n + 1` entries and starts with `prefix[0] = 0`.

```ts
function buildPrefix(nums: number[]): number[] {
  const prefix = new Array<number>(nums.length + 1).fill(0);
  for (let i = 0; i < nums.length; i++) {
    prefix[i + 1] = prefix[i] + nums[i];
  }
  return prefix;
}
```

For `nums = [3, 1, 4, 1, 5]` the prefix array is `[0, 3, 4, 8, 9, 14]`.

## Range sum in O(1)

The sum of `nums[l..r]` (both inclusive) is everything up to `r` minus everything before `l`:

```ts
const rangeSum = (prefix: number[], l: number, r: number): number => prefix[r + 1] - prefix[l];
```

Check: sum of indexes 1 to 3 is `prefix[4] - prefix[1] = 9 - 3 = 6`, and indeed `1 + 4 + 1 = 6`.

Having a leading `0` in `prefix` removes the special case for ranges that start at index 0.

| Step | Cost |
| --- | --- |
| Build the prefix array | O(n) time, O(n) space |
| Each range query | O(1) |

## Example: find pivot index

The pivot index has equal sums on its left and right. You do not need a whole array: keep the total and a running left sum.

```ts
function pivotIndex(nums: number[]): number {
  const total = nums.reduce((sum, value) => sum + value, 0);
  let leftSum = 0;
  for (let i = 0; i < nums.length; i++) {
    if (leftSum === total - leftSum - nums[i]) return i;
    leftSum += nums[i];
  }
  return -1;
}
```

At index `i`, the right sum is `total - leftSum - nums[i]`.

## Prefix and suffix products

The same idea works for **products**. For **Product of Array Except Self**, `answer[i]` equals the product of everything to the left of `i` times everything to the right. Without division:

1. Pass left to right. `answer[i]` = product of all elements before `i`.
2. Pass right to left with a running product `right`. Multiply `answer[i]` by `right`, then update `right`.

```ts
function productExceptSelf(nums: number[]): number[] {
  const n = nums.length;
  const answer = new Array<number>(n).fill(1);
  let left = 1;
  for (let i = 0; i < n; i++) {
    answer[i] = left;
    left *= nums[i];
  }
  let right = 1;
  for (let i = n - 1; i >= 0; i--) {
    answer[i] *= right;
    right *= nums[i];
  }
  return answer;
}
```

Dividing the total product by `nums[i]` is tempting but fails when the array contains zeros.

## 2D prefix sums (preview)

For a grid, `prefix[r][c]` is the sum of the rectangle from the top-left corner to `(r - 1, c - 1)`. A sub-rectangle sum is then four lookups using inclusion and exclusion. The idea is the same: pay once to build, answer in `O(1)`.

## When to think "prefix sum"

- Many range-sum or range-count queries on a fixed array.
- "Everything to the left" and "everything to the right" appear in the statement.
- You compute the same partial sums repeatedly inside a loop.
- Subarray sums with a target (next lesson, with a hash map).

## Common mistakes

- Off-by-one: `prefix[r] - prefix[l]` is the range `[l, r)`, while `prefix[r + 1] - prefix[l]` is `[l, r]`. Pick one convention and write it in a comment.
- Forgetting the leading zero entry.
- Dividing by `nums[i]` for product problems.
- Updating the prefix array when the underlying array changes. Prefix sums suit **static** data.

## Practice

Solve **Find Pivot Index** and **Product of Array Except Self**. Then build the prefix array for `[2, 4, 6, 8]` by hand and answer three range queries without looking at the array.

## Recap

- `prefix[i + 1] = prefix[i] + nums[i]`, with `prefix[0] = 0`.
- Sum of `[l, r]` is `prefix[r + 1] - prefix[l]` in `O(1)`.
- Use running left sums to avoid storing a whole array when you can.
- Prefix and suffix products solve "everything except me" without division.
