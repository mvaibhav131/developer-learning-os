# Deployment

The unit of deployment is one Docker image. It contains the API and the built web app, listens on port 4000 and keeps all data in one SQLite file under `/data`. Mount a volume there, or your progress disappears with the container.

> **The app has no user accounts.** Anyone who can open the address can read and change everything. Before you make it reachable from the internet, turn on the built-in sign-in (`BASIC_AUTH_USER` and `BASIC_AUTH_PASSWORD`) or put it behind a proxy that signs users in, and use HTTPS. Sign-in sends the password with every request, so it is only safe over HTTPS.

## Settings

| Variable | Default in the image | Meaning |
| --- | --- | --- |
| `PUBLIC_URL` | none | The address you type in the browser, for example `https://learn.example.com`. **Required** whenever it is not `http://localhost:4000`. It adds that origin and host to the allow-lists, and without it saving anything fails with `forbidden_origin` |
| `APP_TIMEZONE` | the container zone (UTC) | Your IANA time zone, for example `Asia/Kolkata`. It decides when a study day starts and ends |
| `OWNER_DISPLAY_NAME` | `Learner` | Name on the dashboard |
| `BASIC_AUTH_USER`, `BASIC_AUTH_PASSWORD` | none | Turn on sign-in. Both or neither. The password needs at least 12 characters. The health check stays open |
| `TRUST_PROXY` | `0` | Number of reverse proxies in front of the app. Use `1` behind Caddy, nginx, Render or Fly, so the real client address is used |
| `API_PORT` | `4000` | Port inside the container. Platforms such as Render and Fly tell you which one they expect |
| `DATABASE_PATH` | `/data/dlos.sqlite` | Where the data lives |
| `ALLOWED_ORIGINS`, `ALLOWED_HOSTS` | `localhost:4000` values | Extra browser origins and host names, comma separated |
| `LOG_LEVEL` | `info` | `fatal`, `error`, `warn`, `info`, `debug`, `trace` or `silent` |

Migrations and content loading run at every start. Upgrading is "pull the new image and start it": your data stays in the volume.

## Docker Compose

```bash
docker compose up -d --build
```

Open <http://localhost:8080>. Compose publishes the port on `127.0.0.1` only, so nobody else on your network can reach it. To change settings, copy `.env.docker.example` to `.env.docker`, edit it and start with:

```bash
docker compose --env-file .env.docker up -d --build
```

| Task | Command |
| --- | --- |
| Logs | `docker compose logs -f app` |
| Stop, start | `docker compose stop`, `docker compose start` |
| Update after `git pull` | `docker compose up -d --build` |
| Remove the container, keep the data | `docker compose down` |
| Remove the container **and delete the data** | `docker compose down -v` |
| Check it works | `node scripts/smoke.mjs http://localhost:8080` |

## Plain `docker run`

```bash
docker build -t developer-learning-os .
docker run -d --name dlos --restart unless-stopped \
  -p 127.0.0.1:8080:4000 \
  -e PUBLIC_URL=http://localhost:8080 \
  -e APP_TIMEZONE=Asia/Kolkata \
  -v dlos-data:/data \
  developer-learning-os
```

## The published image

GitHub Actions builds the image on every pull request and pushes it to GitHub Container Registry from `main` and from version tags:

```text
ghcr.io/mvaibhav131/developer-learning-os:latest      newest main
ghcr.io/mvaibhav131/developer-learning-os:<sha>       one commit
ghcr.io/mvaibhav131/developer-learning-os:1.2.3       a tag such as v1.2.3
```

A new package on GitHub Container Registry is private. Either make it public (repository page, Packages, the image, Package settings, Change visibility), or log in on the server first with a personal access token that has `read:packages`:

```bash
echo "$GITHUB_TOKEN" | docker login ghcr.io -u mvaibhav131 --password-stdin
```

To run the published image with Compose instead of building it, delete the `build: .` line from `docker-compose.yml` (and add `pull_policy: always` to get new versions on every `up`).

## A server with HTTPS (Caddy)

On a small Linux server with Docker and a domain that points at it. Caddy gets and renews the certificate by itself.

```yaml
# docker-compose.override.yml
services:
  app:
    environment:
      PUBLIC_URL: https://learn.example.com
      TRUST_PROXY: "1"
      BASIC_AUTH_USER: owner
      BASIC_AUTH_PASSWORD: change-this-to-a-long-passphrase
    ports: !reset []
  caddy:
    image: caddy:2
    restart: unless-stopped
    ports: ["80:80", "443:443"]
    volumes:
      - ./Caddyfile:/etc/caddy/Caddyfile:ro
      - caddy-data:/data
volumes:
  caddy-data:
```

```text
# Caddyfile
learn.example.com {
  reverse_proxy app:4000
}
```

Then `docker compose up -d`. This setup is a template that has not been run by the author. Keep the passphrase out of git: use `.env.docker` (ignored by git) and `${BASIC_AUTH_PASSWORD}` instead of writing it in the file.

## Fly.io

[fly.toml](../fly.toml) is a ready template with a volume, a health check and `TRUST_PROXY`. It has not been run by the author.

```bash
fly launch --no-deploy --copy-config      # choose your own app name, then edit app and PUBLIC_URL in fly.toml
fly volumes create dlos_data --size 1 --region bom
fly secrets set BASIC_AUTH_USER=owner BASIC_AUTH_PASSWORD='a-long-passphrase'
fly deploy
```

SQLite needs exactly one machine that owns the volume, so do not scale it out.

## Render

[render.yaml](../render.yaml) is a blueprint: New, Blueprint, pick the repository, and enter the sign-in values when asked. It has not been run by the author. A persistent disk needs a paid plan. On a free plan the file system is erased on every deploy and restart, which would delete your progress, so do not use a free plan for this app.

## Hosting the web app separately

Not recommended, because the single image is simpler. If you still want the front end on a static host such as Vercel or Netlify, the app calls the API with relative `/api/...` URLs, so the host has to proxy them. On Vercel that is a rewrite in `vercel.json`:

```json
{ "rewrites": [{ "source": "/api/:path*", "destination": "https://api.example.com/api/:path*" }] }
```

The API then sees the static host as the browser origin and its own address as the host name. Set `PUBLIC_URL=https://api.example.com` and `ALLOWED_ORIGINS=https://your-site.vercel.app` on the API.

## Backups

The database runs in WAL mode, so copying `dlos.sqlite` while the app is running can lose recent changes. The image includes a script that uses SQLite's backup API and is safe at any time:

```bash
docker compose exec app node docker-backup.mjs                 # writes /data/backups/dlos-<time>.sqlite
docker compose cp app:/data/backups/dlos-<time>.sqlite ./       # copy it out of the container
```

For a server, run the first command from cron and copy the files somewhere else.

To restore, stop the app, then use a short-lived container to remove the old write-ahead files, put the backup in place and give it back to the app user (uid 1000). The volume is named `<project>_dlos-data`, which is `developer-learning-os_dlos-data` for this repository:

```bash
docker compose stop app
docker run --rm -v developer-learning-os_dlos-data:/data -v "$PWD":/backup alpine sh -c "rm -f /data/dlos.sqlite-wal /data/dlos.sqlite-shm && cp /backup/dlos-<time>.sqlite /data/dlos.sqlite && chown 1000:1000 /data/dlos.sqlite"
docker compose start app
```

## Checks

`node scripts/smoke.mjs <url>` checks a running instance: health, the web app, deep links, a lesson with videos, the English track, the practice problems and a save round trip. It writes one harmless setting (the theme) and puts it back. For an instance with sign-in, pass the credentials with `BASIC_AUTH=user:password`.

The same Docker image is built on every pull request by the `Docker image` workflow, and `CI` runs typecheck, lint, tests, the build and the Playwright suite.
