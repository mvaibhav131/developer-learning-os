import { lessons } from '../builders';
import type { TrackDef } from '../types';

export const dsaTrack: TrackDef = {
  slug: 'dsa',
  title: 'DSA Practice Academy',
  shortTitle: 'DSA',
  icon: 'binary',
  description:
    'Interview-grade data structures and algorithms in JavaScript and TypeScript, with brute-force to optimized walkthroughs, dry runs and spaced repetition so fundamentals never fade.',
  courses: [
    {
      slug: 'dsa-foundations',
      title: 'DSA Foundations and Core Patterns',
      subtitle: 'Complexity, hashing, pointers, windows and search',
      description:
        'The patterns that unlock a large share of interview problems, practised in JavaScript and TypeScript with brute-force, optimized and dry-run walkthroughs for every problem.',
      difficulty: 'beginner',
      icon: 'binary',
      tags: ['big o', 'arrays', 'hashing', 'two pointers', 'sliding window', 'binary search'],
      outcomes: [
        'Analyse the time and space complexity of any solution you write',
        'Recognise two-pointer, sliding-window, prefix-sum and binary-search problems on sight',
        'Explain the path from brute force to the optimized solution out loud',
      ],
      modules: [
        {
          slug: 'complexity-and-arrays',
          title: 'Complexity, arrays and strings',
          description: 'Big O fluency and the everyday array and string techniques.',
          lessons: lessons([
            ['big-o-analysis', 'Big O analysis: time, space and amortized cost', 'b', 40],
            ['arrays-fundamentals', 'Arrays: operations and in-place techniques', 'b', 30],
            ['array-interview-patterns', 'Array interview patterns', 'i', 30],
            ['string-fundamentals', 'Strings: immutability, builders and parsing', 'b', 30],
            ['string-interview-patterns', 'String interview patterns', 'i', 30],
          ]),
        },
        {
          slug: 'hashing',
          title: 'Hashing',
          description: 'HashMaps and Sets for constant-time lookups.',
          lessons: lessons([
            ['hashmaps-and-frequency-counting', 'HashMaps and frequency counting', 'b', 30],
            ['sets-and-deduplication', 'Sets, deduplication and membership', 'b', 25],
            [
              'hashing-interview-patterns',
              'Hashing patterns: two-sum family, anagrams and grouping',
              'i',
              35,
            ],
          ]),
        },
        {
          slug: 'pointer-and-window-patterns',
          title: 'Pointer and window patterns',
          description: 'Two pointers, sliding windows and prefix sums.',
          lessons: lessons([
            ['two-pointers-opposite-ends', 'Two pointers: opposite ends', 'i', 30],
            ['two-pointers-fast-slow', 'Two pointers: fast and slow, partitioning', 'i', 30],
            ['sliding-window-fixed', 'Sliding window: fixed size', 'i', 30],
            ['sliding-window-variable', 'Sliding window: variable size', 'i', 35],
            ['prefix-sum-basics', 'Prefix sums and range queries', 'i', 30],
            ['prefix-sum-hashmap', 'Prefix sums with hashmaps: subarray problems', 'a', 35],
          ]),
        },
        {
          slug: 'search-and-sort',
          title: 'Search and sort',
          description: 'Binary search templates and sorting-based solutions.',
          lessons: lessons([
            ['binary-search-basics', 'Binary search: the template', 'i', 30],
            ['binary-search-on-answer', 'Binary search on the answer space', 'a', 35],
            ['sorting-algorithms-and-patterns', 'Sorting algorithms and sorting-based patterns', 'i', 40],
          ]),
        },
      ],
    },
    {
      slug: 'dsa-linear-structures',
      title: 'Recursion, Linear Structures and Backtracking',
      subtitle: 'Linked lists, stacks, queues and recursive thinking',
      description:
        'Recursion and its call stack, linked-list pointer manipulation, stack and queue patterns including monotonic stacks, and the backtracking templates for combinatorial search.',
      difficulty: 'intermediate',
      icon: 'boxes',
      tags: ['recursion', 'linked list', 'stack', 'queue', 'backtracking'],
      outcomes: [
        'Write recursive solutions with clear base cases and stack reasoning',
        'Manipulate linked lists safely with pointer invariants',
        'Apply monotonic stacks and backtracking templates to unfamiliar problems',
      ],
      modules: [
        {
          slug: 'recursion',
          title: 'Recursion',
          description: 'Think in subproblems and cache what repeats.',
          lessons: lessons([
            ['recursion-fundamentals', 'Recursion: the call stack and base cases', 'i', 30],
            ['recursion-and-memoization', 'Recursion trees and memoization', 'i', 30],
          ]),
        },
        {
          slug: 'linked-lists',
          title: 'Linked lists',
          description: 'Pointer manipulation without losing nodes.',
          lessons: lessons([
            ['linked-list-fundamentals', 'Linked lists: operations and pointers', 'b', 30],
            ['linked-list-patterns', 'Reversal, cycle detection and merging', 'i', 35],
            ['linked-list-lru-and-design', 'Designing with linked lists: LRU cache', 'a', 40],
          ]),
        },
        {
          slug: 'stacks-and-queues',
          title: 'Stacks and queues',
          description: 'Matching, evaluation, monotonic stacks and deques.',
          lessons: lessons([
            ['stack-fundamentals', 'Stacks: matching and expression evaluation', 'b', 30],
            ['monotonic-stack', 'Monotonic stack', 'a', 35],
            ['queue-and-deque', 'Queues, deques and circular buffers', 'b', 30],
          ]),
        },
        {
          slug: 'backtracking',
          title: 'Backtracking',
          description: 'Systematic search with pruning.',
          lessons: lessons([
            ['backtracking-template', 'Backtracking template', 'i', 35],
            ['backtracking-subsets-permutations', 'Subsets, permutations and combinations', 'i', 40],
            [
              'backtracking-constraint-problems',
              'Constraint problems: N-Queens, Sudoku and word search',
              'a',
              45,
            ],
          ]),
        },
      ],
    },
    {
      slug: 'dsa-trees-and-graphs',
      title: 'Trees, Heaps, Tries and Graphs',
      subtitle: 'Hierarchical and networked data',
      description:
        'Binary trees and BSTs, heaps for top-k problems, tries for prefix search, and the graph toolbox: BFS, DFS, topological sort, union-find and Dijkstra.',
      difficulty: 'intermediate',
      icon: 'network',
      tags: ['trees', 'bst', 'heap', 'trie', 'graph', 'bfs', 'dfs', 'union-find'],
      outcomes: [
        'Traverse and transform trees with DFS and BFS confidently',
        'Use heaps and tries for top-k, streaming and prefix problems',
        'Model problems as graphs and pick the right algorithm for the job',
      ],
      modules: [
        {
          slug: 'trees',
          title: 'Trees',
          description: 'Traversals, construction and binary search trees.',
          lessons: lessons([
            ['binary-tree-fundamentals', 'Binary trees: structure and traversals', 'i', 35],
            ['tree-dfs-patterns', 'Tree DFS patterns', 'i', 35],
            ['tree-bfs-level-order', 'Level-order traversal and BFS on trees', 'i', 30],
            ['binary-search-trees', 'Binary search trees', 'i', 35],
            ['tree-construction-and-serialization', 'Tree construction and serialization', 'a', 40],
            ['lowest-common-ancestor-and-paths', 'Lowest common ancestor and path problems', 'a', 40],
          ]),
        },
        {
          slug: 'heaps-and-tries',
          title: 'Heaps and tries',
          description: 'Priority queues, top-k and prefix trees.',
          lessons: lessons([
            ['heaps-and-priority-queues', 'Heaps and priority queues', 'i', 35],
            ['top-k-and-streaming-problems', 'Top-K and streaming problems', 'i', 35],
            ['merge-k-and-two-heaps', 'Merge K lists and the two-heap median', 'a', 40],
            ['tries-fundamentals', 'Tries: prefix trees', 'i', 35],
            ['trie-patterns', 'Trie patterns: autocomplete and word search', 'a', 35],
          ]),
        },
        {
          slug: 'graphs',
          title: 'Graphs',
          description: 'Representations, traversals, ordering and shortest paths.',
          lessons: lessons([
            ['graph-representations', 'Graph representations', 'i', 30],
            ['graph-bfs', 'BFS: shortest paths and levels', 'i', 35],
            ['graph-dfs', 'DFS: components, cycles and islands', 'i', 35],
            ['topological-sort', 'Topological sorting', 'a', 40],
            ['union-find', 'Union-Find (disjoint sets)', 'a', 40],
            ['shortest-paths-dijkstra', 'Dijkstra and weighted shortest paths', 'a', 45],
          ]),
        },
      ],
    },
    {
      slug: 'dsa-dp-and-advanced',
      title: 'Greedy, Dynamic Programming and Advanced Patterns',
      subtitle: 'Optimization techniques and pattern selection',
      description:
        'When greedy works, how to define DP states and transitions, bit manipulation, interval problems and a decision framework for picking the right pattern under interview pressure.',
      difficulty: 'advanced',
      icon: 'cpu',
      tags: ['greedy', 'dynamic programming', 'bit manipulation', 'intervals'],
      outcomes: [
        'Define DP states and transitions, then optimise space',
        'Decide between greedy, DP and search with a repeatable framework',
        'Solve timed mixed problem sets under interview conditions',
      ],
      modules: [
        {
          slug: 'greedy',
          title: 'Greedy algorithms',
          description: 'Local choices that provably lead to global optima.',
          lessons: lessons([
            ['greedy-fundamentals', 'Greedy algorithms: when they work', 'i', 30],
            ['greedy-intervals-and-scheduling', 'Intervals and scheduling', 'i', 35],
            ['greedy-interview-patterns', 'Greedy interview patterns', 'a', 35],
          ]),
        },
        {
          slug: 'dynamic-programming',
          title: 'Dynamic programming',
          description: 'From recursion to tables and space optimization.',
          lessons: lessons([
            ['dp-foundations', 'DP foundations: states and transitions', 'i', 40],
            ['dp-1d', '1D DP: climbing stairs to house robber', 'i', 35],
            ['dp-2d-grids', '2D DP and grid paths', 'a', 35],
            ['dp-knapsack', 'Knapsack family', 'a', 45],
            ['dp-strings', 'DP on strings: LCS and edit distance', 'a', 45],
            ['dp-subsequences', 'Subsequence DP: LIS and variants', 'a', 40],
            ['dp-partitions-and-intervals', 'Partition and interval DP', 'a', 45],
            ['dp-optimization-and-state-compression', 'State compression and optimization', 'a', 40],
          ]),
        },
        {
          slug: 'bits-and-advanced-patterns',
          title: 'Bits and advanced patterns',
          description: 'Bit tricks, intervals and pattern recognition.',
          lessons: lessons([
            ['bit-manipulation-basics', 'Bit manipulation basics', 'i', 30],
            ['bit-manipulation-patterns', 'Bitmask patterns', 'a', 35],
            ['interval-patterns', 'Interval problems: merge, insert and sweep line', 'i', 35],
            [
              'advanced-pattern-recognition',
              'Choosing the right pattern: a decision framework',
              'a',
              40,
            ],
            ['mixed-problem-sets', 'Mixed timed problem sets', 'a', 45, 'revision'],
            ['mock-timed-coding-interview', 'Timed mock coding interview', 'a', 60, 'assessment'],
          ]),
        },
      ],
    },
  ],
};
