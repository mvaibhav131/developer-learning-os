# Writing content

All learning content is plain files in `packages/learning-content/content`. There is no admin screen: you edit a file, check it, restart the API and reload the page.

```text
content/
  videos.yaml            video registry
  lessons/<slug>.md      one lesson (English)
  quizzes/<slug>.yaml    the quiz for the lesson with the same slug
  problems/<slug>.yaml   one coding problem
```

The curriculum, which is the list of tracks, courses, modules and lesson titles, lives in `packages/learning-content/src/curriculum`. A lesson file is only used when its slug exists there. A lesson that has a file is **complete**. One without a file stays **planned**, cannot be completed and is never counted as progress.

The loop:

```bash
pnpm content:validate      # checks every file and runs every reference solution
# restart the API (Ctrl+C, pnpm dev) so the content is loaded again
```

## Lessons

`lessons/<slug>.md` starts with front matter:

```markdown
---
summary: "One or two sentences, 20 to 300 characters, shown in lists and search."
tags: [hashing, hash-map]
videos: [KLlXCFG5TnA, vzdNOK2oB2E]
---

Opening paragraph...

## First section
```

| Rule | Why |
| --- | --- |
| `summary` is 20 to 300 characters | It appears in lists |
| `videos` are 11-character ids that exist in `videos.yaml` | Only verified videos are shown. The video that matches the interface language is shown first. |
| The body has at least 1,500 characters | Prevents a stub from being counted as a lesson |
| Use `##` and `###` headings, never `#` | The page title is the lesson title |
| Headings in one lesson must be unique | They become anchors and the "On this page" list |

What the renderer supports:

- GitHub-flavoured Markdown: tables, task lists, strikethrough. Raw HTML is never rendered.
- Code blocks with highlighting for `ts`, `js`, `bash`, `json`, `sql`, `python`, `yaml`, `css`, `diff`, `markdown` and `html`. Every code block has a copy button.
- Every table gets a "Download table as CSV" button, which suits vocabulary lists.
- A fenced block marked `phrases` becomes a speaking-practice list. Put one English phrase on each line. Learners can listen (browser voice, normal or slow), record themselves (kept in the tab, never uploaded) and copy the phrase.
- Links that start with `/` stay inside the app, for example `[Two Sum](/practice/two-sum)`. External links open in a new tab.

Problems that name a lesson in their `lesson:` field are listed on the lesson page under "Practice this".

## Quizzes

`quizzes/<lesson-slug>.yaml` needs a lesson file with the same slug.

```yaml
title: Check your understanding
passPercent: 70
questions:
  - kind: single
    prompt: "Which sentence has the correct word order?"
    options:
      - "I tea drink every day."
      - "I drink tea every day."
    answer: 1
    explanation: "English follows Subject + Verb + Object."
  - kind: multiple
    prompt: "Select all the correct sentences."
    options: ["...", "...", "..."]
    answer: [0, 2]
    explanation: "..."
  - kind: true-false
    prompt: "A hash map lookup is O(1) on average."
    answer: true
    explanation: "..."
```

Three to fifteen questions. `single` has one answer index, `multiple` has a list of at least two indexes, `true-false` has `answer: true` or `false` and no options. Options are 2 to 6 strings. Prompts must be unique. The server grades the attempt and returns the explanations, so the answers are never sent to the browser with the questions.

## Coding problems

```yaml
slug: two-sum
title: Two Sum
difficulty: easy                 # easy | medium | hard
topics: [arrays, hash-map]
lesson: hashing-interview-patterns
function: twoSum                 # the function the learner must define
ordering: any-order              # optional: exact (default) | any-order | any-order-groups
statement: |
  Markdown. Say exactly what to return.
constraints: |
  - `2 <= nums.length <= 10^4`
examples:
  - input: "nums = [2, 7, 11, 15], target = 9"
    output: "[0, 1]"
    explanation: "optional"
starter: |
  function twoSum(nums: number[], target: number): number[] {
    return [];
  }
tests:                           # at least 5, some hidden, at least one visible
  - { args: [[2, 7, 11, 15], 9], expected: [0, 1] }
  - { args: [[3, 3], 6], expected: [0, 1], hidden: true }
hints:                           # 1 to 5, easiest first
  - "A first nudge."
solution:
  code: |
    function twoSum(nums: number[], target: number): number[] { /* ... */ }
  explanation: |
    Why it works.
  time: O(n)
  space: O(n)
videos: [KLlXCFG5TnA]
```

Options that change how the tests compare results:

| Field | Use |
| --- | --- |
| `ordering: any-order` | The returned array may be in any order |
| `ordering: any-order-groups` | A list of lists where both the groups and their members may be in any order (3Sum) |
| `inPlace: true` | The function changes its first argument and returns nothing. The changed argument is compared |
| `float: true` | Numbers match within a small relative tolerance |
| `args: [list, list]`, `returns: list` | Arguments or the result are linked lists. Write them as arrays in `tests` |
| `args: [tree]`, `returns: tree` | Binary trees as level-order arrays with `null`, like LeetCode |

`ListNode(val, next)` and `TreeNode(val, left, right)` exist as globals in the editor, so starter code and solutions can use them.

`pnpm content:validate` runs your reference solution against every test and fails when one does not pass. It also fails when the starter code already passes every test, because a problem that starts solved teaches nothing. Include edge cases (empty input, one element, duplicates, negatives) and a few large values in the hidden tests.

Write the solution so a learner can read it: clear names, no tricks, and an explanation that names the idea and the cost.

## Videos

Add an entry with only the id, the language and topics:

```yaml
- { id: KLlXCFG5TnA, language: en, topics: [hashing, two-sum] }
```

Languages are `en`, `hi`, `hi-Latn` and `multi`. Then run:

```bash
pnpm content:videos
```

The tool asks YouTube's oEmbed endpoint whether the video exists and may be embedded, then fills in the real title and author and the date it was verified. Videos that fail are reported and must be removed or replaced. `pnpm content:validate` refuses unverified entries.

Choose videos by what they teach, not by who made them, prefer a mix of English and Hindi, and never add a video you have not watched at least in part.

## Adding a lesson title to the curriculum

Open the file for the track in `packages/learning-content/src/curriculum` and add a row to the module:

```ts
lessons([
  ['two-pointers-opposite-ends', 'Two pointers: opposite ends', 'i', 30],
  //  slug (kebab-case)          title                          level  minutes
]);
```

Levels are `b` (beginner), `i` (intermediate) and `a` (advanced). Minutes are between 10 and 120. Lessons of the 24-week roadmap must also be scheduled in `packages/learning-content/src/roadmap`, and `pnpm content:validate` tells you when one is not. The English track is self-paced and exempt.

## Quality checklist

- Would a learner who knows nothing about this topic understand the first paragraph?
- Is every claim true, and every code sample runnable?
- Does the lesson end with practice that the app can check (a problem or a quiz)?
- Are the numbers honest? Do not invent results, statistics or promises such as "fluent in 30 days".
