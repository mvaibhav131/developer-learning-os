---
summary: "Write good commit messages, pull request titles and descriptions, and polite review comments. Includes Conventional Commits and a copy-and-paste PR template."
tags: [writing, git, commits, pull-requests, code-review]
videos: [OJqUWvmf4gg, e3bjQX9jIBk]
---

Your commit messages and pull requests (PRs) are written for other people, and for yourself six months from now. A clear message saves a reviewer ten minutes and saves the team hours when they look for the reason behind a change. Good news: the grammar is simple, and the same few patterns work for every project.

> **Hinglish mein:** Commit message likhne ka rule: chhota title, command form mein ("Fix login bug", "Add retry"), aur zaroorat ho to neeche "kyun" likho. PR mein batao: kya badla, kyun badla, aur kaise test kiya.

## Commit messages

- First line (the **subject**): 50 characters or less.
- Start with a **verb in the base form**, as if you give a command: **Add**, **Fix**, **Remove**, **Update**, **Rename**.
- Do not end the subject with a full stop.
- If needed, leave one blank line and write **why** you made the change, not only what.

| Weak | Strong |
| --- | --- |
| changes | Fix crash when the token is missing |
| fixed bug | Handle empty password in login API |
| WIP | Add retry to the payment client |
| updated files | Update README with setup steps |

## Conventional Commits

Many teams add a **type** before the message.

| Type | Use | Example |
| --- | --- | --- |
| feat | new feature | feat: add retry to the payment client |
| fix | bug fix | fix: handle empty token in login API |
| docs | documentation | docs: update README setup steps |
| refactor | code change with no new behaviour | refactor: split the user service |
| test | tests | test: add cases for special characters |
| chore | maintenance | chore: update dependencies |

## Pull request title and description

A good title says what the PR does, in the same style as a commit subject.

| Weak | Strong |
| --- | --- |
| Login changes | Fix login failure for passwords with special characters |
| New feature | Add retry and timeout to the payment client |

Copy this template for your description:

```markdown
## What
Add retry and timeout to the payment client.

## Why
Payments failed when the provider was slow. Users saw a blank page.

## How to test
1. Run `npm test`.
2. Start the app and simulate a slow provider.
3. Check that the page shows an error message after 10 seconds.

## Risks
Retries could create duplicate payments if the provider does not support idempotency keys.

## Related
Ticket PAY-123
```

## Review comments

Use a **prefix** so that the author knows how important the comment is.

| Prefix | Meaning | Example |
| --- | --- | --- |
| nit: | small and optional | nit: Could we rename this to `retryCount`? |
| question: | you want to understand | question: Why do we wait 10 seconds here? |
| suggestion: | an idea | suggestion: We could use a constant for the timeout. |
| blocking: | must be fixed before merge | blocking: This will fail for an empty list. |

## Replying to review comments

```phrases
Good catch. I've fixed it in the latest commit.
Done. Thanks for the suggestion.
I kept it this way because the API expects a string. What do you think?
Could you explain a little more? I'm not sure I understand.
LGTM. Thanks for the quick fix.
Approved with a few small comments.
```

## Common mistakes

| Wrong | Correct |
| --- | --- |
| Fixed the login bug. | Fix the login bug. (commit subject) |
| I did changes in login. | Update the login validation. |
| Please check my PR sir. | Could you review my PR when you have time? |
| Why you wrote this? | Could you help me understand why we need this? |

## Practice

1. Rewrite three of your last commit messages using a verb and a clear object.
2. Write a PR description for a recent change using the template above.
3. Write one polite review comment with a prefix for a piece of code you read today.

## Recap

- Commit subject: verb in the base form, 50 characters, no full stop.
- Conventional Commits add a type such as feat, fix or docs.
- PR description: what, why, how to test, risks.
- Review comments: use prefixes, be polite, ask questions.
