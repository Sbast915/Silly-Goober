const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = process.env.PORT || 3000;
const REAL_PASS_HASH = process.env.REAL_PASS_HASH || '';
const DECOY_PASS_HASH = process.env.DECOY_PASS_HASH || '';
const METERED_APP_NAME = process.env.METERED_APP_NAME || '';
const METERED_API_KEY = process.env.METERED_API_KEY || '';
const METERED_SECRET_KEY = process.env.METERED_SECRET_KEY || '';

const ROOM = 'call';
const TOKEN_TTL_MS = 5 * 60 * 1000;

// token -> { expires }
const tokens = new Map();

// crude per-IP throttle for unlock attempts
const attempts = new Map(); // ip -> { count, lockUntil }
const MAX_ATTEMPTS = 8;
const LOCK_MS = 60 * 1000;

function cleanupTokens() {
  const now = Date.now();
  for (const [t, v] of tokens) {
    if (v.expires < now) tokens.delete(t);
  }
}
setInterval(cleanupTokens, 60 * 1000).unref();

app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

app.get('/health', (req, res) => res.status(200).send('ok'));

app.post('/api/unlock', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, lockUntil: 0 };

  console.log('[unlock] hit ip=%s hasRealHash=%s hasDecoyHash=%s bodyType=%s',
    ip, !!REAL_PASS_HASH, !!DECOY_PASS_HASH, typeof (req.body && req.body.passphrase));

  if (rec.lockUntil > now) {
    console.log('[unlock] locked out ip=%s', ip);
    return res.status(429).json({ ok: false });
  }

  const { passphrase } = req.body || {};
  if (typeof passphrase !== 'string' || !passphrase) {
    console.log('[unlock] bad body ip=%s', ip);
    return res.status(400).json({ ok: false });
  }

  const isReal = REAL_PASS_HASH && bcrypt.compareSync(passphrase, REAL_PASS_HASH);
  const isDecoy = !isReal && DECOY_PASS_HASH && bcrypt.compareSync(passphrase, DECOY_PASS_HASH);
  console.log('[unlock] result ip=%s isReal=%s isDecoy=%s', ip, isReal, isDecoy);

  if (!isReal && !isDecoy) {
    rec.count += 1;
    if (rec.count >= MAX_ATTEMPTS) {
      rec.lockUntil = now + LOCK_MS;
      rec.count = 0;
    }
    attempts.set(ip, rec);
    // small delay to slow down brute-forcing; no info leaked in the response
    return setTimeout(() => res.json({ ok: false }), 300);
  }

  attempts.delete(ip);

  if (isDecoy) {
    // Decoy mode never touches real signaling, so it needs no token.
    return res.json({ ok: true, mode: 'decoy' });
  }

  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { expires: now + TOKEN_TTL_MS });
  return res.json({ ok: true, mode: 'real', token });
});

function tokenFromReq(req) {
  var h = req.headers['authorization'] || '';
  if (h.slice(0, 7).toLowerCase() === 'bearer ') return h.slice(7);
  return (req.body && req.body.token) || '';
}

const FALLBACK_ICE = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  {
    urls: [
      'turn:openrelay.metered.ca:80',
      'turn:openrelay.metered.ca:443',
      'turn:openrelay.metered.ca:443?transport=tcp'
    ],
    username: 'openrelayproject',
    credential: 'openrelayproject'
  }
];

async function fetchMeteredIceViaApiKey(logPrefix) {
  const url = 'https://' + METERED_APP_NAME + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(METERED_API_KEY);
  const redactedUrl = 'https://' + METERED_APP_NAME + '.metered.live/api/v1/turn/credentials?apiKey=<REDACTED len=' + METERED_API_KEY.length + '>';
  console.log('%s fetching apiKey mode url=%s', logPrefix, redactedUrl);
  const r = await fetch(url);
  const bodyText = await r.text();
  console.log('%s apiKey status=%d ct=%s body-head=%s', logPrefix,
    r.status, r.headers.get('content-type') || '(none)',
    bodyText.slice(0, 300).replace(/\s+/g, ' '));
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(bodyText);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (e) { /* fall through */ }
  return null;
}

async function fetchMeteredIceViaSecretKey(logPrefix) {
  // Step 1: list credentials via v2, using secretKey
  const listUrl = 'https://' + METERED_APP_NAME + '.metered.live/api/v2/turn/credentials?secretKey=' + encodeURIComponent(METERED_SECRET_KEY);
  const redactedListUrl = 'https://' + METERED_APP_NAME + '.metered.live/api/v2/turn/credentials?secretKey=<REDACTED len=' + METERED_SECRET_KEY.length + '>';
  console.log('%s fetching secretKey mode list url=%s', logPrefix, redactedListUrl);
  let r = await fetch(listUrl);
  let bodyText = await r.text();
  console.log('%s secretKey list status=%d ct=%s body-head=%s', logPrefix,
    r.status, r.headers.get('content-type') || '(none)',
    bodyText.slice(0, 300).replace(/\s+/g, ' '));
  if (!r.ok) return null;

  let listed = null;
  try { listed = JSON.parse(bodyText); } catch (e) { return null; }
  const items = listed && Array.isArray(listed.data) ? listed.data : (Array.isArray(listed) ? listed : []);
  let chosen = items.find(function (c) { return c && !c.expired && c.apiKey; });

  // Step 2: if no non-expired credential exists, create one
  if (!chosen) {
    const createUrl = 'https://' + METERED_APP_NAME + '.metered.live/api/v1/turn/credential?secretKey=' + encodeURIComponent(METERED_SECRET_KEY);
    console.log('%s no usable credential, creating via secretKey', logPrefix);
    r = await fetch(createUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiryInSeconds: 24 * 60 * 60, label: 'h-calls-auto' })
    });
    bodyText = await r.text();
    console.log('%s secretKey create status=%d body-head=%s', logPrefix,
      r.status, bodyText.slice(0, 300).replace(/\s+/g, ' '));
    if (!r.ok) return null;
    try { chosen = JSON.parse(bodyText); } catch (e) { return null; }
    if (!chosen || !chosen.apiKey) return null;
    console.log('%s created credential label=%s (may take up to 2min to propagate)', logPrefix, chosen.label);
  }

  // Step 3: fetch iceServers using the credential's apiKey
  const iceUrl = 'https://' + METERED_APP_NAME + '.metered.live/api/v1/turn/credentials?apiKey=' + encodeURIComponent(chosen.apiKey);
  console.log('%s fetching ice via credential apiKey label=%s', logPrefix, chosen.label);
  r = await fetch(iceUrl);
  bodyText = await r.text();
  console.log('%s ice fetch status=%d body-head=%s', logPrefix,
    r.status, bodyText.slice(0, 300).replace(/\s+/g, ' '));
  if (!r.ok) return null;
  try {
    const parsed = JSON.parse(bodyText);
    if (Array.isArray(parsed) && parsed.length) return parsed;
  } catch (e) { /* fall through */ }
  return null;
}

// Cache last successful Metered result for a short window so we don't hammer their API.
let iceCache = null; // { iceServers, expires, source }
const ICE_CACHE_MS = 60 * 1000;

async function getIceServers(logPrefix) {
  const now = Date.now();
  if (iceCache && iceCache.expires > now) {
    console.log('%s cache hit source=%s', logPrefix, iceCache.source);
    return { iceServers: iceCache.iceServers, source: iceCache.source };
  }

  if (METERED_APP_NAME && METERED_SECRET_KEY) {
    try {
      const iceServers = await fetchMeteredIceViaSecretKey(logPrefix);
      if (iceServers) {
        iceCache = { iceServers, expires: now + ICE_CACHE_MS, source: 'metered-secret' };
        return { iceServers, source: 'metered-secret' };
      }
    } catch (err) {
      console.log('%s secretKey mode threw: %s (%s)', logPrefix, err && err.message, err && err.name);
    }
  } else if (METERED_APP_NAME && METERED_API_KEY) {
    try {
      const iceServers = await fetchMeteredIceViaApiKey(logPrefix);
      if (iceServers) {
        iceCache = { iceServers, expires: now + ICE_CACHE_MS, source: 'metered-apikey' };
        return { iceServers, source: 'metered-apikey' };
      }
    } catch (err) {
      console.log('%s apiKey mode threw: %s (%s)', logPrefix, err && err.message, err && err.name);
    }
  } else {
    const missing = [];
    if (!METERED_APP_NAME) missing.push('METERED_APP_NAME');
    if (!METERED_API_KEY && !METERED_SECRET_KEY) missing.push('METERED_API_KEY or METERED_SECRET_KEY');
    console.log('%s no metered config (missing: %s)', logPrefix, missing.join(', '));
  }

  return { iceServers: FALLBACK_ICE, source: 'fallback' };
}

app.post('/api/ice-config', async (req, res) => {
  const token = tokenFromReq(req);
  const rec = token && tokens.get(token);
  if (!rec || rec.expires < Date.now()) {
    return res.status(401).json({ ok: false });
  }

  const result = await getIceServers('[ice]');
  console.log('[ice] serving source=%s servers=%d', result.source, result.iceServers.length);
  res.json({ ok: true, iceServers: result.iceServers, source: result.source });
});

// --- Signaling ---

io.use((socket, next) => {
  const token = socket.handshake.auth && socket.handshake.auth.token;
  const rec = token && tokens.get(token);
  if (!rec || rec.expires < Date.now()) {
    return next(new Error('unauthorized'));
  }
  next();
});

function roomSize() {
  const room = io.sockets.adapter.rooms.get(ROOM);
  return room ? room.size : 0;
}

io.on('connection', (socket) => {
  if (roomSize() >= 2) {
    socket.emit('room-full');
    socket.disconnect(true);
    return;
  }

  socket.join(ROOM);
  socket.to(ROOM).emit('peer-joined');

  socket.on('signal', (payload) => {
    socket.to(ROOM).emit('signal', payload);
  });

  socket.on('call-request', () => {
    socket.to(ROOM).emit('call-request');
  });

  socket.on('call-decline', () => {
    socket.to(ROOM).emit('call-decline');
  });

  socket.on('call-end', () => {
    socket.to(ROOM).emit('call-end');
  });

  socket.on('disconnect', () => {
    socket.to(ROOM).emit('peer-left');
  });
});

server.listen(PORT, () => {
  console.log('listening on ' + PORT);
  console.log('[startup] env presence: REAL_PASS_HASH=%s DECOY_PASS_HASH=%s METERED_APP_NAME=%s METERED_API_KEY=%s METERED_SECRET_KEY=%s',
    REAL_PASS_HASH ? '(set len=' + REAL_PASS_HASH.length + ')' : '(UNSET)',
    DECOY_PASS_HASH ? '(set len=' + DECOY_PASS_HASH.length + ')' : '(UNSET)',
    METERED_APP_NAME ? '(set="' + METERED_APP_NAME + '")' : '(UNSET)',
    METERED_API_KEY ? '(set len=' + METERED_API_KEY.length + ')' : '(UNSET)',
    METERED_SECRET_KEY ? '(set len=' + METERED_SECRET_KEY.length + ')' : '(UNSET)'
  );

  // Self-test at startup: proves whether the configured Metered creds actually work,
  // without waiting for the first real call to fail.
  if (METERED_APP_NAME && (METERED_API_KEY || METERED_SECRET_KEY)) {
    setTimeout(async () => {
      console.log('[startup] running Metered self-test...');
      const result = await getIceServers('[startup-selftest]');
      if (result.source === 'fallback') {
        console.log('[startup] SELF-TEST FAILED - Metered creds did NOT work, falls back to Open Relay. Check the [startup-selftest] lines above for the exact reason from Metered.');
      } else {
        console.log('[startup] SELF-TEST OK - source=%s, servers=%d', result.source, result.iceServers.length);
      }
    }, 500);
  }
});
