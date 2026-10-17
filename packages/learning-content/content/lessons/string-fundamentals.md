---
summary: Know how JavaScript strings work before you solve string problems. Immutability, indexing, character codes, building strings efficiently, Unicode pitfalls and the cost of common string operations.
tags: [strings, javascript, immutability, char-codes, unicode]
videos: [jJXJ16kPFWg, XYQecbcd6_c]
---

Strings look simple, but a few facts about how they behave decide whether your solution is correct and fast. This lesson covers the rules you need before you move on to string patterns.

## Strings are immutable

You cannot change a character inside an existing string. Every "change" creates a new string.

```ts
let word = 'cat';
word[0] = 'b';        // does nothing (throws in strict mode)
word = 'b' + word.slice(1); // builds a new string: 'bat'
```

If you need to modify characters, convert to an array, change it, and join it back:

```ts
const chars = [...'hello'];
chars[0] = 'H';
const result = chars.join(''); // 'Hello'
```

## Reading characters

```ts
const s = 'interview';
s.length;            // 9
s[0];                // 'i'
s.charAt(3);         // 'e'
s.at(-1);            // 'w' (last character)
s[99];               // undefined (no error!)
```

Indexing past the end returns `undefined`, not an error. Always check bounds yourself.

## Character codes

Computers store characters as numbers. You will use this to count letters.

```ts
'a'.charCodeAt(0);              // 97
String.fromCharCode(98);        // 'b'
const index = ch.charCodeAt(0) - 'a'.charCodeAt(0); // 0 to 25
```

A **frequency array** of 26 numbers is a fast alternative to a Map when the input has only lowercase letters:

```ts
const counts = new Array<number>(26).fill(0);
for (const ch of s) counts[ch.charCodeAt(0) - 97]++;
```

## Common operations and their cost

| Operation | Time | Note |
| --- | --- | --- |
| `s.length`, `s[i]` | O(1) | |
| `s.slice(a, b)`, `s.substring(a, b)` | O(k) | k is the length of the result |
| `s.indexOf(t)`, `s.includes(t)` | O(n·m) worst case | searching for t inside s |
| `s.split('')`, `[...s]` | O(n) | creates an array |
| `arr.join('')` | O(n) | the standard way to build a string |
| `s.toLowerCase()` | O(n) | creates a new string |
| `s === t` | O(n) | compares characters |

Calling `slice` or building a new string **inside a loop** costs `O(n)` each time, so the whole loop becomes `O(n²)`. Prefer indexes and pointers over repeated slicing.

## Building strings

For a few concatenations, `+` or template literals are fine. When you build a long result in a loop, collect parts in an array and join once:

```ts
const parts: string[] = [];
for (let i = 1; i <= 5; i++) parts.push(`item ${i}`);
const text = parts.join(', '); // 'item 1, item 2, item 3, item 4, item 5'
```

## Unicode in one minute

JavaScript strings are sequences of 16-bit units. Most characters use one unit, but emoji and some letters use **two**.

```ts
'a'.length;     // 1
'😀'.length;    // 2
[...'😀'].length; // 1 (the spread operator iterates whole characters)
```

For interview problems the input is usually ASCII, so `.length` is fine. If a problem mentions Unicode or emoji, iterate with `for...of` or the spread operator.

## Useful tools

```ts
s.toLowerCase();  s.toUpperCase();
s.trim();                     // remove spaces at both ends
s.split(' ');                 // words
/[a-z0-9]/i.test(ch);         // is it a letter or digit?
[...s].reverse().join('');    // reverse a string
a < b;                        // compares by character code
a.localeCompare(b);           // alphabetical order for display
```

## Common mistakes

- Trying to assign to `s[i]`.
- Assuming `s[i]` throws when `i` is out of range. It returns `undefined`.
- Counting with `.length` on strings that contain emoji.
- Comparing characters case-sensitively when the problem says to ignore case.
- Slicing strings in a loop and not counting the cost.

## Practice

Use **Valid Palindrome** to practise cleaning characters and comparing from both ends, and **Is Subsequence** to practise walking two strings with indexes. Both can be solved without creating new strings.

## Recap

- Strings are immutable. Convert to an array when you need to edit.
- Out-of-range indexing gives `undefined`.
- Use character codes and a 26-slot array to count letters.
- Build long results with `array.join('')`, and avoid slicing in loops.
