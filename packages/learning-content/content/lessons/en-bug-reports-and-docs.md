---
summary: "Write bug reports that developers can act on, and documentation that newcomers can follow. Includes a bug report template, a README structure and plain-language rules."
tags: [writing, bug-reports, documentation, readme, templates]
videos: [GYy9g3XSSG0, OWAZ0hRmKTg, L7Ry-Fiij-M]
---

Two kinds of writing decide how smoothly a team works: bug reports and documentation. A bad bug report ("the page is not working") starts a long chat. A good one lets a developer reproduce the problem in two minutes. Good documentation lets a new teammate run the project on the first day without asking ten questions. Both follow the same rule: **write for a reader who was not there with you**.

> **Hinglish mein:** Bug report aisa likho ki doosra insaan bina tumse poochhe problem dobara la sake: kya kiya, kya hona chahiye tha, kya hua. Documentation mein chhote vaakya, seedhe steps aur ek example rakho.

## A good bug report

| Section | What to write |
| --- | --- |
| Title | What fails and where, in one line |
| Environment | App version, browser or OS, test environment |
| Steps to reproduce | Numbered steps, one action each |
| Expected result | What should happen |
| Actual result | What really happens |
| Evidence | Screenshot, log, error message |
| Severity | How bad it is: blocker, major, minor |

## Template

```markdown
**Title:** Login fails with a 500 error when the password contains "&"

**Environment:** Staging, build 1.4.2, Chrome 126 on Windows 11

**Steps to reproduce**
1. Open the login page.
2. Enter a valid email and the password `abc&123`.
3. Click "Sign in".

**Expected result:** The user is logged in.

**Actual result:** The page shows "Something went wrong". The API returns 500.

**Evidence:** Screenshot and log excerpt attached.

**Severity:** Major. Users with special characters cannot log in.
```

## Words you will need

| Word | Meaning |
| --- | --- |
| reproduce | make the problem happen again |
| expected / actual | what should happen / what happens |
| regression | something that used to work now fails |
| workaround | a temporary way to avoid the problem |
| severity | how serious it is |
| priority | how soon it should be fixed |

## Writing documentation

A good README has these parts.

1. **What it does:** one or two sentences.
2. **Quick start:** the shortest way to run it.
3. **Usage:** one or two examples.
4. **Configuration:** the settings and what they mean.
5. **Troubleshooting:** common errors and how to fix them.

## Plain-language rules

| Rule | Example |
| --- | --- |
| Short sentences | Run the tests before you push. |
| Active voice | The service sends an email. (not "An email is sent by the service") |
| Steps as commands | Open the file. Add the key. Save. |
| One term for one thing | Do not say "user", "client" and "customer" for the same thing. |
| Explain a term once | "A webhook is a URL that receives events." |
| Show an example | `npm run build` |

## Useful sentences

```phrases
This service sends a notification when a new order is created.
To run the project, install the dependencies and start the server.
Set the DATABASE_URL variable before you start the app.
If you see a connection error, check that the database is running.
The API returns a 404 when the user does not exist.
Steps to reproduce: open the login page and enter a password with a special character.
```

## Common mistakes

| Weak | Better |
| --- | --- |
| It is not working. | The login page shows a 500 error after I click Sign in. |
| Please fix urgent. | This blocks the release. Could we fix it today? |
| Refer the below steps. | Follow these steps. |
| The configurations are as follows. | The settings are: |

## Practice

1. Take a bug you found recently. Write a report with the template.
2. Ask a friend to follow your steps. Did they see the same result?
3. Choose one README you use and rewrite its first paragraph in simple, short sentences.

## Recap

- A good bug report: title, environment, steps, expected, actual, evidence, severity.
- Write for someone who was not there.
- Documentation: what, quick start, usage, configuration, troubleshooting.
- Use short sentences, active voice and one term for one thing.
