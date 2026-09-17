const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const crypto = require('crypto');
const express = require('express');
const bcrypt = require('bcryptjs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { path: '/api/sync' });

const PORT = process.env.PORT || 3000;
const REAL_PASS_HASH = process.env.REAL_PASS_HASH || '';
// --- Self-hosted coturn ---
const TURN_SECRET = process.env.TURN_SECRET || '';
const TURN_HOST = process.env.TURN_HOST || '141.148.243.201';
const TURN_PORT = parseInt(process.env.TURN_PORT || '3478', 10);
const TURN_TLS_PORT = parseInt(process.env.TURN_TLS_PORT || '5349', 10);
const TURN_REALM = process.env.TURN_REALM || 'silly-goober.turn';
const TURN_TTL = parseInt(process.env.TURN_TTL || '3600', 10);
// turns:// is opt-in: coturn will not open its TLS listener without
// cert=/pkey= in turnserver.conf, so advertising it by default would hand
// the browser an endpoint where every candidate silently fails.
const TURN_TLS_ENABLED = process.env.TURN_TLS === '1';

const { buildIceServers, makeTurnCredentials } = require('./turn');
const { runTurnSelfTest } = require('./turn-selftest');

const ROOM = 'call';
const TOKEN_TTL_MS = 5 * 60 * 1000;

// token -> { expires }
const tokens = new Map();

// socket.id -> { name }
const presence = new Map();
// Ordered set of socket ids currently allowed in the call slot (max 2)
const callParticipants = new Set();

function sanitizeName(raw) {
  if (typeof raw !== 'string') return 'Guest';
  var s = raw.trim().replace(/[\r\n\t]/g, '').slice(0, 24);
  return s || 'Guest';
}

function broadcastPresence() {
  const peers = [];
  for (const [id] of io.sockets.sockets) {
    const info = presence.get(id) || {};
    peers.push({
      id,
      name: info.name || 'Guest',
      isParticipant: callParticipants.has(id)
    });
  }
  io.emit('presence', { peers });
}

function tryPromoteObserver() {
  if (callParticipants.size >= 2) return;
  for (const [id, sock] of io.sockets.sockets) {
    if (callParticipants.size >= 2) break;
    if (!callParticipants.has(id)) {
      callParticipants.add(id);
      sock.join(ROOM);
      sock.emit('role-assigned', { role: 'participant' });
      console.log('[sig] promoted observer -> participant id=%s', id);
    }
  }
}

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

app.post('/api/search', (req, res) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const rec = attempts.get(ip) || { count: 0, lockUntil: 0 };

  console.log('[search] hit ip=%s hasRealHash=%s', ip, !!REAL_PASS_HASH);

  if (rec.lockUntil > now) {
    console.log('[search] throttled ip=%s', ip);
    return res.status(429).json({ ok: false });
  }

  const passphrase = (req.body && req.body.q) || '';
  if (typeof passphrase !== 'string' || !passphrase) {
    console.log('[search] bad body ip=%s', ip);
    return res.status(400).json({ ok: false });
  }

  const isReal = REAL_PASS_HASH && bcrypt.compareSync(passphrase, REAL_PASS_HASH);
  console.log('[search] result ip=%s match=%s', ip, isReal);

  if (!isReal) {
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

  const token = crypto.randomBytes(24).toString('hex');
  tokens.set(token, { expires: now + TOKEN_TTL_MS });
  return res.json({ ok: true, view: 'workspace', key: token });
});

function tokenFromReq(req) {
  var h = req.headers['authorization'] || '';
  if (h.slice(0, 7).toLowerCase() === 'bearer ') return h.slice(7);
  return (req.body && req.body.token) || '';
}

// ---------------------------------------------------------------------------
// TURN credentials: generated locally with HMAC-SHA1 against our own coturn
// server's static-auth-secret. No third-party API call, no network dependency
// in the hot path, and the shared secret never leaves this process.
// ---------------------------------------------------------------------------

// Public STUN kept only as a discovery aid; it can never relay, so it is not
// a substitute for our TURN server on strict NATs.
const PUBLIC_STUN = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' }
];

function getIceServers(logPrefix, label) {
  if (!TURN_SECRET) {
    console.log('%s TURN_SECRET is UNSET - serving public STUN only. Calls across strict NATs WILL fail.', logPrefix);
    return { iceServers: PUBLIC_STUN, source: 'stun-only' };
  }

  const built = buildIceServers({
    host: TURN_HOST,
    port: TURN_PORT,
    tlsPort: TURN_TLS_PORT,
    tlsEnabled: TURN_TLS_ENABLED,
    secret: TURN_SECRET,
    ttlSeconds: TURN_TTL,
    label: label || 'user'
  });

  // Public STUN appended after our own server: harmless, and gives the browser
  // a second opinion on its reflexive address.
  const iceServers = built.iceServers.concat(PUBLIC_STUN);
  console.log('%s issued creds host=%s ttl=%ds expires=%d tls=%s',
    logPrefix, TURN_HOST, TURN_TTL, built.expiresAt, TURN_TLS_ENABLED);
  return { iceServers, source: 'self-hosted-coturn', expiresAt: built.expiresAt };
}


app.post('/api/session', (req, res) => {
  const token = tokenFromReq(req);
  const rec = token && tokens.get(token);
  if (!rec || rec.expires < Date.now()) {
    return res.status(401).json({ ok: false });
  }

  // Credentials are derived per-request and expire on their own, so there is
  // nothing to cache and no upstream API that can rate-limit or go down.
  const result = getIceServers('[ice]', 'web');
  console.log('[ice] serving source=%s servers=%d', result.source, result.iceServers.length);
  res.json({
    ok: true,
    iceServers: result.iceServers,
    source: result.source,
    expiresAt: result.expiresAt
  });
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

function assertParticipant(socket) {
  return callParticipants.has(socket.id);
}

io.on('connection', (socket) => {
  const isParticipant = callParticipants.size < 2;
  if (isParticipant) {
    callParticipants.add(socket.id);
    socket.join(ROOM);
    socket.to(ROOM).emit('peer-joined');
  }
  socket.emit('role-assigned', { role: isParticipant ? 'participant' : 'observer' });
  console.log('[sig] connect id=%s role=%s participants=%d', socket.id,
    isParticipant ? 'participant' : 'observer', callParticipants.size);

  socket.on('hello', (payload) => {
    const name = sanitizeName(payload && payload.name);
    console.log('[sig] hello from=%s name=%s', socket.id, name);
    presence.set(socket.id, { name });
    broadcastPresence();
  });

  socket.on('media-state', (payload) => {
    if (!assertParticipant(socket)) return;
    socket.to(ROOM).emit('media-state', payload);
  });

  socket.on('signal', (payload) => {
    if (!assertParticipant(socket)) return;
    console.log('[sig] relay signal type=%s from=%s', payload && payload.type, socket.id);
    socket.to(ROOM).emit('signal', payload);
  });

  socket.on('call-request', () => {
    if (!assertParticipant(socket)) return;
    console.log('[sig] relay call-request from=%s', socket.id);
    socket.to(ROOM).emit('call-request', { fromId: socket.id });
  });

  socket.on('call-accept', () => {
    if (!assertParticipant(socket)) return;
    console.log('[sig] relay call-accept from=%s', socket.id);
    socket.to(ROOM).emit('call-accept');
  });

  socket.on('call-decline', () => {
    if (!assertParticipant(socket)) return;
    console.log('[sig] relay call-decline from=%s', socket.id);
    socket.to(ROOM).emit('call-decline');
  });

  socket.on('call-end', () => {
    if (!assertParticipant(socket)) return;
    const info = presence.get(socket.id) || {};
    console.log('[sig] relay call-end from=%s name=%s', socket.id, info.name);
    // Carry the ender's name so the remaining peer can say who hung up.
    socket.to(ROOM).emit('call-end', { fromName: info.name || 'Peer' });
  });

  socket.on('disconnect', () => {
    const wasParticipant = callParticipants.has(socket.id);
    // Capture the name BEFORE deleting from presence, so the remaining
    // peer can be told who actually left rather than a generic "Peer".
    const leaverInfo = presence.get(socket.id) || {};
    const leaverName = leaverInfo.name || 'Peer';
    console.log('[sig] disconnect id=%s name=%s wasParticipant=%s', socket.id, leaverName, wasParticipant);
    callParticipants.delete(socket.id);
    presence.delete(socket.id);
    // Only notify peer-left to the *other* participant (avoids peer-left
    // storms into the room from observer disconnects).
    if (wasParticipant) socket.to(ROOM).emit('peer-left', { fromName: leaverName });
    // Auto-promote any waiting observer into the freed slot.
    if (wasParticipant) tryPromoteObserver();
    broadcastPresence();
  });

  // Emit a presence snapshot to the newly-joined socket right away so it
  // sees who's already here, even before the peer says hello again.
  broadcastPresence();
});

server.listen(PORT, () => {
  console.log('listening on ' + PORT);
  console.log('[startup] env presence: REAL_PASS_HASH=%s TURN_SECRET=%s TURN_HOST=%s:%d realm=%s tls=%s',
    REAL_PASS_HASH ? '(set len=' + REAL_PASS_HASH.length + ')' : '(UNSET)',
    TURN_SECRET ? '(set len=' + TURN_SECRET.length + ')' : '(UNSET)',
    TURN_HOST, TURN_PORT, TURN_REALM, TURN_TLS_ENABLED
  );

  if (!TURN_SECRET) {
    console.log('[startup] TURN_SECRET is UNSET - no relay will be offered. Set it to the static-auth-secret from /etc/turnserver.conf.');
    return;
  }

  // Startup self-test against our own coturn. Unlike the old Metered check
  // (which only proved an HTTP endpoint returned JSON), this speaks real
  // STUN/TURN: a Binding request to prove reachability, then an authenticated
  // Allocate to prove TURN_SECRET actually matches turnserver.conf.
  setTimeout(async () => {
    console.log('[startup] running TURN self-test against %s:%d ...', TURN_HOST, TURN_PORT);
    const creds = makeTurnCredentials(TURN_SECRET, 120, 'startup-selftest');
    const r = await runTurnSelfTest({
      host: TURN_HOST,
      port: TURN_PORT,
      realm: TURN_REALM,
      username: creds.username,
      credential: creds.credential,
      timeoutMs: 6000
    });

    if (r.stun.ok) {
      console.log('[startup-selftest] STUN OK - server sees us as %s', r.stun.mapped);
    } else {
      console.log('[startup-selftest] STUN FAILED - %s', r.stun.error);
      console.log('[startup-selftest] HINT: 3478/udp is not reachable. On Oracle Cloud the VCN Security List / NSG must allow it - the instance firewall alone is not enough.');
    }

    if (r.allocate.ok) {
      console.log('[startup-selftest] TURN ALLOCATE OK - realm=%s relay=%s', r.allocate.challengeRealm, r.allocate.relayed);
    } else if (r.stun.ok) {
      console.log('[startup-selftest] TURN ALLOCATE FAILED - %s', r.allocate.error);
      if (/401/.test(r.allocate.error || '')) {
        console.log('[startup-selftest] HINT: 401 means TURN_SECRET does not match static-auth-secret in /etc/turnserver.conf on the TURN host.');
      }
    }

    console.log('[startup] SELF-TEST %s', r.ok ? 'PASSED - relay is usable' : 'FAILED - see hints above');
  }, 500);
});
