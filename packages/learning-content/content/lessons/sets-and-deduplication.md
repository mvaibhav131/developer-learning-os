---
summary: Use Set in JavaScript for membership checks, deduplication and the seen-before pattern. Learn set operations, the longest consecutive sequence trick and the pitfalls with objects, NaN and order.
tags: [hashing, set, deduplication, membership, seen-pattern]
videos: [3OamzN90kPg, W5q0xgxmRd8]
---

A **Set** is a collection of unique values with constant-time membership checks. When your question is only "have I seen this before?" or "is this value present?", a Set is simpler than a Map and communicates your idea clearly.

## Set basics

```ts
const seen = new Set<number>();
seen.add(3);
seen.add(3);          // ignored, still one copy
seen.has(3);          // true
seen.delete(3);
seen.size;            // 0

const unique = [...new Set([1, 2, 2, 3, 3, 3])]; // [1, 2, 3]
```

`add`, `has` and `delete` are `O(1)` on average. A Set remembers insertion order, so spreading it into an array keeps the first appearance of each value.

## Pattern 1: the "seen" check

Walk once, and stop as soon as you meet a value you have already seen.

```ts
function containsDuplicate(nums: number[]): boolean {
  const seen = new Set<number>();
  for (const value of nums) {
    if (seen.has(value)) return true;
    seen.add(value);
  }
  return false;
}
```

A shorter version compares sizes: `new Set(nums).size !== nums.length`. It is neat, but it always processes the whole array, while the loop version can stop early.

## Pattern 2: deduplicate while keeping order

```ts
const unique = [...new Set(items)];
```

For objects, keep a Set of an identifying key (such as `id`) instead of the objects themselves.

## Pattern 3: fast membership instead of `includes`

Searching an array with `includes` costs `O(n)`. If you will check many values, build a Set once and ask it:

```ts
const allowed = new Set(['read', 'write']);
function canDo(action: string): boolean {
  return allowed.has(action); // O(1) instead of O(n)
}
```

## Pattern 4: longest consecutive sequence

Given unsorted numbers, find the length of the longest run of consecutive integers (like 4, 5, 6, 7) in `O(n)`.

Idea: put every number in a Set. Only **start** counting from a number whose predecessor is not in the Set; that number is the beginning of a run. Then walk forward while the next number exists.

```ts
function longestConsecutive(nums: number[]): number {
  const set = new Set(nums);
  let best = 0;
  for (const value of set) {
    if (set.has(value - 1)) continue; // not the start of a run
    let length = 1;
    while (set.has(value + length)) length++;
    best = Math.max(best, length);
  }
  return best;
}
```

Each number is visited as the middle of a run at most once, so the total work is `O(n)`.

## Set operations

JavaScript does not need extra libraries for basics:

```ts
const a = new Set([1, 2, 3]);
const b = new Set([2, 3, 4]);
const union = new Set([...a, ...b]);                    // {1, 2, 3, 4}
const intersection = [...a].filter((x) => b.has(x));    // [2, 3]
const difference = [...a].filter((x) => !b.has(x));     // [1]
```

## Pitfalls

- Objects and arrays are compared **by reference**. `new Set([[1], [1]]).size` is 2.
- `NaN` equals `NaN` inside a Set, and `0` equals `-0`. This differs from `===` for `NaN`.
- Iterating a Set while adding to it can visit the new values.
- A Set stores values only. If you need an index or a count, use a Map.

## Choosing between Set and Map

| Need | Use |
| --- | --- |
| "Is it present?" | Set |
| "How many times?" or "where?" | Map |
| Unique list | Set, then spread to an array |

## Practice

Solve **Contains Duplicate** twice: first with the loop version, then with `new Set(nums).size`. Compare how they behave on an array whose first two values are equal. Then try to write `longestConsecutive` yourself without looking at the code.

## Recap

- A Set answers "have I seen it?" in `O(1)` average time.
- Deduplicate with `[...new Set(array)]`.
- Build a Set once instead of calling `includes` in a loop.
- Start from sequence beginnings to keep consecutive-run problems linear.
