import assert from 'node:assert/strict';
import handler from '../api/contact.js';

process.env.TELEGRAM_BOT_TOKEN = 'test-token';
process.env.TELEGRAM_CHAT_ID = 'test-chat';
const valid = { name: 'Тест', company: 'Aster', email: 'test@example.com', task: 'Проверка', consent: true };
const headers = { host: 'example.com', origin: 'https://example.com', 'content-type': 'application/json' };
let calls = 0;
const originalFetch = globalThis.fetch;
globalThis.fetch = async (url, options) => {
  calls++;
  const data = JSON.parse(options.body);
  assert.equal(data.chat_id, 'test-chat');
  assert.match(data.text, /Проверка/);
  assert.equal(data.parse_mode, undefined);
  return { ok: true, json: async () => ({ ok: true }) };
};
async function request(body = valid, method = 'POST', customHeaders = headers) {
  const response = { code: 200, setHeader() {}, status(code) { this.code = code; return this; }, json(data) { this.data = data; return this; } };
  await handler({ method, headers: customHeaders, body }, response);
  return response;
}
try {
  assert.equal((await request()).code, 200);
  assert.equal(calls, 1);
  assert.equal((await request({}, 'GET')).code, 405);
  assert.equal((await request(valid, 'POST', { ...headers, origin: 'https://evil.example' })).code, 403);
  assert.equal((await request({ ...valid, email: 'invalid' })).code, 400);
  assert.equal((await request({ ...valid, task: 'x'.repeat(2501) })).code, 400);
  assert.equal((await request({ ...valid, consent: false })).code, 400);
  assert.equal((await request({ ...valid, website: 'spam' })).code, 200);
  assert.equal(calls, 1);
  globalThis.fetch = async () => { throw new Error('offline'); };
  assert.equal((await request()).code, 502);
  delete process.env.TELEGRAM_BOT_TOKEN;
  assert.equal((await request()).code, 503);
  console.log('PASS contact validation, origin, honeypot, delivery and failure handling');
} finally { globalThis.fetch = originalFetch; }
