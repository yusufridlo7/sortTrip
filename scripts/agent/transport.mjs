// Responses never leave this module unfiltered except update objects sent to allowlist checking.
export async function getUpdates(env, offset, fetcher = fetch) {
  try {
    const response = await fetcher(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN.trim()}/getUpdates`, {
      method: 'POST', redirect: 'error', headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({offset, timeout: 20, limit: 100, allowed_updates: ['message']}),
      signal: AbortSignal.timeout(30000),
    });
    const body = await response.json();
    return response.ok && body.ok === true && Array.isArray(body.result) ? body.result : null;
  } catch { return null; }
}
