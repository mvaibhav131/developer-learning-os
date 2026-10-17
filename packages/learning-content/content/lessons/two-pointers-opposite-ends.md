---
summary: Solve pair, palindrome and range problems by placing one pointer at each end and moving inwards. Learn the template, why moving a pointer is safe, and how 3Sum and Container With Most Water follow from it.
tags: [two-pointers, sorted-array, palindrome, three-sum, greedy]
videos: [QzZ7nmouLTI, B2L4mAglJZA, UuiTKBwPgAo, jJXJ16kPFWg]
---

The **opposite-ends two-pointer** technique puts one pointer at the start and one at the end, and moves them towards each other. Each step throws away part of the search space for good, so a scan that looks like `O(n²)` becomes `O(n)`. It works best when the data is **sorted**, or when the problem is naturally symmetric, like a palindrome.

## When to use it

| The problem has... | Example |
| --- | --- |
| a sorted array and a target sum | Two Sum II |
| symmetry, mirror or "from both ends" | Valid Palindrome |
| a value that depends on the distance between two positions | Container With Most Water |
| "find all triplets or quadruplets" | 3Sum (fix one, use two pointers for the rest) |

## The template

```ts
let left = 0;
let right = nums.length - 1;
while (left < right) {
  // look at nums[left] and nums[right]
  // decide which pointer to move
}
```

Use `left < right` when the two pointers must be different elements. If you use `<=`, one element may pair with itself.

## Why moving a pointer is safe

In a sorted array looking for a pair that sums to `target`:

- If `nums[left] + nums[right]` is **too small**, then `nums[left]` can never work with any value at or before `right` (those are not larger than `nums[right]`). So `left` can safely move right.
- If it is **too large**, then `nums[right]` cannot work with any value at or after `left`. So `right` can move left.

Every move proves that one element cannot be part of the answer. That is the argument to say in an interview.

## Two Sum on a sorted array

```ts
function twoSumSorted(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;
  while (left < right) {
    const sum = numbers[left] + numbers[right];
    if (sum === target) return [left + 1, right + 1];
    if (sum < target) left++;
    else right--;
  }
  return [];
}
```

`O(n)` time and `O(1)` space, better than the hash map version because it needs no extra memory.

## Container With Most Water

The area is `width × min(height[left], height[right])`. Start with the widest container. The shorter wall limits the height, so keeping it while shrinking the width can only get worse. The only chance to improve is to move the pointer at the **shorter** wall.

```ts
function maxArea(height: number[]): number {
  let left = 0;
  let right = height.length - 1;
  let best = 0;
  while (left < right) {
    best = Math.max(best, (right - left) * Math.min(height[left], height[right]));
    if (height[left] < height[right]) left++;
    else right--;
  }
  return best;
}
```

## 3Sum: fix one, two pointers for the rest

Sort the array. For each index `i`, find pairs in the remaining part that add up to `-nums[i]` using the Two Sum II pointers. Skip equal neighbours so that duplicate triplets are not produced:

1. Skip `i` when `nums[i] === nums[i - 1]`.
2. After you record a triplet, move both pointers and skip equal values on both sides.

The total time is `O(n log n)` for sorting plus `O(n²)` for the scans, so `O(n²)`.

## Palindromes

Compare `s[left]` with `s[right]` and move both inwards. If you need to ignore punctuation or case, skip characters inside the loop. See **Valid Palindrome**.

## Common mistakes

- Using this technique on **unsorted** data when the problem needs sorted order. Sort first, or use a hash map.
- Using `<=` instead of `<` in the loop condition.
- Moving the wrong pointer (for Container With Most Water, always the shorter wall).
- Not skipping duplicates in 3Sum, which creates repeated triplets.
- Returning 0-based positions when the problem asks for 1-based.

## Practice

Solve **Valid Palindrome**, **Two Sum II - Sorted Input**, **Container With Most Water** and **3Sum** in that order. For each, explain why moving a pointer cannot lose the answer.

## Recap

- Opposite-ends pointers shrink the search space one element at a time.
- It needs sorted data or symmetry.
- Prove each move: the discarded element cannot be part of the answer.
- 3Sum is "sort, fix one, two pointers" with careful duplicate skipping.
