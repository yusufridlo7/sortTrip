import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join, resolve} from 'node:path';
import {TaskQueue} from '../scripts/agent/queue.mjs';
import {handleUpdate} from '../scripts/agent/controller.mjs';
import {runNext, verifyResume} from '../scripts/agent/runner.mjs';
import {notification, flushNotifications} from '../scripts/agent/notifications.mjs';
import {safeInstruction} from '../scripts/agent/security.mjs';
import {getUpdates} from '../scripts/agent/transport.mjs';

const env = {TELEGRAM_BOT_TOKEN: 'dummy-test-token', TELEGRAM_CHAT_ID: '12345'};
function update(update_id, text, authorized = true) {
  return {update_id, message: {text, chat: {id: authorized ? 12345 : 99999, type: 'private'}, from: {is_bot: false}}};
}
async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'sorttrip-agent-test-'));
  t.after(async () => {
    if (!resolve(dir).startsWith(resolve(tmpdir()) + '\\') && !resolve(dir).startsWith(resolve(tmpdir()) + '/')) throw Error('Unsafe cleanup');
    await rm(dir, {recursive: true, force: true});
  });
  const q = new TaskQueue(dir); await q.load(); return q;
}

test('unauthorized, forwarded and bot updates cannot enqueue or receive replies', async t => {
  const q = await fixture(t);
  handleUpdate(q, update(1, '/task Periksa health lokal SortTrip', false), env);
  const forwarded = update(2, '/status'); forwarded.message.forward_origin = {};
  handleUpdate(q, forwarded, env);
  const bot = update(3, '/status'); bot.message.from.is_bot = true;
  handleUpdate(q, bot, env);
  assert.equal(q.state.tasks.length, 0); assert.equal(q.state.outbox.length, 0);
  assert.equal(q.state.offset, 4);
});
test('/status and /help do not reflect message content or chat identifiers', async t => {
  const q = await fixture(t);
  handleUpdate(q, update(1, '/status'), env); handleUpdate(q, update(2, '/help'), env);
  const messages = q.state.outbox.map(notification);
  assert.match(messages[0], /IDLE/); assert.match(messages[1], /\/resume/);
  assert.equal(messages.join('').includes(env.TELEGRAM_CHAT_ID), false);
});
test('/task read-only health emits received, started and TASK_COMPLETED', async t => {
  const q = await fixture(t);
  handleUpdate(q, update(1, '/task Periksa health lokal SortTrip'), env);
  const urls = [];
  await runNext(q, {fetcher: async url => { urls.push(url); return {ok: true, json: async () => ({ok: true})}; }});
  assert.deepEqual(urls, ['http://127.0.0.1:5173/', 'http://127.0.0.1:5173/api/health']);
  assert.equal(q.state.tasks[0].status, 'COMPLETED');
  assert.deepEqual(q.state.outbox.map(e => e.kind), ['TASK_RECEIVED','TASK_STARTED','TASK_COMPLETED']);
  assert.match(notification(q.state.outbox.at(-1)), /TASK_COMPLETED/);
});
test('general task waits; /resume requires independent application verification', async t => {
  const q = await fixture(t);
  handleUpdate(q, update(1, '/task Periksa integrasi Viator dan lakukan smoke test.'), env);
  await runNext(q, {fetcher: () => assert.fail('general task must not execute')});
  const task = q.state.tasks[0];
  assert.equal(task.status, 'WAITING_FOR_USER');
  q.set(task, 'WAITING_FOR_USER', {service: 'Viator', action: 'Authentication required'});
  assert.match(notification(q.state.outbox.at(-1)), /AUTH_REQUIRED[\s\S]*Viator[\s\S]*Authentication required/);
  handleUpdate(q, update(2, `/resume ${task.id}`), env);
  assert.equal(task.status, 'WAITING_FOR_USER');
  assert.equal(await verifyResume(q, task.id, async () => false), false);
  assert.equal(task.status, 'WAITING_FOR_USER');
  handleUpdate(q, update(3, `/resume ${task.id}`), env);
  assert.equal(await verifyResume(q, task.id, async () => {throw Error('private browser error');}), false);
  assert.equal(task.status, 'WAITING_FOR_USER');
  handleUpdate(q, update(4, `/resume ${task.id}`), env);
  let inspected = false;
  assert.equal(await verifyResume(q, task.id, async () => {inspected = true; return true;}), true);
  assert.equal(inspected, true); assert.equal(task.status, 'RUNNING');
  q.set(task, 'COMPLETED', {result: 'OWNER_VERIFIED_COMPLETE'});
  assert.match(notification(q.state.outbox.at(-1)), /TASK_COMPLETED/);
});
test('queue survives restart, deduplicates updates, recovers interrupted tasks', async t => {
  const q = await fixture(t); handleUpdate(q, update(1, '/task Periksa health lokal SortTrip'), env);
  q.set(q.state.tasks[0], 'RUNNING'); await q.save();
  const restored = new TaskQueue(q.directory); await restored.load();
  assert.equal(restored.state.tasks[0].status, 'WAITING_FOR_USER');
  handleUpdate(restored, update(1, '/task Duplicate'), env);
  assert.equal(restored.state.tasks.length, 1);
});
test('cancel is safe at queued/waiting states; running requests are deferred', async t => {
  const q = await fixture(t); handleUpdate(q, update(1, '/task Review project'), env);
  handleUpdate(q, update(2, '/cancel'), env); assert.equal(q.state.tasks[0].status, 'CANCELLED');
  handleUpdate(q, update(3, '/task Review again'), env);
  q.set(q.state.tasks[1], 'RUNNING');
  handleUpdate(q, update(4, '/cancel'), env);
  assert.equal(q.state.tasks[1].status, 'RUNNING'); assert.equal(q.state.tasks[1].cancelRequested, true);
});
test('credentials rejected before persistence; unsafe summaries never leave notifier', async t => {
  const q = await fixture(t);
  for (const text of [env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, 'password=private', 'OTP: 654321', 'cookie=private']) {
    assert.equal(safeInstruction(text, env), false);
  }
  handleUpdate(q, update(1, `/task ${env.TELEGRAM_BOT_TOKEN}`), env);
  assert.equal(q.state.tasks.length, 0);
  for (const kind of ['TASK_COMPLETED','TASK_FAILED','AUTH_REQUIRED']) {
    const text = notification({kind, summary: env.TELEGRAM_BOT_TOKEN, service: env.TELEGRAM_BOT_TOKEN, action: env.TELEGRAM_CHAT_ID});
    assert.equal(text.includes(env.TELEGRAM_BOT_TOKEN), false); assert.equal(text.includes(env.TELEGRAM_CHAT_ID), false);
  }
});
test('failed health uses TASK_FAILED; outbox persists until delivery succeeds', async t => {
  const q = await fixture(t); handleUpdate(q, update(1, '/task Periksa health lokal SortTrip'), env);
  await runNext(q, {fetcher: async () => {throw Error('private request details');}});
  assert.equal(q.state.tasks[0].status, 'FAILED'); assert.match(notification(q.state.outbox.at(-1)), /TASK_FAILED/);
  const pending = q.state.outbox.length;
  assert.equal(await flushNotifications(q, env, async () => ({ok: false})), false);
  assert.equal(q.state.outbox.length, pending);
  assert.equal(await flushNotifications(q, env, async () => ({ok: true})), true);
  assert.equal(q.state.outbox.length, 0);
});
test('getUpdates uses POST and offset, never exposes raw API errors', async () => {
  assert.deepEqual(await getUpdates(env, 50, async (url, options) => {
    assert.equal(url, 'https://api.telegram.org/botdummy-test-token/getUpdates');
    assert.equal(options.method, 'POST'); assert.equal(JSON.parse(options.body).offset, 50);
    return {ok: true, json: async () => ({ok: true, result: []})};
  }), []);
  assert.equal(await getUpdates(env, 50, async () => {throw Error(env.TELEGRAM_BOT_TOKEN);}), null);
});
