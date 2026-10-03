// Server-only Basic Access adapter. Never forward provider errors or credentials.
const reply = (body, status = 200) => Response.json(body, {status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
}});
const hosts = {sandbox: 'https://api.sandbox.viator.com', production: 'https://api.viator.com'};
function configuration(env) {
  const environment = env.VIATOR_ENVIRONMENT || 'sandbox';
  return {environment, valid: Object.hasOwn(hosts, environment), configured: typeof env.VIATOR_API_KEY === 'string' && !!env.VIATOR_API_KEY.trim()};
}
function query(url) {
  const p = new URL(url).searchParams;
  const destination = p.get('destination') || '';
  if (!/^[1-9]\d{0,7}$/.test(destination)) throw new Error('INPUT');
  const start = Number(p.get('start') || 1), count = Number(p.get('count') || 10);
  if (!Number.isInteger(start) || start < 1 || start > 500 || !Number.isInteger(count) || count < 1 || count > 20) throw new Error('INPUT');
  return {filtering: {destination}, pagination: {start, count}, currency: 'IDR'};
}
function safeText(value, secret, limit) {
  return typeof value === 'string' && !value.includes(secret) ? value.slice(0, limit) : '';
}
function product(row, secret) {
  if (!row || typeof row !== 'object') return null;
  const code = safeText(row.productCode, secret, 80), title = safeText(row.title, secret, 250);
  const price = row.pricing?.summary?.fromPrice;
  if (!code || !title || !Number.isFinite(price) || price < 0 || row.pricing?.currency !== 'IDR') return null;
  let bookingUrl;
  try {
    const raw = safeText(row.productUrl, secret, 4000);
    const u = new URL(raw);
    if (u.protocol !== 'https:' || u.hostname !== 'www.viator.com' || u.port || u.username || u.password || !u.pathname.startsWith('/tours/')) return null;
    // Preserve provider-generated attribution parameters; never invent affiliate IDs.
    bookingUrl = u.href;
  } catch { return null; }
  return {productCode: code, title, description: safeText(row.description, secret, 1500),
    fromPrice: price, currency: 'IDR', bookingUrl};
}
export async function handleViator(request, env, {fetcher = fetch} = {}) {
  const url = new URL(request.url);
  if (request.method !== 'GET') return reply({code: 'METHOD_NOT_ALLOWED', error: 'Gunakan GET.'}, 405);
  const config = configuration(env);
  if (url.pathname === '/api/activities/health') return reply({provider: 'Viator', configured: config.configured,
    environment: config.valid ? config.environment : 'invalid', configurationValid: config.valid, connectionTested: false});
  if (url.pathname !== '/api/activities') return reply({code: 'NOT_FOUND'}, 404);
  let body;
  try { body = query(url); } catch { return reply({code: 'INVALID_QUERY', error: 'Gunakan ID destinasi Viator dan pagination yang valid.'}, 400); }
  if (!config.valid) return reply({code: 'INVALID_CONFIGURATION', error: 'Konfigurasi penyedia belum siap.'}, 503);
  if (!config.configured) return reply({code: 'VIATOR_NOT_CONFIGURED', error: 'Pencarian aktivitas belum tersedia.'}, 503);
  try {
    const response = await fetcher(hosts[config.environment] + '/partner/products/search', {
      method: 'POST', redirect: 'error', signal: AbortSignal.timeout(10000),
      headers: {'exp-api-key': env.VIATOR_API_KEY, 'Accept': 'application/json;version=2.0',
        'Accept-Language': 'en-US', 'Content-Type': 'application/json'}, body: JSON.stringify(body),
    });
    if (!response.ok) {
      const code = [401, 403].includes(response.status) ? 'VIATOR_AUTH_REQUIRED' : response.status === 429 ? 'VIATOR_RATE_LIMITED' : 'VIATOR_UNAVAILABLE';
      return reply({code, error: 'Penyedia aktivitas belum dapat melayani pencarian.'}, 502);
    }
    const data = await response.json();
    if (!data || !Array.isArray(data.products)) throw new Error('UPSTREAM');
    const products = data.products.slice(0, body.pagination.count).map(row => product(row, env.VIATOR_API_KEY)).filter(Boolean);
    return reply({provider: 'Viator', environment: config.environment, currency: 'IDR', products,
      fetchedAt: new Date().toISOString(), filteredCount: Math.min(data.products.length, body.pagination.count) - products.length,
      priceNote: 'Harga mulai, bukan kutipan final. Periksa tanggal, peserta, ketersediaan dan harga akhir di Viator.'});
  } catch { return reply({code: 'VIATOR_UNAVAILABLE', error: 'Penyedia aktivitas belum dapat dihubungi. Coba lagi.'}, 502); }
}
