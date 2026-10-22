// Server-only Basic Access adapter. Never forward provider errors or credentials.
const reply = (body, status = 200) => Response.json(body, {status, headers: {
  'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff',
}});
const hosts = {sandbox: 'https://api.sandbox.viator.com', production: 'https://api.viator.com'};
// Return fixed diagnostic categories only. Exception text can contain credentials.
function failureKind(error) {
  const name = error?.name;
  const message = typeof error?.message === 'string' ? error.message : '';
  if (name === 'TimeoutError' || name === 'AbortError') return 'timeout';
  if (/header|ByteString|invalid character/i.test(message)) return 'request-header';
  if (/redirect/i.test(message)) return 'redirect-blocked';
  if (/dns|resolve|network|connection|fetch failed|ssl|tls/i.test(message)) return 'network';
  return 'runtime';
}
function configuration(env) {
  const environment = env.VIATOR_ENVIRONMENT || 'sandbox';
  return {environment, valid: Object.hasOwn(hosts, environment), configured: typeof env.VIATOR_API_KEY === 'string' && !!env.VIATOR_API_KEY.trim()};
}
function query(url) {
  const p = new URL(url).searchParams;
  const destination = p.get('destination') || '';
  const start = Number(p.get('start') || 1), count = Number(p.get('count') || 10);
  if (!Number.isInteger(start) || start < 1 || start > 500 || !Number.isInteger(count) || count < 1 || count > 20) throw new Error('INPUT');
  const search = p.get('search');
  if (search !== null) {
    const term = search.trim();
    if (destination || term.length < 2 || term.length > 200 || /[\x00-\x1f\x7f]/.test(term)) throw new Error('INPUT');
    const city = (p.get('city') || '').trim();
    if (city && (city.length < 2 || city.length > 100 || /[\x00-\x1f\x7f]/.test(city))) throw new Error('INPUT');
    return {path:'/search/freetext', city, count, body:{searchTerm:term, searchTypes:[{searchType:'PRODUCTS',pagination:{start,count}}],currency:'IDR'}};
  }
  if (!/^[1-9]\d{0,7}$/.test(destination)) throw new Error('INPUT');
  return {path:'/products/search', count, body:{filtering: {destination}, pagination: {start, count}, currency: 'IDR'}};
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
  try { body = query(url); } catch { return reply({code: 'INVALID_QUERY', error: 'Gunakan pencarian atau ID destinasi Viator dan pagination yang valid.'}, 400); }
  if (!config.valid) return reply({code: 'INVALID_CONFIGURATION', error: 'Konfigurasi penyedia belum siap.'}, 503);
  if (!config.configured) return reply({code: 'VIATOR_NOT_CONFIGURED', error: 'Pencarian aktivitas belum tersedia.'}, 503);
  if (env.VIATOR_LIMITER) {
    const {success} = await env.VIATOR_LIMITER.limit({key:request.headers.get('CF-Connecting-IP') || 'unknown'});
    if (!success) return reply({code:'VIATOR_RATE_LIMITED',error:'Terlalu banyak pencarian. Coba kembali sebentar lagi.'},429);
  }
  let upstreamStatus;
  let failureStage = 'request';
  try {
    const signal=AbortSignal.timeout(15000);
    const supplierRequest = (path,payload) => fetcher(hosts[config.environment] + '/partner' + path, {
      method: 'POST', redirect: 'manual', signal,
      headers: {'exp-api-key': env.VIATOR_API_KEY, 'Accept': 'application/json;version=2.0',
        'Accept-Language': 'en-US', 'Content-Type': 'application/json'}, body: JSON.stringify(payload),
    });
    if (body.city) {
      const destinationResponse=await supplierRequest('/search/freetext',{searchTerm:body.city,searchTypes:[{searchType:'DESTINATIONS',pagination:{start:1,count:20}}],currency:'IDR'});
      if (!destinationResponse.ok) return reply({code:'VIATOR_UNAVAILABLE',upstreamStatus:destinationResponse.status,error:'Destinasi aktivitas belum dapat diperiksa.'},502);
      failureStage='response';
      const found=await destinationResponse.json();
      const destinations=found?.destinations?.results;
      const normalize=v=>typeof v==='string'?v.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase():'';
      const matches=Array.isArray(destinations)?destinations.filter(d=>normalize(d.name)===normalize(body.city)&&Number.isSafeInteger(d.id)&&d.id>0):[];
      if(matches.length!==1)return reply({code:'VIATOR_DESTINATION_REQUIRED',error:'Kota belum dapat dicocokkan secara pasti. Gunakan nama kota lain yang lebih spesifik.'},400);
      body.body.productFiltering={destination:String(matches[0].id)};
      failureStage='request';
    }
    const response = await supplierRequest(body.path,body.body);
    upstreamStatus = response.status;
    if (!response.ok) {
      if (response.status >= 300 && response.status < 400) {
        // Never follow redirects or return Location: it may contain sensitive data.
        let redirectCategory = 'other';
        try {
          const target = new URL(response.headers.get('Location'));
          if (target.hostname === 'viator.com' || target.hostname.endsWith('.viator.com')) redirectCategory = 'viator';
          else if (target.hostname === 'captcha-delivery.com' || target.hostname.endsWith('.captcha-delivery.com') || target.hostname === 'datadome.co' || target.hostname.endsWith('.datadome.co')) redirectCategory = 'access-challenge';
        } catch {}
        return reply({code:'VIATOR_REDIRECT_BLOCKED', upstreamStatus:response.status, redirectCategory, error:'Penyedia aktivitas mengalihkan koneksi. Pencarian belum tersedia.'},502);
      }
      const code = [401, 403].includes(response.status) ? 'VIATOR_AUTH_REQUIRED' : response.status === 429 ? 'VIATOR_RATE_LIMITED' : 'VIATOR_UNAVAILABLE';
      return reply({code, upstreamStatus: response.status, error: 'Penyedia aktivitas belum dapat melayani pencarian.'}, 502);
    }
    failureStage = 'response';
    const data = await response.json();
    const rows = body.path === '/search/freetext' ? data?.products?.results : data?.products;
    if (!Array.isArray(rows)) throw new Error('UPSTREAM');
    const products = rows.slice(0, body.count).map(row => product(row, env.VIATOR_API_KEY)).filter(Boolean);
    return reply({provider: 'Viator', environment: config.environment, currency: 'IDR', products,
      fetchedAt: new Date().toISOString(), filteredCount: Math.min(rows.length, body.count) - products.length,
      priceNote: 'Harga mulai, bukan kutipan final. Periksa tanggal, peserta, ketersediaan dan harga akhir di Viator.'});
  } catch (error) { return reply({code: 'VIATOR_UNAVAILABLE', failureStage, failureKind: failureKind(error), ...(upstreamStatus ? {upstreamStatus} : {}), error: 'Penyedia aktivitas belum dapat dihubungi. Coba lagi.'}, 502); }
}
