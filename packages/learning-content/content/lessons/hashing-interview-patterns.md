---
summary: Turn slow nested searches into constant-time lookups. Solve the Two Sum family, anagram checks and grouping problems with one reusable hash-map pattern.
tags: [hashing, hash-map, two-sum, anagram, grouping]
videos: [KLlXCFG5TnA, vzdNOK2oB2E, W5q0xgxmRd8]
---

Most "find a pair", "have I seen this before" and "group the similar things" questions have an obvious slow answer: loop inside a loop. A hash map turns the inner loop into a single lookup, so the whole solution drops from O(n²) to O(n). This lesson teaches the three shapes that cover most interview questions.

## The core trade

A `Map` (or a plain object) answers "is this key present, and what did I store for it?" in **constant time on average**. You pay for that speed with extra memory.

| Approach | Time | Extra space |
| --- | --- | --- |
| Check every pair (nested loops) | O(n²) | O(1) |
| Remember what you have seen in a `Map` | O(n) | O(n) |

> **Rule of thumb:** whenever your inner loop only asks "does some value exist?", replace the loop with a hash lookup.

## Shape 1: complement lookup (Two Sum)

Problem: given `nums` and a `target`, return the indices of two numbers that add up to `target`.

For each number `x`, the partner you need is `target - x`. Instead of searching for it, look it up in a map of numbers you have already passed.

```ts
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    const j = seen.get(need);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}
```

Walk through `nums = [2, 7, 11, 15]`, `target = 9`:

1. `i = 0`, value 2. Need 7. Map is empty, so store `2 -> 0`.
2. `i = 1`, value 7. Need 2. The map has it at index 0, so return `[0, 1]`.

Two details that trip people up:

- **Check before you store.** If you store first, a number can pair with itself (for example `[3, 2, 4]` with target 6 would wrongly return the same index twice).
- **Use `!== undefined`, not truthiness.** Index `0` is falsy, so `if (seen.get(need))` silently fails for the first element.

## Shape 2: frequency signature (anagrams)

Two words are anagrams when they contain the same letters the same number of times. Count the letters of one word, then subtract while scanning the other.

```ts
function isAnagram(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const counts = new Map<string, number>();
  for (const ch of a) counts.set(ch, (counts.get(ch) ?? 0) + 1);
  for (const ch of b) {
    const left = counts.get(ch);
    if (!left) return false; // missing or already used up
    counts.set(ch, left - 1);
  }
  return true;
}
```

This is O(n) time. Sorting both strings also works and is simpler to write, but it costs O(n log n).

## Shape 3: grouping by a key (Group Anagrams)

Sometimes you need many things with the same "shape" in one bucket. Compute a **canonical key** for each item and use it as the map key. Items that share a key belong together.

For anagrams, a good key is the sorted letters: `"eat"`, `"tea"` and `"ate"` all become `"aet"`.

```ts
function groupAnagrams(words: string[]): string[][] {
  const groups = new Map<string, string[]>();
  for (const word of words) {
    const key = [...word].sort().join('');
    const bucket = groups.get(key);
    if (bucket) bucket.push(word);
    else groups.set(key, [word]);
  }
  return [...groups.values()];
}
```

If the words are long, build the key from a 26-slot count array instead of sorting. It brings each key down to O(length).

## Choosing the right key

The whole skill is picking a key that is **identical for things you want together and different otherwise**.

| Question | Key to use |
| --- | --- |
| Pair that sums to a target | the number you still need (`target - x`) |
| Same letters, any order | sorted letters or a letter-count signature |
| Same pattern (`"abb"` and `"xyy"`) | first-occurrence index of each character |
| Subarray with a given sum | running prefix sum (see the prefix-sum lessons) |

## Common mistakes

- Using an object as a map and forgetting that keys become strings (`1` and `"1"` collide).
- Mutating the array while iterating it.
- Forgetting the empty-input case (`[]`, `""`).
- Assuming O(1) is guaranteed. Lookups are O(1) **on average**, and a pathological set of keys can degrade them. In interviews you can state "average O(1)" and move on.

## Complexity checklist

- **Time:** one pass with O(1) work per item gives O(n). Sorting inside the loop adds a log factor per item.
- **Space:** the map can hold up to n entries, so O(n). Say this out loud; interviewers expect you to name the trade.

## Practice

Do these in order. Try each one yourself for at least 15 minutes before opening a hint.

1. Two Sum (complement lookup)
2. Valid Anagram (frequency signature)
3. Group Anagrams (canonical key)

When all three feel easy, move on to prefix sums with hash maps, which reuse exactly the same idea.
