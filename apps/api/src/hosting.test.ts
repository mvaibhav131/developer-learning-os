import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { loadConfig } from './config/env';
import { createTestApp, type TestApp } from './test/helpers';

const PASSWORD = 'correct horse battery staple';
const baseEnv = { NODE_ENV: 'test', APP_TIMEZONE: 'Asia/Kolkata' };
const basic = (user: string, password: string) => `Basic ${Buffer.from(`${user}:${password}`).toString('base64')}`;

let t: TestApp | undefined;
const folders: string[] = [];
afterEach(() => {
  t?.close();
  t = undefined;
  for (const folder of folders.splice(0)) rmSync(folder, { recursive: true, force: true });
});

function makeWebDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), 'dlos-web-'));
  folders.push(dir);
  mkdirSync(path.join(dir, 'assets'));
  writeFileSync(path.join(dir, 'index.html'), '<!doctype html><title>app</title><div id="root"></div>');
  writeFileSync(path.join(dir, 'assets', 'index-abc123.js'), 'console.log("app")');
  writeFileSync(path.join(dir, 'assets', 'runner.worker-abc123.js'), 'self.onmessage = () => {}');
  return dir;
}

describe('hosting the web app from the API', () => {
  it('serves the app and its routes with a policy that allows YouTube embeds', async () => {
    t = createTestApp({ env: { WEB_DIST_DIR: makeWebDir() } });

    const home = await t.request.get('/').expect(200);
    expect(home.text).toContain('<div id="root">');
    expect(home.headers['cache-control']).toBe('no-cache');
    const policy = String(home.headers['content-security-policy']);
    expect(policy).toContain('frame-src https://www.youtube-nocookie.com');
    expect(policy).not.toContain('unsafe-eval');
    expect(policy).not.toContain('upgrade-insecure-requests');
    expect(home.headers['referrer-policy']).toBe('strict-origin-when-cross-origin');

    // Deep links belong to the single-page app.
    expect((await t.request.get('/lessons/big-o-analysis').expect(200)).text).toContain('<div id="root">');
    expect((await t.request.get('/practice/two-sum').expect(200)).text).toContain('<div id="root">');
  });

  it('caches hashed assets for a year and lets only the practice worker evaluate code', async () => {
    t = createTestApp({ env: { WEB_DIST_DIR: makeWebDir() } });

    const script = await t.request.get('/assets/index-abc123.js').expect(200);
    expect(script.headers['cache-control']).toBe('public, max-age=31536000, immutable');
    expect(String(script.headers['content-security-policy'])).not.toContain('unsafe-eval');

    const worker = await t.request.get('/assets/runner.worker-abc123.js').expect(200);
    expect(String(worker.headers['content-security-policy'])).toContain("script-src 'self' 'unsafe-eval'");

    const missing = await t.request.get('/assets/missing.js').expect(404);
    expect(missing.body.error.code).toBe('not_found');
  });

  it('keeps the API untouched: JSON 404s for unknown API routes and no pages for other methods', async () => {
    t = createTestApp({ env: { WEB_DIST_DIR: makeWebDir() } });

    await t.request.get('/api/v1/health').expect(200);
    const unknown = await t.request.get('/api/v1/nope').expect(404);
    expect(unknown.body.error.code).toBe('not_found');
    await t.request.post('/lessons/anything').send({}).expect(404);
  });

  it('serves no pages when no web folder is configured', async () => {
    t = createTestApp();
    const res = await t.request.get('/').expect(404);
    expect(res.body.error.code).toBe('not_found');
  });

  it('refuses to start when the web folder has no index.html', () => {
    const empty = mkdtempSync(path.join(tmpdir(), 'dlos-empty-'));
    folders.push(empty);
    expect(() => loadConfig({ ...baseEnv, WEB_DIST_DIR: empty }, process.cwd())).toThrow(/index\.html/);
  });
});

describe('basic auth', () => {
  const protectedEnv = () => ({ WEB_DIST_DIR: makeWebDir(), BASIC_AUTH_USER: 'owner', BASIC_AUTH_PASSWORD: PASSWORD });

  it('protects the app, the API and the docs, but not the health check', async () => {
    t = createTestApp({ env: protectedEnv() });

    const denied = await t.request.get('/api/v1/dashboard').expect(401);
    expect(String(denied.headers['www-authenticate'])).toContain('Basic realm=');
    expect(denied.body.error.code).toBe('unauthorized');
    await t.request.get('/').expect(401);
    await t.request.get('/api/docs/').expect(401);
    await t.request.get('/api/openapi.json').expect(401);
    await t.request.get('/api/v1/health').expect(200);

    await t.request.get('/api/v1/dashboard').set('Authorization', basic('owner', PASSWORD)).expect(200);
    await t.request.get('/').set('Authorization', basic('owner', PASSWORD)).expect(200);
  });

  it('rejects wrong users, wrong passwords and other schemes', async () => {
    t = createTestApp({ env: protectedEnv() });

    await t.request.get('/api/v1/dashboard').set('Authorization', basic('owner', 'wrong password here')).expect(401);
    await t.request.get('/api/v1/dashboard').set('Authorization', basic('someone', PASSWORD)).expect(401);
    await t.request.get('/api/v1/dashboard').set('Authorization', 'Bearer abc.def.ghi').expect(401);
    await t.request.get('/api/v1/dashboard').set('Authorization', 'Basic !!!').expect(401);
  });

  it('blocks an address after too many failed attempts', async () => {
    t = createTestApp({ env: protectedEnv() });

    for (let attempt = 0; attempt < 20; attempt += 1) {
      await t.request.get('/api/v1/dashboard').set('Authorization', basic('owner', 'not the password')).expect(401);
    }
    const blocked = await t.request.get('/api/v1/dashboard').set('Authorization', basic('owner', PASSWORD)).expect(429);
    expect(blocked.body.error.code).toBe('rate_limited');
    await t.request.get('/api/v1/health').expect(200);
  });

  it('needs both a user and a long password, and treats blank values as unset', () => {
    expect(() => loadConfig({ ...baseEnv, BASIC_AUTH_USER: 'owner' }, process.cwd())).toThrow(/BASIC_AUTH_USER/);
    expect(() => loadConfig({ ...baseEnv, BASIC_AUTH_USER: 'owner', BASIC_AUTH_PASSWORD: 'short' }, process.cwd())).toThrow(
      /at least 12/,
    );
    expect(() => loadConfig({ ...baseEnv, BASIC_AUTH_USER: 'a:b', BASIC_AUTH_PASSWORD: PASSWORD }, process.cwd())).toThrow(
      /colon/,
    );
    expect(
      loadConfig({ ...baseEnv, BASIC_AUTH_USER: '', BASIC_AUTH_PASSWORD: '', WEB_DIST_DIR: '', PUBLIC_URL: '' }, process.cwd()),
    ).toMatchObject({ basicAuth: null, webDistDir: null });
  });
});

describe('public URL', () => {
  it('allows the host and origin of the deployed site, and nothing else', async () => {
    t = createTestApp({ env: { PUBLIC_URL: 'https://learn.example.com' } });

    await t.request.get('/api/v1/health').set('Host', 'learn.example.com').expect(200);
    await t.request
      .patch('/api/v1/preferences')
      .set('Host', 'learn.example.com')
      .set('Origin', 'https://learn.example.com')
      .send({ theme: 'dark' })
      .expect(200);
    await t.request.get('/api/v1/health').set('Host', 'evil.example.net').expect(403);
    await t.request
      .patch('/api/v1/preferences')
      .set('Host', 'learn.example.com')
      .set('Origin', 'https://evil.example.net')
      .send({ theme: 'light' })
      .expect(403);
  });

  it('falls back to the URL that Render provides', () => {
    const config = loadConfig({ ...baseEnv, RENDER_EXTERNAL_URL: 'https://dlos.onrender.com' }, process.cwd());
    expect(config.allowedHosts).toContain('dlos.onrender.com');
    expect(config.allowedOrigins).toContain('https://dlos.onrender.com');
  });
});
