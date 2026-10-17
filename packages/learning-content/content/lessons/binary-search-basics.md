---
summary: Learn binary search the reliable way. Two templates, exact match and lower bound, the invariant that prevents off-by-one bugs, and applications such as insert position and rotated arrays.
tags: [binary-search, sorted-array, lower-bound, invariants, rotated-array]
videos: [s4DPM8ct1pI, MHf6awe89xw, YJeoQBevNVo]
---

Binary search finds a value in a **sorted** array in `O(log n)` time by repeatedly cutting the search range in half. A million elements need about 20 steps. The idea is simple, the bugs are not: off-by-one errors and infinite loops are the classic ways to fail. The cure is to choose one template and always state its **invariant**, the fact that stays true at every step.

## Template 1: find an exact value (closed range)

Invariant: if the target exists, it lies inside `[left, right]`, both ends included.

```ts
function search(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length - 1;
  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] === target) return mid;
    if (nums[mid] < target) left = mid + 1;   // target is to the right
    else right = mid - 1;                      // target is to the left
  }
  return -1;
}
```

The loop runs while the range is non-empty (`left <= right`). Each step removes `mid`, so the range always shrinks and the loop always ends.

## Template 2: lower bound (half-open range)

A **lower bound** is the first index whose value is **greater than or equal** to the target. This template is more general. It finds insert positions, first occurrences and many "first index where a condition becomes true" questions.

Invariant: the answer lies in `[left, right]`, where `right` may equal `nums.length` (meaning "not found").

```ts
function lowerBound(nums: number[], target: number): number {
  let left = 0;
  let right = nums.length;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] < target) left = mid + 1;
    else right = mid; // mid might be the answer, so keep it
  }
  return left;
}
```

Using it:

| Question | Code |
| --- | --- |
| Where would `x` be inserted? | `lowerBound(nums, x)` |
| Is `x` present? | `i = lowerBound(nums, x); i < n && nums[i] === x` |
| First occurrence of `x` | the same `i` |
| Last occurrence of `x` | `lowerBound(nums, x + 1) - 1` (for integers) |

## Computing mid

Use `left + Math.floor((right - left) / 2)`. In JavaScript the sum cannot overflow for normal array sizes, but this form is safe in every language and is what interviewers expect.

## Why loops hang

The most common bug is a loop that never ends. With `while (left < right)`, if you write `right = mid` and `mid` can equal `left`, you must use `left = mid + 1` (not `left = mid`) on the other side. Check that **each branch makes the range smaller**.

## Application: rotated sorted array

A sorted array rotated at some point, like `[4, 5, 6, 7, 0, 1, 2]`, is two sorted pieces. To find the minimum, compare `nums[mid]` with `nums[right]`:

```ts
function findMin(nums: number[]): number {
  let left = 0;
  let right = nums.length - 1;
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (nums[mid] > nums[right]) left = mid + 1; // the drop is on the right
    else right = mid;                              // mid could be the minimum
  }
  return nums[left];
}
```

## When to think "binary search"

- The array is sorted, or sorted after a transformation.
- The statement asks for `O(log n)`.
- You can answer a yes/no question about the middle, and the answer tells you which half to keep.
- You are looking for the **first** or **last** position where something becomes true.

## Checklist before you code

1. What is the search range, and is the right end inclusive or excluded?
2. What is the invariant?
3. What does each branch do to `left` and `right`, and does the range always shrink?
4. What happens with 0, 1 and 2 elements?

## Practice

Solve **Binary Search**, **Search Insert Position** and **Find Minimum in Rotated Sorted Array**. For the second, use the lower-bound template. Write the invariant in a comment before you start each solution.

## Recap

- Binary search halves a sorted range in `O(log n)` time.
- Template 1 is for exact matches, template 2 (lower bound) is for first positions.
- State the invariant, and check that every branch shrinks the range.
- Rotated arrays: compare `mid` with `right` to see where the drop is.
