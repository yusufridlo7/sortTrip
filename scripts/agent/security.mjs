export function authorized(update, env) {
  const message = update.message;
  return Boolean(message && !message.from?.is_bot && !message.forward_origin &&
    env.TELEGRAM_CHAT_ID?.trim() && String(message.chat?.id) === env.TELEGRAM_CHAT_ID.trim());
}

// Conservative rejection before persistence. No filter can recognize every secret:
// users must send instructions only, never credential values or private data.
export function safeInstruction(text, env = {}) {
  if (typeof text !== 'string' || !text.trim() || text.length > 2000) return false;
  if (Object.entries(env).some(([name, value]) =>
    /TOKEN|SECRET|PASSWORD|KEY|CHAT_ID|COOKIE|SESSION/i.test(name) &&
    typeof value === 'string' && value.trim() && text.includes(value.trim()))) return false;
  if (/(?:password|passwd|otp|api[_ -]?key|token|secret|cookie|session[_ -]?id|recovery[_ -]?code)\s*[:=]\s*\S+/i.test(text)) return false;
  const withoutTaskIds = text.replace(/\bt-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\b/g, 'TASK');
  if (/\b(?:Bearer\s+\S+|\d{6}|\d{8,12}:[A-Za-z0-9_-]+|[A-Za-z0-9_/-]{32,})\b/.test(withoutTaskIds)) return false;
  return true;
}

export const services = new Set(['SortTrip', 'Codex', 'Viator', 'Telegram', 'Supabase', 'OpenAI', 'Midtrans', 'Other']);
export const actions = new Set(['Authentication required', 'OTP required', '2FA required', 'CAPTCHA required',
  'Authorization required', 'API credential required', 'Payment required', 'Billing approval required',
  'Sensitive approval required', 'Irreversible action approval required', 'Local agent handoff required',
  'Verify application state', 'Restart verification required']);
