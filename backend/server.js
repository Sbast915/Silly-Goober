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
  console.log(`listening on ${PORT}`);
});
