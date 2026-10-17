# Development guide

## Set up

Requirements: Node.js 22 and pnpm 10 (`npm install --global pnpm@10.34.1`, or `corepack enable`). Docker is optional.

```bash
pnpm install
pnpm dev          # API on :4000, web app on :5173
```

Open <http://localhost:5173>. The first start creates `data/dlos.sqlite`, applies the migrations and loads all lessons, quizzes, problems and videos. The API reads an optional `.env` at the repository root (see below). Variables that are already set in the shell win.

If your shell has `NODE_ENV=production` set, unset it before `pnpm install`, otherwise pnpm skips the development dependencies. The `dev`, `test` and `start` scripts set `NODE_ENV` themselves, so they are not affected.

### Settings

| Variable | Default | Meaning |
| --- | --- | --- |
| `API_HOST`, `API_PORT` | `127.0.0.1`, `4000` | Where the API listens |
| `DATABASE_PATH` | `data/dlos.sqlite` | SQLite file (`:memory:` in tests) |
| `AUTO_MIGRATE`, `AUTO_SEED` | `true` | Apply migrations and load content at start |
| `ALLOWED_ORIGINS`, `ALLOWED_HOSTS` | localhost values | Browser origins and `Host` headers the API accepts |
| `PUBLIC_URL` | none | Adds the origin and host of a deployed site to both lists |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front of the API |
| `WEB_DIST_DIR` | none | When set, the API also serves the built web app from this folder |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | none | Turn on sign-in. Both or neither, password of at least 12 characters |
| `APP_TIMEZONE` | machine zone | IANA zone that decides when a study day starts |
| `OWNER_DISPLAY_NAME` | `Learner` | Name shown on the dashboard |
| `RATE_LIMIT_PER_MINUTE`, `LOG_LEVEL` | `600`, `info` | Request limit and log verbosity |
| `WEB_PORT`, `API_PORT` (web) | `5173`, `4000` | Dev server port, and the API port it proxies to |

## Everyday commands

| Command | What it does |
| --- | --- |
| `pnpm dev`, `pnpm dev:api`, `pnpm dev:web` | Run both apps or one of them with reload |
| `pnpm check` | Typecheck, lint and test. Run it before you commit |
| `pnpm typecheck`, `pnpm lint`, `pnpm lint:fix`, `pnpm format` | One quality gate at a time |
| `pnpm test` | Unit and API tests (shared, ui, learning-content, web, api) |
| `pnpm test:e2e` | Playwright on ports 4100 and 5273 with its own database (`data/e2e.sqlite`) |
| `pnpm build` | Build the web app and bundle the API (`apps/api/dist`) |
| `pnpm start` | Run the bundled API. Set `WEB_DIST_DIR=apps/web/dist` to serve the web app from it |
| `pnpm db:generate` | Create a migration from schema changes |
| `pnpm db:migrate`, `pnpm db:seed`, `pnpm db:reset`, `pnpm db:backup` | Database tools |
| `pnpm content:validate`, `pnpm content:videos` | Content checks and video verification |
| `pnpm licenses:check` | Fails on a dependency licence that is not on the allow-list |
| `node scripts/smoke.mjs <url>` | Checks a running instance, for example the Docker container |

## Where things live

```text
apps/api/src
  app.ts                    Express app and middleware order
  server.ts                 start-up: config, database, migrations, seed, listen
  config/env.ts             environment schema (Zod) and AppConfig
  core/                     db (schema, migrations, seed), http (middleware, auth, web, openapi), clock, logger
  features/<name>/          service functions per feature; routes.ts wires them to contracts
apps/web/src
  app/                      router, navigation, shell
  features/<name>/          one folder per page area
  components/               shared components (markdown, video player, phrase list, layout)
  lib/                      api client, queries, i18n, formatting, downloads, speech
  test/                     Testing Library setup, fake API, fixtures
packages/shared/src         contracts, schemas, constants, practice harness
packages/learning-content   curriculum, roadmap, content files, validation
```

## Add an endpoint

1. Describe the data in `packages/shared/src/schemas` (Zod).
2. Add a `defineEndpoint` to `packages/shared/src/contracts/endpoints.ts` and include it in the `endpoints` list at the end of that file. The OpenAPI test fails if you forget.
3. Write a service function in `apps/api/src/features/<name>/<name>.service.ts`. It receives the app context and returns data that matches the response schema.
4. Register it in `apps/api/src/features/routes.ts` with `registerRoute(router, api.<id>, handler)`.
5. Use it from the web app through a hook in `apps/web/src/lib/queries.ts` that calls `callApi`.
6. Test it: an API test with `createTestApp()` (in-memory database, fixed clock) and a web test with `installFakeApi`.

## Change the database

Edit the Drizzle schema in `apps/api/src/core/db/schema`, run `pnpm db:generate`, review the SQL it writes to `apps/api/drizzle`, and commit it. Migrations run when the API starts. API tests apply them to an in-memory database, so a broken migration fails the tests.

## Add text to the interface

Add the key to all three files in `apps/web/src/lib/i18n/locales` (`en.ts`, `hi-Latn.ts`, `hi.ts`). Keys are typed: a key that is missing in one locale does not compile. Keep technical terms in English in every language.

## Write content

See [CONTENT.md](CONTENT.md). The loop is: edit a file, run `pnpm content:validate`, restart the API, reload the page.

## Testing

| Kind | Tool | Notes |
| --- | --- | --- |
| Shared and content | Vitest | The practice harness, Markdown helpers and the content checks |
| API | Vitest + Supertest | In-memory SQLite, a fixed clock (Monday 19 Oct 2026, Asia/Kolkata) and the real seed |
| Web | Vitest + Testing Library + jsdom | `installFakeApi({ 'GET /path': data })` replaces `fetch`. CodeMirror needs real layout, so practice tests replace `./code-editor` with a textarea using `vi.mock` |
| End to end | Playwright + axe | Real browser against a real API and a fresh database. Includes accessibility (WCAG 2.2 AA, both themes, three languages) and layout checks from 320 px to 1440 px |

Tips for the end-to-end suite:

- The interface starts in Hinglish and switches to the stored language when the preferences arrive. Wait for `html[lang]` before you press keys, or the page may re-render under you.
- Specs share one database and run in order. Compare before and after values instead of assuming a clean state.
- A failed run leaves `apps/web/test-results` and `apps/web/playwright-report`. Both are ignored by git.

## Troubleshooting

| Symptom | Fix |
| --- | --- |
| A new lesson, quiz or problem does not show | Restart the API. Content is loaded at start |
| `pnpm content:validate` reports "not verified" videos | Run `pnpm content:videos` |
| Port 4000 or 5173 is busy | Stop the other process, or set `API_PORT` and `WEB_PORT` |
| `better-sqlite3` fails to load after a Node upgrade | `pnpm rebuild better-sqlite3` |
| API answers `invalid_host` or `forbidden_origin` | The address you use is not in `ALLOWED_HOSTS` or `ALLOWED_ORIGINS`. Set `PUBLIC_URL` |
| The Docker image cannot start | `docker logs <container>`. The most common cause is a bad setting, and the message names it |
| Playwright cannot find a browser | `pnpm --filter @dlos/web exec playwright install chromium` |

## Conventions

- TypeScript in strict mode. No `any`, no unchecked casts of API data. Parse at the boundary with Zod.
- ESLint runs with `--max-warnings=0`, including accessibility rules for JSX. Prettier formats the code.
- Use Conventional Commits for messages (`feat:`, `fix:`, `docs:`, `test:`, `chore:`).
- Never show a number that is not computed from stored records, and never mark content complete when it does not exist.
