---
summary: Binary search is not only for arrays. Search the range of possible answers using a monotonic yes/no check. Learn the template, choose bounds, and solve Koko Eating Bananas and capacity problems.
tags: [binary-search, answer-space, monotonic, feasibility, optimization]
videos: [IZP_8-JZqhM, U2SozAs9RzA]
---

Some problems do not give you a sorted array, but they give you something just as good: a **sorted set of possible answers**. If you can test any answer `x` with a yes/no question ("is `x` enough?") and the results are all "no" up to some point and all "yes" afterwards, you can binary search the answer itself. This is called **binary search on the answer**.

## The key property: monotonic

A check function `feasible(x)` is **monotonic** if whenever it is true for `x`, it is also true for every larger `x` (or the opposite, for every smaller `x`). The results look like this:

```
x:           1    2    3    4    5    6 ...
feasible:   no   no   no  yes  yes  yes ...
                          ^ first yes = the answer
```

You are searching for the **first yes**. That is a lower bound, just like in the previous lesson.

## The template

```ts
function minimumFeasible(low: number, high: number, feasible: (x: number) => boolean): number {
  let left = low;
  let right = high; // high must be feasible
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (feasible(mid)) right = mid; // mid works, try smaller
    else left = mid + 1;            // mid fails, need bigger
  }
  return left;
}
```

Cost: `O(log(range) × cost of feasible)`.

## Example: Koko Eating Bananas

Piles of bananas, a time limit of `h` hours, and a speed `k` bananas per hour. Find the smallest `k` that finishes in time.

- The answer is between `1` and the largest pile.
- `feasible(k)`: the sum of `ceil(pile / k)` over all piles is at most `h`.
- A faster speed never needs more hours, so the check is monotonic.

```ts
function minEatingSpeed(piles: number[], h: number): number {
  const hoursNeeded = (speed: number): number =>
    piles.reduce((hours, pile) => hours + Math.ceil(pile / speed), 0);

  let left = 1;
  let right = Math.max(...piles);
  while (left < right) {
    const mid = left + Math.floor((right - left) / 2);
    if (hoursNeeded(mid) <= h) right = mid;
    else left = mid + 1;
  }
  return left;
}
```

Time: `O(n log M)`, where `M` is the largest pile.

## Example: shipping packages in D days

Packages with weights must be shipped in order. A ship has capacity `c`. Find the smallest `c` that ships everything within `D` days.

- Lower bound of the answer: the heaviest package (otherwise it never fits). Upper bound: the total weight.
- `feasible(c)`: simulate loading packages greedily and count the days. If days `<= D`, the capacity works.

The same template, a different check.

## Example: integer square root

Find the largest `x` such that `x * x <= n`. The check "x * x <= n" is true for small `x` and false for large `x`. Searching for the **last true** is the mirror image of searching for the first yes. Search for the first `x` where `x * x > n` and subtract one.

## How to pick the bounds

| Bound | Pick |
| --- | --- |
| Low | the smallest answer that could possibly be valid |
| High | an answer that is surely valid, such as the maximum or the total |

If the bounds are too tight, you miss answers. If they are huge, it only costs a few more steps because the range is halved each time.

## When to think "binary search on the answer"

- "Find the **minimum** possible value of the **maximum** ..." or "the **maximum** possible value of the **minimum** ..."
- "Smallest speed, capacity, time or size that makes the task possible"
- A greedy simulation can check one candidate answer in `O(n)`.

## Common mistakes

- A check that is **not** monotonic. Test it on a few values by hand before you trust it.
- Wrong bounds, for example starting the low bound at `0` and dividing by it.
- Using floor instead of ceiling when computing the time for a pile.
- Off-by-one between "first yes" and "last no". Decide which one you return.
- Using `Math.max(...hugeArray)` on very large arrays. It can exceed the call stack, so use a loop or `reduce`.

## Practice

Solve **Koko Eating Bananas**. Then write the check function for the shipping-capacity problem on paper and run the binary search by hand on weights `[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]` with `D = 5` (the answer is 15).

## Recap

- Binary search works on any search space with a monotonic yes/no check.
- Template: if `feasible(mid)`, keep `mid` and go smaller, otherwise go bigger.
- Choose safe bounds, and write the check as a simple greedy simulation.
- Cost is `O(log(range) × check)`.
