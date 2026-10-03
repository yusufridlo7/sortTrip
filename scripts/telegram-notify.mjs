import {pathToFileURL} from 'node:url';

export const defaultTelegramMessage = '🤖 SortTrip Agent\n✅ Sistem notifikasi Telegram berhasil terhubung.';

export function telegramMessageFromArgs(args) {
  return args.length === 0 ? defaultTelegramMessage : args.join(' ');
}

export function telegramConfigured(env = process.env) {
  return Boolean(env.TELEGRAM_BOT_TOKEN?.trim() && env.TELEGRAM_CHAT_ID?.trim());
}

const safeDescriptions = new Set([
  'Unauthorized',
  'Not Found',
  'Bad Request: chat not found',
  'Bad Request: message text is empty',
  'Bad Request: message is too long',
  'Forbidden: bot was blocked by the user',
  'Forbidden: user is deactivated',
  'Forbidden: bot was kicked from the group chat',
  'Forbidden: bot is not a member of the channel chat',
]);

function deliveryFailure(response, result, env) {
  const failure = {ok: false, code: 'DELIVERY_FAILED'};
  if (Number.isInteger(response.status) && response.status >= 100 && response.status <= 599) {
    failure.httpStatus = response.status;
  }
  if (Number.isInteger(result?.error_code) && result.error_code >= 100 && result.error_code <= 599) {
    failure.telegramErrorCode = result.error_code;
  }
  // Exact allowlist only: never print arbitrary API text or reflected credentials.
  if (safeDescriptions.has(result?.description) &&
      !result.description.includes(env.TELEGRAM_BOT_TOKEN.trim()) &&
      !result.description.includes(env.TELEGRAM_CHAT_ID.trim())) {
    failure.description = result.description;
  }
  return failure;
}

// Only call from a local agent process. Never import into the frontend.
export async function notifyTelegram(text, {env = process.env, fetcher = fetch} = {}) {
  if (!telegramConfigured(env)) return {ok: false, code: 'NOT_CONFIGURED'};
  if (typeof text !== 'string' || !text.trim() || text.length > 4096) {
    return {ok: false, code: 'INVALID_MESSAGE'};
  }
  // Prevent accidentally sending the configured credentials as message content.
  if (text.includes(env.TELEGRAM_BOT_TOKEN.trim()) || text.includes(env.TELEGRAM_CHAT_ID.trim())) {
    return {ok: false, code: 'SENSITIVE_MESSAGE'};
  }
  try {
    const response = await fetcher(
      `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}/sendMessage`,
      {
        method: 'POST',
        redirect: 'error',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({chat_id: env.TELEGRAM_CHAT_ID.trim(), text, link_preview_options: {is_disabled: true}}),
        signal: AbortSignal.timeout(10000),
      },
    );
    const result = await response.json().catch(() => null);
    return response.ok && result?.ok === true ? {ok: true} : deliveryFailure(response, result, env);
  } catch (error) {
    // Never propagate URLs, response bodies, or exception details containing secrets.
    return {ok: false, code: error?.name === 'TimeoutError' ? 'REQUEST_TIMEOUT' : 'NETWORK_FAILED'};
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  if (process.argv[2] === '--check') {
    const configured = telegramConfigured();
    console.log(configured ? 'Telegram: konfigurasi tersedia (belum diuji).' : 'Telegram: konfigurasi belum lengkap.');
    process.exitCode = configured ? 0 : 1;
  } else {
    const result = await notifyTelegram(telegramMessageFromArgs(process.argv.slice(2)));
    console.log(result.ok ? 'Notifikasi terkirim.' : `Notifikasi tidak terkirim: ${result.code}.`);
    if (result.httpStatus) console.log(`HTTP status: ${result.httpStatus}`);
    if (result.telegramErrorCode) console.log(`Telegram error code: ${result.telegramErrorCode}`);
    if (result.description) console.log(`Description: ${result.description}`);
    process.exitCode = result.ok ? 0 : 1;
  }
}
