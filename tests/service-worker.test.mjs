import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import http from 'node:http';
import { once } from 'node:events';

const source = fs.readFileSync(new URL('../service-worker.js', import.meta.url), 'utf8');

async function fixture(t) {
  const server = http.createServer((request, response) => {
    if (request.url === '/members.html' || request.url === '/ratings-overview.html' || request.url === '/index.html') {
      response.writeHead(308, { Location: request.url === '/members.html' ? '/members' : request.url === '/ratings-overview.html' ? '/ratings-overview' : '/' });
      response.end();
    } else {
      response.setHeader('Content-Type', 'text/html');
      response.setHeader('X-Content-Type-Options', 'nosniff');
      response.end('<!doctype html><title>Fixture</title>Working page');
    }
  });
  server.listen(0, '127.0.0.1');
  await once(server, 'listening');
  t.after(() => { server.closeAllConnections(); server.close(); });
  const origin = 'http://127.0.0.1:' + server.address().port;
  const stores = new Map(), listeners = {};
  let online = true;
  const cache = name => {
    if (!stores.has(name)) stores.set(name, new Map());
    const entries = stores.get(name);
    const key = value => new URL(typeof value === 'string' ? value : value.url, origin).href;
    return { put: async (request, response) => entries.set(key(request), response.clone()), match: async request => entries.get(key(request))?.clone(), entries };
  };
  const context = {
    self: { location: { origin }, addEventListener: (type, listener) => { listeners[type] = listener; }, clients: { claim: async () => {} }, skipWaiting: async () => {} },
    caches: { open: async name => cache(name), keys: async () => [...stores.keys()], delete: async name => stores.delete(name) },
    fetch: async (input, options) => { if (!online) throw Error('offline'); return fetch(new URL(typeof input === 'string' ? input : input.url, origin), options); },
    URL, Response,
  };
  vm.runInNewContext(source, context);
  const wait = async type => { let pending; listeners[type]({ waitUntil: promise => { pending = promise; } }); await pending; };
  await wait('install');
  return { origin, stores, cache, wait, offline: () => { online = false; }, request(path, extra = {}) {
    let pending;
    listeners.fetch({ request: { method: 'GET', url: origin + path, redirect: 'manual', mode: 'navigate', ...extra }, respondWith: promise => { pending = promise; } });
    return pending;
  } };
}

test('cached HTML redirects are safe for browser navigation, including the old members link', async t => {
  const f = await fixture(t);
  for (const path of ['/members.html', '/ratings-overview.html', '/index.html']) {
    const response = await f.request(path);
    assert.ok(response, path + ' is handled');
    assert.equal(response.redirected, false, path + ': browser navigation cannot use a followed redirect response');
    assert.equal(response.status, 200);
    assert.equal(response.headers.get('X-Content-Type-Options'), 'nosniff');
    assert.match(await response.text(), /Working page/);
  }
});

test('canonical members route works repeatedly from cache, including when origin is offline', async t => {
  const f = await fixture(t);
  f.offline();
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await f.request('/members');
    assert.ok(response, 'canonical members route belongs to shell');
    assert.equal(response.redirected, false);
    assert.equal(response.status, 200);
  }
});

test('redirect responses fetched after a cache miss are normalized before returning and caching', async t => {
  const f = await fixture(t);
  for (const entries of f.stores.values()) entries.delete(f.origin + '/members.html');
  const first = await f.request('/members.html');
  assert.equal(first.redirected, false);
  f.offline();
  const second = await f.request('/members.html');
  assert.equal(second.redirected, false);
  assert.match(await second.text(), /Working page/);
});

test('activation removes old shell caches while preserving unrelated caches', async t => {
  const f = await fixture(t);
  f.cache('bbb-shell-v1'); f.cache('unrelated-cache');
  await f.wait('activate');
  assert.equal(f.stores.has('bbb-shell-v1'), false);
  assert.equal(f.stores.has('unrelated-cache'), true);
});

test('authentication, API calls, external assets and non-GET requests are not cached', async t => {
  const f = await fixture(t);
  assert.equal(f.request('/runtime-config.js'), undefined);
  assert.equal(f.request('/functions/v1/invite-member'), undefined);
  assert.equal(f.request('/members', { method: 'POST' }), undefined);
  assert.equal(f.request('/members', { url: 'https://other.example/members' }), undefined);
});

test('overview route and script remain available from the offline shell', async t => {
  const f=await fixture(t);f.offline();
  for(const path of ['/ratings-overview','/ratings-overview.html','/ratings-overview.js']){const response=await f.request(path);assert.ok(response);assert.equal(response.status,200);assert.equal(response.redirected,false);}
});
