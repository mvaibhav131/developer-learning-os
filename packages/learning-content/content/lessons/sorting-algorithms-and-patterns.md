---
summary: Understand the main sorting algorithms and the interview patterns built on sorting. Cost and stability of each algorithm, correct JavaScript sort calls, merge sort, quick sort, intervals and the Dutch flag.
tags: [sorting, merge-sort, quick-sort, comparator, intervals, dutch-flag]
videos: [tWCaFVJMUi8, cQDtOBTy7_Y, 8MNB0Mba_Dc]
---

Sorting appears in two ways in interviews: you are asked to **implement** a sorting algorithm, or you use sorting as a **first step** that makes a problem easy. You need both skills. This lesson covers the algorithms, their costs and the patterns that start with a sort.

## The algorithms at a glance

| Algorithm | Best | Average | Worst | Extra space | Stable |
| --- | --- | --- | --- | --- | --- |
| Bubble, insertion, selection | O(n) for insertion on sorted data | O(n²) | O(n²) | O(1) | bubble and insertion: yes, selection: no |
| Merge sort | O(n log n) | O(n log n) | O(n log n) | O(n) | yes |
| Quick sort | O(n log n) | O(n log n) | O(n²) | O(log n) stack | no |
| Counting sort | O(n + k) | O(n + k) | O(n + k) | O(k) | yes |

A sort is **stable** if equal elements keep their original relative order. This matters when you sort objects by one field and then by another.

## Sorting in JavaScript

`Array.prototype.sort` sorts **in place** and, in modern engines, is **stable** and runs in `O(n log n)`.

```ts
const nums = [10, 9, 1];
nums.sort();                    // [1, 10, 9]  WRONG: sorts as strings
nums.sort((a, b) => a - b);     // [1, 9, 10]  ascending
nums.sort((a, b) => b - a);     // [10, 9, 1]  descending

const people = [{ name: 'Asha', age: 30 }, { name: 'Ravi', age: 25 }];
people.sort((a, b) => a.age - b.age);              // by age
words.sort((a, b) => a.localeCompare(b));          // alphabetical text
```

A comparator returns a **negative number** if `a` goes first, **positive** if `b` goes first, and **0** if they are equal. Returning a boolean does not work reliably. Copy first (`[...nums].sort(...)`) when you must not change the input.

## Merge sort

Divide the array in halves, sort each half recursively, and **merge** two sorted halves in linear time.

```ts
function mergeSort(nums: number[]): number[] {
  if (nums.length <= 1) return nums;
  const mid = Math.floor(nums.length / 2);
  const left = mergeSort(nums.slice(0, mid));
  const right = mergeSort(nums.slice(mid));
  const merged: number[] = [];
  let i = 0;
  let j = 0;
  while (i < left.length && j < right.length) {
    merged.push(left[i] <= right[j] ? left[i++] : right[j++]);
  }
  while (i < left.length) merged.push(left[i++]);
  while (j < right.length) merged.push(right[j++]);
  return merged;
}
```

Using `<=` when the values are equal takes the left element first, which keeps the sort stable.

## Quick sort

Choose a **pivot**, partition the array so smaller values are before it and larger values after it, then sort the two sides.

```ts
function quickSort(nums: number[], low = 0, high = nums.length - 1): void {
  if (low >= high) return;
  const pivot = nums[high];
  let boundary = low;
  for (let i = low; i < high; i++) {
    if (nums[i] < pivot) {
      [nums[boundary], nums[i]] = [nums[i], nums[boundary]];
      boundary++;
    }
  }
  [nums[boundary], nums[high]] = [nums[high], nums[boundary]];
  quickSort(nums, low, boundary - 1);
  quickSort(nums, boundary + 1, high);
}
```

On already sorted input with the last element as pivot, this degrades to `O(n²)`. Choosing a **random pivot** makes that very unlikely.

## Pattern: sort first, then scan

| Problem | What sorting gives you |
| --- | --- |
| Contains duplicate, group equal items | equal values become neighbours |
| 3Sum, Two Sum on sorted data | two pointers become possible |
| Merge intervals, meeting rooms | overlapping intervals become adjacent |
| Closest pair, minimum difference | the answer is between neighbours |

**Merge Intervals**: sort by start. Then each interval either overlaps the last merged one (extend its end with `Math.max`) or starts a new one.

## Pattern: Dutch national flag

For values from a tiny set, like `0`, `1`, `2`, you can sort in **one pass** with three pointers instead of an `O(n log n)` sort. Everything before `low` is 0, everything after `high` is 2, and `mid` scans the unknown middle: swap 0s to the front, 2s to the back, and skip 1s. See **Sort Colors**.

## Pattern: counting and bucketing

When values lie in a small range, counting beats comparison sorting. Count how many times each value occurs, then rebuild the array. This runs in `O(n + k)` where `k` is the range.

## Common mistakes

- Using `sort()` without a comparator on numbers.
- Sorting the original array when the problem forbids changing it.
- A comparator that subtracts huge numbers or `Infinity`, which can give `NaN`.
- Forgetting that sorting costs `O(n log n)`, so the total complexity cannot be better than that.
- Not copying arrays in recursive merge sorts and mixing indexes.

## Practice

Solve **Merge Intervals** and **Sort Colors**. After that, implement `mergeSort` from memory and use it to sort `[5, 2, 9, 1, 5, 6]`.

## Recap

- Use `arr.sort((a, b) => a - b)`. It is stable and `O(n log n)`.
- Merge sort is stable with O(n) space. Quick sort is in place with O(n log n) on average.
- Many problems become easy after sorting: pairs, duplicates and intervals.
- With a tiny set of values, a single-pass partition beats a general sort.
