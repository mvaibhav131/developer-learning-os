# Developer Learning OS

A personal learning platform for developers. Lessons, the videos that go with them, quizzes, a built-in coding editor for DSA practice and an English-for-developers track all live inside one app. Your progress is saved in a SQLite file that you own. There is no account system, no tracking and no paid API key.

> Status: working and still growing. About 56 lessons are written. The other ~240 titles are on the curriculum and clearly marked **planned**, and they never count as progress. See [What works today](#what-works-today).

## What works today

| Area | Status |
| --- | --- |
| Lessons | 56 written lessons with embedded videos, quizzes and downloads: DSA foundations (17) and the English track (39). |
| DSA practice | 33 problems you solve in a built-in editor (CodeMirror). Your code runs in a Web Worker in your browser against visible and hidden tests. Attempts and solved status are saved. |
| English track | Grammar, pronunciation, speaking, workplace writing, interviews, vocabulary and listening. Practice phrases can be listened to (browser voice), recorded in the tab and copied. |
| Videos | 133 YouTube videos, each checked with YouTube's oEmbed endpoint. They play inside the lesson page (`youtube-nocookie.com`, click to load). Hindi videos come first when the interface is Hindi or Hinglish. |
| Downloads | Lesson notes as Markdown, print or save as PDF, and every table as CSV. |
| Dashboard and roadmap | Computed from real study sessions and task completions: 24-week plan, streaks, daily goals, continue-learning card. |
| AI labs | Ten labs with milestone checklists. The step-by-step guides are planned. |
| Languages | English, Hinglish (default) and Hindi interface. Lesson text exists in English only. There is no automatic translation. |

Not built yet, and marked as such in the app: analytics, flashcards, notes, playground, architecture designer, RAG lab, AI tutor and mock interviews.

## Run it

### With Docker (one container)

```bash
docker compose up -d --build
```

Open <http://localhost:8080>. The API and the web app run in the same container, and your data lives in the `dlos-data` volume. To change the port, time zone or name, copy [.env.docker.example](.env.docker.example) to `.env.docker` and start with `docker compose --env-file .env.docker up -d --build`.

A prebuilt image is published to GitHub Container Registry on every push to `main`:

```bash
docker run -d --name dlos -p 8080:4000 -e PUBLIC_URL=http://localhost:8080 -e APP_TIMEZONE=Asia/Kolkata -v dlos-data:/data ghcr.io/mvaibhav131/developer-learning-os:latest
```

### For development

Requirements: Node.js 22 and pnpm 10.

```bash
pnpm install
pnpm dev
```

Open <http://localhost:5173>. The API runs on port 4000 and the web app proxies `/api` to it. Data is stored in `data/dlos.sqlite`. After you change a lesson, quiz or problem file, restart the API so the content is loaded again.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | API and web app with reload |
| `pnpm typecheck` | TypeScript for every package |
| `pnpm lint` | ESLint with no warnings allowed |
| `pnpm test` | Unit and API tests for every package |
| `pnpm test:e2e` | Playwright end-to-end and accessibility checks on separate ports and a separate database |
| `pnpm build` | Production build of the web app and the API |
| `pnpm content:validate` | Checks all lessons, quizzes, problems and videos, and runs every reference solution |
| `pnpm content:videos` | Verifies new videos with YouTube and fills in title and author |
| `pnpm db:backup`, `pnpm db:reset` | Back up or recreate the local database |

## Deploy it

The Docker image is the unit of deployment. It needs one persistent volume mounted at `/data`. The app has **no user accounts**, so anything reachable from the internet must be protected with the built-in sign-in (`BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD`) or by a proxy that signs users in.

[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) has the full guide: settings, GitHub Container Registry, Fly.io, Render, a VPS with Caddy, backups and upgrades. [fly.toml](fly.toml) and [render.yaml](render.yaml) are ready-made templates.

## Documentation

| Document | For |
| --- | --- |
| [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) | Setting up, daily workflow, adding endpoints, migrations and tests, troubleshooting |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the monorepo, the API, the web app, the content pipeline and the code runner fit together |
| [docs/CONTENT.md](docs/CONTENT.md) | Writing lessons, quizzes, problems and adding videos |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Docker, hosting, settings, backups and security |

The API documents itself: open `/api/docs` (Swagger UI) or `/api/openapi.json` on a running instance.

## Honesty rules

- Progress, streaks and readiness are computed from saved records. Nothing is hard-coded.
- Every lesson shows its status: planned, in progress or complete.
- Videos are real and verified. The app never invents links, ratings or AI output.
- A translation is only shown when a reviewed translation exists. Otherwise the English text is used and labelled.
