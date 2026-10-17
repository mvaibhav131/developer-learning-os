---
summary: Master Map and frequency counting in JavaScript. Counting, complements, last-seen indexes, grouping and top-K with buckets, plus the Map versus object trap and hash map complexity.
tags: [hashing, hashmap, map, frequency-counting, top-k]
videos: [KEs5UyBJ39g, W5q0xgxmRd8, YPTqKIgVk-k]
---

A **hash map** stores key-value pairs and finds a key in constant time on average. It is the most useful data structure in interviews, because it replaces an inner loop ("search for it") with a lookup ("ask for it"). This lesson shows how to use JavaScript's `Map` well and the four ways hash maps are used.

## Map basics

```ts
const ages = new Map<string, number>();
ages.set('asha', 30);       // add or overwrite
ages.get('asha');           // 30
ages.get('ravi');           // undefined
ages.has('asha');           // true
ages.delete('asha');
ages.size;                  // number of entries

for (const [name, age] of ages) { /* iterates in insertion order */ }
```

All of `get`, `set`, `has` and `delete` are `O(1)` on average.

## Map or plain object?

| | `Map` | `{}` object |
| --- | --- | --- |
| Key types | anything, including numbers and objects | strings and symbols only |
| Order | insertion order | mostly insertion order, but integer-like keys come first |
| Size | `map.size` | `Object.keys(obj).length` |
| Danger | none | keys like `constructor` or `__proto__` can clash |

Prefer `Map` in interviews. If you use an object, create it with `Object.create(null)` or remember that numeric keys become strings.

## Use 1: counting (frequency map)

```ts
function frequencies(items: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  return counts;
}
```

`(counts.get(item) ?? 0) + 1` is the idiom for "increment, starting at zero".

## Use 2: complement lookup

When you need two values that fit together, look for the partner instead of searching:

```ts
function twoSum(nums: number[], target: number): number[] {
  const seen = new Map<number, number>(); // value -> index
  for (let i = 0; i < nums.length; i++) {
    const j = seen.get(target - nums[i]);
    if (j !== undefined) return [j, i];
    seen.set(nums[i], i);
  }
  return [];
}
```

## Use 3: remember the last position

Store the index where you last saw a value. This is used by sliding windows to jump the left edge forward (see Longest Substring Without Repeating Characters).

## Use 4: grouping

```ts
function groupByLength(words: string[]): Map<number, string[]> {
  const groups = new Map<number, string[]>();
  for (const word of words) {
    const bucket = groups.get(word.length);
    if (bucket) bucket.push(word);
    else groups.set(word.length, [word]);
  }
  return groups;
}
```

## Top K frequent: counting plus buckets

To find the `k` most frequent values without sorting, count first, then place each value in a bucket indexed by its count. A value can appear at most `n` times, so you need `n + 1` buckets. Read from the largest bucket down until you have `k` values. This gives `O(n)` time.

## Fixed alphabet: use an array

If the keys are only lowercase letters, `new Array(26).fill(0)` is simpler and faster than a Map. State the reason in the interview: "the alphabet is fixed, so the space is `O(1)`."

## Complexity

| | Time | Space |
| --- | --- | --- |
| Build a frequency map | O(n) | O(k), where k is the number of distinct keys |
| Lookup, insert, delete | O(1) average | |
| Worst case (many collisions) | O(n) per operation | rare, ignore in interviews unless asked |

## Common mistakes

- Using `if (map.get(x))` when the value can be `0`. Use `map.has(x)` or compare to `undefined`.
- Using an object as a map and being surprised that `1` and `"1"` are the same key.
- Storing a value before you look up its partner, so an element pairs with itself.
- Forgetting that arrays and objects used as Map keys are compared by reference, not by contents.

## Practice

Solve **First Unique Character in a String** (count, then scan) and **Top K Frequent Elements** (count, then bucket). Then re-read **Two Sum** and notice how the same Map turns a nested loop into one pass.

## Recap

- A hash map replaces searching with an O(1) average lookup.
- Four uses: counting, complements, last position, grouping.
- Prefer Map over a plain object.
- For a fixed alphabet use a 26-slot array.
