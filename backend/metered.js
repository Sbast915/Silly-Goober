'use strict';

/**
 * TEMPORARY: Metered-hosted TURN, restored as the priority path.
 *
 * Why, given we have our own coturn: Metered terminates TLS on 443 with a
 * certificate browsers actually trust, so it can offer real `turns:`.
 * Our coturn cannot - it only has a self-signed cert, which browsers reject
 * for turns: - so the best it can do is plain TURN on 443, whose first bytes
 * are a STUN header rather than a TLS ClientHello and are therefore easy for
 * DPI to fingerprint. On a network that blocks VoIP, Metered is the better
 * bet today.
 *
 * Flow (secretKey path, the one that was working before):
 *   1. GET /api/v2/turn/credentials?secretKey=...  -> list credentials
 *   2. if none usable, POST /api/v1/turn/credential?secretKey=... -> create
 *   3. GET /api/v1/turn/credentials?apiKey=<cred key> -> iceServers array
 */

const APP = process.env.METERED_APP_NAME || '';
const SECRET_KEY = process.env.METERED_SECRET_KEY || '';
const API_KEY = process.env.METERED_API_KEY || '';

function configured() {
  return !!(APP && (SECRET_KEY || API_KEY));
}

function base() { return 'https://' + APP + '.metered.live'; }

async function iceForApiKey(log, apiKey) {
  const r = await fetch(base() + '/api/v1/turn/credentials?apiKey=' + encodeURIComponent(apiKey));
  const text = await r.text();
  log('ice fetch status=%d head=%s', r.status, text.slice(0, 160).replace(/\s+/g, ' '));
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (e) { /* fall through */ }
  return null;
}

async function viaSecretKey(log) {
  // 1) reuse an existing credential rather than creating one per request
  let chosen = null;
  try {
    const r = await fetch(base() + '/api/v2/turn/credentials?secretKey=' + encodeURIComponent(SECRET_KEY));
    const text = await r.text();
    log('list status=%d head=%s', r.status, text.slice(0, 200).replace(/\s+/g, ' '));
    if (r.ok) {
      const listed = JSON.parse(text);
      const items = Array.isArray(listed && listed.data) ? listed.data : (Array.isArray(listed) ? listed : []);
      chosen = items.find((c) => c && !c.expired && c.apiKey) || null;
      if (chosen) log('reusing credential label=%s', chosen.label);
    } else if (r.status === 401 || r.status === 403) {
      // Same key would fail identically on create, so stop here.
      log('AUTH FAILED - check METERED_APP_NAME (the <name> in <name>.metered.live) and METERED_SECRET_KEY');
      return null;
    }
  } catch (err) {
    log('list threw: %s', err && err.message);
  }

  // 2) create one if needed
  if (!chosen) {
    try {
      const r = await fetch(base() + '/api/v1/turn/credential?secretKey=' + encodeURIComponent(SECRET_KEY), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiryInSeconds: 24 * 60 * 60, label: 'silly-goober' })
      });
      const text = await r.text();
      log('create status=%d head=%s', r.status, text.slice(0, 200).replace(/\s+/g, ' '));
      if (!r.ok) return null;
      chosen = JSON.parse(text);
      if (!chosen || !chosen.apiKey) return null;
    } catch (err) {
      log('create threw: %s', err && err.message);
      return null;
    }
  }

  return iceForApiKey(log, chosen.apiKey);
}

// Cached because these credentials are long-lived; without this every call
// setup would hit Metered's API again.
let cache = null;
const CACHE_MS = 10 * 60 * 1000;

async function getIceServers(logPrefix) {
  const log = (fmt, ...rest) => console.log('%s ' + fmt, logPrefix, ...rest);

  if (!configured()) {
    log('not configured (need METERED_APP_NAME + METERED_SECRET_KEY)');
    return null;
  }
  if (cache && cache.expires > Date.now()) {
    log('cache hit, servers=%d', cache.iceServers.length);
    return cache.iceServers;
  }

  try {
    const iceServers = SECRET_KEY ? await viaSecretKey(log) : await iceForApiKey(log, API_KEY);
    if (iceServers && iceServers.length) {
      cache = { iceServers, expires: Date.now() + CACHE_MS };
      log('OK - %d ice servers', iceServers.length);
      return iceServers;
    }
    log('returned nothing usable');
  } catch (err) {
    log('threw: %s', err && err.message);
  }
  return null;
}

module.exports = { getIceServers, configured, APP, hasSecretKey: !!SECRET_KEY, hasApiKey: !!API_KEY };
