---
summary: "Explain a bug, a piece of code or a technical decision aloud with a clear structure: problem, cause, fix and next step. Includes connectors and bug vocabulary."
tags: [workplace, explaining, bugs, code-review]
videos: [XlmKqkZkfqI, MsxcpZr1LpM]
---

In your job you must explain things all the time: why a page is slow, how a function works, why you chose one library over another. A clear explanation has a **shape**. When you follow the same shape every time, you do not have to invent a new structure, and the listener can follow you easily, even when your vocabulary is simple.

> **Hinglish mein:** Bug explain karne ka formula: (1) Problem kya hai, (2) Kyun hua, (3) Maine kya fix kiya, (4) Ab aage kya. Har baar yahi order use karo to bolna aasaan ho jaata hai.

## The four-step shape

| Step | What you say | Starter phrase |
| --- | --- | --- |
| 1. Problem | What the user or system sees | The problem is that... |
| 2. Cause | Why it happens | It happens because... |
| 3. Fix | What you did or will do | To fix it, I... |
| 4. Next step | What is left, and when | Next, I'm going to... |

## Example: explaining a bug

> The problem is that users cannot log in when their password has a special character. It happens because we do not encode the password before we send it to the API, so the request is rejected. To fix it, I added encoding and wrote two tests. Next, I'm going to deploy the fix to staging, and I should have it in production tomorrow.

## Connectors that make you sound clear

| Purpose | Words |
| --- | --- |
| Reason | because, since, due to |
| Result | so, therefore, as a result |
| Contrast | but, however, although |
| Example | for example, such as, for instance |
| Order | first, then, after that, finally |
| Restate | in other words, that means |

## Walking through code

```phrases
This function takes a list of users and returns only the active ones.
First, it filters the list. Then, it sorts it by name.
The reason I used a map here is that the lookup is faster.
I chose this library over the other one because it has better documentation.
The trade-off is that it uses more memory.
In other words, the cache saves a database call on every request.
```

## Bug vocabulary

| Word or phrase | Meaning | Example |
| --- | --- | --- |
| crash | the program stops suddenly | The app crashes when the file is empty. |
| throw an error | the code raises an error | The function throws an error for null input. |
| return null | the function gives no value | The API returns null for missing users. |
| edge case | an unusual situation | The code fails on the edge case of an empty list. |
| race condition | two actions interfere with each other | A race condition caused the duplicate order. |
| regression | something that worked before is broken again | The last release caused a regression in search. |
| root cause | the real reason for the problem | The root cause was a missing index. |
| workaround | a temporary solution | As a workaround, restart the service. |

## Common mistakes

| Wrong | Correct |
| --- | --- |
| It is giving error. | It throws an error. / It returns an error. |
| The code is not working. | The code fails when the input is empty. |
| I did the changes. | I made the changes. |
| The issue is solved. | The issue is fixed. |
| I have done. | I have finished. / I'm done. |

## Practice

1. Choose a bug you fixed (or a function you wrote) in the last month.
2. Write four sentences: problem, cause, fix, next step. Use "The problem is that...", "It happens because...", "To fix it, I...", "Next, I...".
3. Say it aloud in under 60 seconds. Record it and listen to it.
4. Replace one general word ("thing", "issue") with a precise one ("null value", "timeout").

## Recap

- Use the shape: problem, cause, fix, next step.
- Connectors such as because, so, however and for example make your logic clear.
- Be exact: not "it is not working", but "it fails when the input is empty".
- Keep sentences short. One idea at a time.
