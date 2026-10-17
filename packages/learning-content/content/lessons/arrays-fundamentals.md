---
summary: Understand how JavaScript arrays behave and what every operation costs. Learn iteration, in-place swapping, 2D grids, the sort gotcha and an edge-case checklist for array problems.
tags: [arrays, javascript, in-place, iteration, 2d-array]
videos: [BLIrBThPTXc, QxA-KB2lKgk, bAUMuuRH99o]
---

Arrays are the most common input in interviews. Before you learn clever patterns, you need to know **what an array operation really costs** and a handful of habits that prevent silly bugs. This lesson is the toolbox the later array, string and pointer lessons build on.

## How arrays behave in JavaScript

A JavaScript array is an ordered, zero-indexed list that can grow and shrink. Engines store arrays of numbers in contiguous memory, so reading `arr[i]` is a single step regardless of size. Growing is done by allocating a bigger buffer when needed, which is why `push` is **amortized O(1)**.

```ts
const nums = [4, 8, 15];
nums.push(16);      // [4, 8, 15, 16]  O(1) amortized
nums.pop();         // removes 16      O(1)
nums.unshift(1);    // [1, 4, 8, 15]   O(n): everything shifts right
nums.shift();       // removes 1       O(n): everything shifts left
```

## What each operation costs

| Operation | Time | Notes |
| --- | --- | --- |
| `arr[i]`, `arr.length` | O(1) | direct access |
| `push`, `pop` | O(1) amortized | work at the end |
| `shift`, `unshift` | O(n) | work at the front moves every element |
| `splice(i, k)` | O(n) | removes or inserts in the middle |
| `indexOf`, `includes`, `find` | O(n) | linear search |
| `slice`, `concat`, `[...arr]` | O(n) | creates a copy |
| `sort` | O(n log n) | in place, comparator required for numbers |

## Looping

```ts
for (let i = 0; i < arr.length; i++) { /* need the index */ }
for (const value of arr) { /* need only the value */ }
arr.forEach((value, i) => { /* cannot break or return early */ });
```

Use a classic `for` loop when you need the index, or when you must **stop early**. `return` inside `forEach` only leaves the callback, it does not stop the loop.

`map`, `filter` and `reduce` are clear for transforming data, but each creates a new array or value. In an interview, say the extra space out loud.

## In-place techniques

Interviewers often ask you to change the array **in place**, with `O(1)` extra space.

**Swap two elements**

```ts
[nums[i], nums[j]] = [nums[j], nums[i]];
```

**Overwrite with a write pointer.** Keep a position `write` where the next kept value belongs and copy forward.

```ts
function removeValue(nums: number[], target: number): number {
  let write = 0;
  for (const value of nums) {
    if (value !== target) nums[write++] = value;
  }
  return write; // new logical length
}
```

**Reverse in place** with two pointers that swap and move inwards.

```ts
function reverse(nums: number[]): void {
  for (let left = 0, right = nums.length - 1; left < right; left++, right--) {
    [nums[left], nums[right]] = [nums[right], nums[left]];
  }
}
```

## Two-dimensional arrays

Build a grid with a fresh row for each row:

```ts
const grid = Array.from({ length: rows }, () => Array<number>(cols).fill(0));
```

Do **not** write `Array(rows).fill(Array(cols).fill(0))`. That puts the **same row object** in every position, so changing one cell changes the whole column.

## The sort gotcha

`sort()` without a comparator sorts values **as strings**.

```ts
[10, 9, 1].sort();                 // [1, 10, 9]  (wrong for numbers)
[10, 9, 1].sort((a, b) => a - b);  // [1, 9, 10]
```

Always pass `(a, b) => a - b` for ascending numbers. `sort` changes the original array, so copy first with `[...arr]` if you need to keep it.

## Edge-case checklist

Before you submit, test your idea on:

1. an empty array
2. one element
3. all elements equal
4. negative numbers and zero
5. already sorted and reverse sorted input
6. very large values

## Practice

Open **Fizz Buzz** and **Missing Number**. They are short on purpose: use them to get comfortable with the editor, the tests and reading the statement. For each one, write down the time and space complexity of your solution.

## Recap

- Reading by index and working at the end are cheap. Working at the front or middle is O(n).
- Use index loops when you need early exit.
- Swap with destructuring, and use a write pointer for in-place filtering.
- Build grids with `Array.from`, and never forget the numeric comparator in `sort`.
