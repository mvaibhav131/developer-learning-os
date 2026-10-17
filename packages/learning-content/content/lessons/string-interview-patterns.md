---
summary: The patterns behind most string interview questions. Compare from both ends, count with a frequency table, slide a window, expand around a centre and find a common prefix, with complete code.
tags: [strings, patterns, palindrome, frequency, sliding-window]
videos: [XYQecbcd6_c, wiGpQwVHdE0, 9UtInBqnCgA]
---

String problems repeat a handful of patterns. Learn to recognise them from the wording of the question, and most interview strings become routine. This lesson gives you the patterns, a template for each and the mistakes to avoid.

## The pattern catalog

| The problem sounds like | Pattern |
| --- | --- |
| palindrome, reverse, "from both ends" | two pointers |
| anagram, "same letters", first unique | frequency table |
| "longest substring such that..." | sliding window |
| longest palindromic substring | expand around the centre |
| common prefix, "match up to" | scan column by column |
| group similar words | canonical key in a hash map |
| parse numbers or tokens | single pass with a state variable |

## Pattern 1: two pointers from both ends

Place one pointer at each end and move inwards. Skip characters you do not care about.

```ts
function isPalindrome(s: string): boolean {
  let left = 0;
  let right = s.length - 1;
  while (left < right) {
    while (left < right && !/[a-z0-9]/i.test(s[left])) left++;
    while (left < right && !/[a-z0-9]/i.test(s[right])) right--;
    if (s[left].toLowerCase() !== s[right].toLowerCase()) return false;
    left++;
    right--;
  }
  return true;
}
```

No new string is created, so the extra space is `O(1)`.

## Pattern 2: frequency table

Count characters, then compare or look for a count. With lowercase letters, a 26-slot array is simple and fast.

```ts
function firstUniqChar(s: string): number {
  const counts = new Array<number>(26).fill(0);
  for (const ch of s) counts[ch.charCodeAt(0) - 97]++;
  for (let i = 0; i < s.length; i++) {
    if (counts[s.charCodeAt(i) - 97] === 1) return i;
  }
  return -1;
}
```

Two passes: one to count, one to find the answer in the original order.

## Pattern 3: sliding window

For "longest substring with a property", keep a window `[left, right]` and a record of what is inside it. Move `right` forward, and move `left` forward when the window breaks the rule. See **Longest Substring Without Repeating Characters** and the sliding-window lessons for the full template.

## Pattern 4: expand around the centre

Every palindrome has a centre. There are `2n - 1` centres: each character, and each gap between two characters. Expand outwards while the two ends match.

```ts
function countPalindromes(s: string): number {
  let count = 0;
  const expand = (left: number, right: number): void => {
    while (left >= 0 && right < s.length && s[left] === s[right]) {
      count++;
      left--;
      right++;
    }
  };
  for (let centre = 0; centre < s.length; centre++) {
    expand(centre, centre);     // odd length
    expand(centre, centre + 1); // even length
  }
  return count;
}
```

Time `O(n²)` in the worst case, space `O(1)`.

## Pattern 5: column by column

For **Longest Common Prefix**, use the first word as a reference. For each column check that every other word has the same character. Stop at the first mismatch or when a word ends.

## Pattern 6: canonical key

To group words that are rearrangements of each other, give every word a key that is the same for the whole group, such as its sorted letters, and use it as a map key. This is the idea behind Group Anagrams.

## Common mistakes

- Ignoring uppercase, spaces or punctuation that the problem tells you to skip.
- Building a new reversed string when two pointers would do.
- Slicing in a loop: `s.slice(i)` is `O(n)` each time.
- Forgetting the empty string and the one-character string.
- Using `<=` where `<` is correct in the pointer loop.

## Practice

Solve **Longest Common Prefix**, **First Unique Character in a String** and **Longest Substring Without Repeating Characters**. For each, name the pattern before you write code.

## Recap

- Match the wording to a pattern: two pointers, frequency table, window, centre expansion, column scan, canonical key.
- Avoid creating new strings inside loops.
- Test the empty string, one character and repeated characters.
