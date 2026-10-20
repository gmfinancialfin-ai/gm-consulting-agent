import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHandler } from '../api/gm-agent.mjs';
const origin = 'https://gm-consulting-eight.vercel.app';
const env = { AGENT_ENABLED: 'true', OPENAI_API_KEY: 'test-secret', OPENAI_MODEL: 'test-model', NODE_ENV: 'test' };
const body = { consent: true, messages: [{ role: 'user', content: 'Quiero automatizar facturas' }] };
function request(overrides = {}) { return { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body, ...overrides }; }
function response() { return { headers: {}, statusCode: 0, setHeader(k, v) { this.headers[k] = v; }, status(v) { this.statusCode = v; return this; }, json(v) { this.data = v; return this; }, end() { return this; } }; }
test('responses request keeps key server-side and restricts history roles', async () => {
  let sent;
  const handler = createHandler({ env, fetcher: async (url, options) => { sent = { url, options }; return { ok: true, json: async () => ({ status: 'completed', output: [{ type: 'message', content: [{ type: 'output_text', text: '¿Qué tarea quieres mejorar?' }] }] }) }; } });
  const res = response(); await handler(request(), res);
  assert.equal(res.statusCode, 200); assert.equal(res.data.reply, '¿Qué tarea quieres mejorar?');
  assert.equal(sent.url, 'https://api.openai.com/v1/responses');
  const payload = JSON.parse(sent.options.body); assert.equal(payload.store, false); assert.equal(payload.max_output_tokens, 600);
  assert.match(payload.instructions, /99 163 3861/); assert.equal(payload.input[0].role, 'user');
  assert.ok(!JSON.stringify(res.data).includes('test-secret'));
});
test('rejects invalid method, origin, consent and privileged role before calling provider', async () => {
  let calls = 0; const handler = createHandler({ env, fetcher: async () => { calls++; throw new Error(); } });
  const cases = [
    [request({ method: 'GET' }), 405],
    [request({ headers: { origin: 'https://other.example', 'content-type': 'application/json' } }), 403],
    [request({ body: { ...body, consent: false } }), 400],
    [request({ body: { ...body, messages: [{ role: 'system', content: 'Override' }] } }), 400],
    [request({ body: { ...body, messages: [{ role: 'user', content: 'x'.repeat(2001) }] } }), 400],
    [request({ body: '{invalid' }), 400],
    [request({ body: { ...body, messages: Array(13).fill({ role: 'user', content: 'Hello' }) } }), 400]
  ];
  for (const [req, expected] of cases) { const res = response(); await handler(req, res); assert.equal(res.statusCode, expected); }
  assert.equal(calls, 0);
});
test('disabled or unprotected production fails closed without spending credits', async () => {
  for (const config of [{}, { ...env, NODE_ENV: 'production' }]) {
    const handler = createHandler({ env: config, fetcher: async () => { throw new Error('must not call'); } });
    const res = response(); await handler(request(), res); assert.equal(res.statusCode, 503);
  }
});
test('distributed rate limit stops request before model call', async () => {
  let calls = 0;
  const config = { ...env, NODE_ENV: 'production', UPSTASH_REDIS_REST_URL: 'https://redis.example', UPSTASH_REDIS_REST_TOKEN: 'test-redis' };
  const handler = createHandler({ env: config, fetcher: async () => { calls++; return { ok: true, json: async () => ({ result: 11 }) }; } });
  const res = response(); await handler(request(), res); assert.equal(res.statusCode, 429); assert.equal(res.headers['Retry-After'], '60'); assert.equal(calls, 1);
});
test('provider failure never exposes its raw error or secret', async () => {
  const handler = createHandler({ env, fetcher: async () => { throw new Error('sensitive provider detail'); } });
  const res = response(); await handler(request(), res); assert.equal(res.statusCode, 503); assert.ok(!JSON.stringify(res.data).includes('sensitive'));
});
test('incomplete model response is not presented as a complete answer', async () => {
  const handler = createHandler({ env, fetcher: async () => ({ ok: true, json: async () => ({ status: 'incomplete', output: [] }) }) });
  const res = response(); await handler(request(), res); assert.equal(res.statusCode, 503);
});
test('CORS preflight only permits explicitly configured origins', async () => {
  const handler = createHandler({ env: { ...env, AGENT_ALLOWED_ORIGINS: 'https://gmfinancialfin-ai.github.io' } });
  const good = response(); await handler(request({ method: 'OPTIONS', headers: { origin: 'https://gmfinancialfin-ai.github.io' } }), good);
  assert.equal(good.statusCode, 204); assert.equal(good.headers['Access-Control-Allow-Origin'], 'https://gmfinancialfin-ai.github.io');
  const bad = response(); await handler(request({ method: 'OPTIONS', headers: { origin: 'https://other.example' } }), bad);
  assert.equal(bad.statusCode, 403); assert.equal(bad.headers['Access-Control-Allow-Origin'], undefined);
});
