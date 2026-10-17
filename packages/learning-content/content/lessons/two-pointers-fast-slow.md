---
summary: Use a slow writer and a fast reader pointer moving in the same direction to filter, partition and compact arrays in place, match subsequences, and detect cycles with the tortoise and hare idea.
tags: [two-pointers, in-place, partition, subsequence, fast-slow]
videos: [aayNRwUN3Do, DEJAZBq0FDA, gBTe7lFR3vc]
---

In this version of two pointers, both pointers start at the beginning and move in the **same direction** at **different speeds**. One pointer reads ahead and decides, the other pointer marks where the next good value should be written. It lets you rewrite an array **in place** in a single pass.

## Pattern A: read pointer and write pointer

The **fast** pointer `read` visits every element. The **slow** pointer `write` marks the next position of the result. Whenever `read` finds a value worth keeping, copy it to `write` and advance `write`.

```ts
function moveZeroes(nums: number[]): void {
  let write = 0;
  for (let read = 0; read < nums.length; read++) {
    if (nums[read] !== 0) {
      nums[write] = nums[read];
      write++;
    }
  }
  while (write < nums.length) {
    nums[write] = 0;
    write++;
  }
}
```

Invariant: everything before `write` is the finished result so far. The same skeleton solves many problems:

| Problem | Keep when... |
| --- | --- |
| Move Zeroes | the value is not zero |
| Remove Element | the value is not the target |
| Remove Duplicates from a sorted array | the value differs from the previous kept value |

Remove duplicates from a sorted array:

```ts
function removeDuplicates(nums: number[]): number {
  if (nums.length === 0) return 0;
  let write = 1;
  for (let read = 1; read < nums.length; read++) {
    if (nums[read] !== nums[write - 1]) {
      nums[write] = nums[read];
      write++;
    }
  }
  return write; // length of the unique prefix
}
```

## Pattern B: partitioning with a boundary

Sometimes the slow pointer marks a **boundary** between two groups. Elements before the boundary belong to the first group. Swap each qualifying element to the boundary. For example, to move all negative numbers to the front:

```ts
function negativesFirst(nums: number[]): void {
  let boundary = 0;
  for (let i = 0; i < nums.length; i++) {
    if (nums[i] < 0) {
      [nums[boundary], nums[i]] = [nums[i], nums[boundary]];
      boundary++;
    }
  }
}
```

## Pattern C: matching a subsequence

To test whether `s` is a subsequence of `t`, scan `t` with the fast pointer and advance a slow pointer in `s` only when the characters match:

```ts
function isSubsequence(s: string, t: string): boolean {
  let i = 0;
  for (let j = 0; j < t.length && i < s.length; j++) {
    if (s[i] === t[j]) i++;
  }
  return i === s.length;
}
```

## Pattern D: fast and slow on a linked list (tortoise and hare)

On a linked list you cannot index, but two pointers that move at different speeds still help:

- **Cycle detection:** move `slow` by one step and `fast` by two. If there is a cycle, `fast` eventually catches up with `slow`. If `fast` reaches `null`, there is no cycle.
- **Middle of the list:** when `fast` reaches the end, `slow` is at the middle.

```ts
function hasCycle(head: ListNode | null): boolean {
  let slow = head;
  let fast = head;
  while (fast && fast.next) {
    slow = slow!.next;
    fast = fast.next.next;
    if (slow === fast) return true;
  }
  return false;
}
```

It uses `O(1)` space, unlike storing visited nodes in a Set.

## Common mistakes

- Overwriting values that the read pointer has not looked at yet (this cannot happen if `write <= read`).
- Forgetting to fill the remaining positions (for example with zeros) or to return the new length when required.
- Using a second array when the problem asks for `O(1)` extra space.
- In linked lists, dereferencing `fast.next.next` without checking `fast` and `fast.next` first.

## Practice

Solve **Move Zeroes** and **Is Subsequence**. Then, without looking at the code above, write a function that removes all occurrences of a value from an array in place and returns the new length.

## Recap

- Read pointer = fast and visits everything. Write pointer = slow and marks the result.
- Same skeleton: Move Zeroes, Remove Element, Remove Duplicates.
- A subsequence is checked by advancing the pattern pointer only on a match.
- Tortoise and hare finds cycles and middles using `O(1)` space.
