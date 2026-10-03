import test from 'node:test';
import assert from 'node:assert/strict';
import {notifyTelegram, defaultTelegramMessage, telegramMessageFromArgs} from '../scripts/telegram-notify.mjs';

const env = {TELEGRAM_BOT_TOKEN: 'dummy-test-token', TELEGRAM_CHAT_ID: 'dummy-chat'};

test('no CLI arguments send the default test message; explicit messages are preserved', async () => {
  assert.equal(telegramMessageFromArgs([]), '🤖 SortTrip Agent\n✅ Sistem notifikasi Telegram berhasil terhubung.');
  assert.equal(telegramMessageFromArgs(['Status', 'selesai']), 'Status selesai');
  assert.deepEqual(await notifyTelegram(telegramMessageFromArgs([]), {env, fetcher: async (_url, options) => {
    assert.equal(JSON.parse(options.body).text, defaultTelegramMessage);
    return {ok: true, json: async () => ({ok: true})};
  }}), {ok: true});
});

test('missing configuration does not send a request', async () => {
  assert.deepEqual(await notifyTelegram('Ready', {env: {}, fetcher: () => assert.fail('unexpected request')}), {ok: false, code: 'NOT_CONFIGURED'});
});
test('sends a plain text notification using injected configuration', async () => {
  const result = await notifyTelegram('SortTrip Agent ready', {env, fetcher: async (url, options) => {
    assert.equal(url, 'https://api.telegram.org/botdummy-test-token/sendMessage');
    assert.equal(options.method, 'POST');
    assert.deepEqual(JSON.parse(options.body), {chat_id: 'dummy-chat', text: 'SortTrip Agent ready', link_preview_options: {is_disabled: true}});
    return {ok: true, json: async () => ({ok: true})};
  }});
  assert.deepEqual(result, {ok: true});
});
test('network exceptions and Telegram errors are sanitized', async () => {
  assert.deepEqual(await notifyTelegram('Ready', {env, fetcher: async () => {throw Error(env.TELEGRAM_BOT_TOKEN);}}), {ok: false, code: 'NETWORK_FAILED'});
  for (const fetcher of [async () => ({ok: false, json: async () => ({})}), async () => ({ok: true, json: async () => ({ok: false, description: env.TELEGRAM_BOT_TOKEN})})]) {
    assert.deepEqual(await notifyTelegram('Ready', {env, fetcher}), {ok: false, code: 'DELIVERY_FAILED'});
  }
});
test('only safe Telegram diagnostics are exposed', async () => {
  for (const description of ['Unauthorized', env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID, 'unexpected arbitrary API text']) {
    const result = await notifyTelegram('Ready', {env, fetcher: async () => ({ok: false, status: 401, json: async () => ({ok: false, error_code: 401, description})})});
    assert.deepEqual(result, {ok: false, code: 'DELIVERY_FAILED', httpStatus: 401, telegramErrorCode: 401, ...(description === 'Unauthorized' ? {description} : {})});
  }
});
test('invalid or credential-containing messages never send', async () => {
  for (const text of ['', 'x'.repeat(4097), env.TELEGRAM_BOT_TOKEN, env.TELEGRAM_CHAT_ID]) {
    assert.equal((await notifyTelegram(text, {env, fetcher: () => assert.fail('unexpected request')})).ok, false);
  }
});
