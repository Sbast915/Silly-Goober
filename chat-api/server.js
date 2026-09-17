'use strict';

/**
 * Chat history + media API - runs on the Oracle VM next to coturn.
 *
 * Lives here rather than on Render because Render's free tier has no
 * persistent disk: every deploy would wipe history and media.
 *
 * ZERO EXTERNAL DEPENDENCIES - node builtins only. Two reasons:
 *  - the VM currently has no outbound internet (OCI egress rules), so
 *    npm install is impossible;
 *  - better-sqlite3 is a native module and compiling it on a 1-core free
 *    VM is a lot of moving parts for a two-person chat.
 * Storage is an append-only JSONL file, which for two users is indexed
 * entirely in memory on boot. Swapping in SQLite later only means
 * replacing the `store` object below.
 *
 * Only Render talks to this service; the browser never does. Render holds
 * CHAT_API_SECRET and re-checks the user's own session token first, so the
 * secret stays server-side and media URLs carry no credentials.
 *
 * Transport is HTTPS with a self-signed cert. The public cert is committed
 * to the repo so Render can pin it, giving real encryption over the public
 * internet without needing a domain. The private key never leaves this box.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');
const { URL } = require('url');

const PORT = parseInt(process.env.CHAT_API_PORT || '4000', 10);
const SECRET = process.env.CHAT_API_SECRET || '';
const MEDIA_DIR = process.env.CHAT_MEDIA_DIR || '/var/silly-goober-media';
const DB_PATH = process.env.CHAT_DB_PATH || '/var/silly-goober-media/messages.jsonl';
const TLS_CERT = process.env.CHAT_TLS_CERT || '/etc/silly-goober/chat-cert.pem';
const TLS_KEY = process.env.CHAT_TLS_KEY || '/etc/silly-goober/chat-key.pem';

const MAX_TEXT = 4000;
const MAX_MEDIA_BYTES = 12 * 1024 * 1024;
const VALID_SENDERS = new Set(['seb', 'hala']);
const VALID_TYPES = new Set(['text', 'image', 'audio']);
const MEDIA_ID_RE = /^[a-f0-9]{32}\.(webm|png|jpg|ogg|mp4|bin)$/;

if (!SECRET) {
  console.error('[chat-api] CHAT_API_SECRET is not set - refusing to start.');
  process.exit(1);
}
fs.mkdirSync(MEDIA_DIR, { recursive: true });

// --- storage -------------------------------------------------------------
const store = {
  messages: [],
  nextId: 1,
  load: function () {
    if (!fs.existsSync(DB_PATH)) return;
    const lines = fs.readFileSync(DB_PATH, 'utf8').split('\n');
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const m = JSON.parse(line);
        this.messages.push(m);
        if (m.id >= this.nextId) this.nextId = m.id + 1;
      } catch (e) { /* skip a torn line rather than refusing to boot */ }
    }
  },
  append: function (msg) {
    msg.id = this.nextId++;
    this.messages.push(msg);
    fs.appendFileSync(DB_PATH, JSON.stringify(msg) + '\n');
    return msg;
  },
  recent: function (limit) {
    return this.messages.slice(-limit);
  }
};
store.load();
console.log('[chat-api] loaded ' + store.messages.length + ' messages');

// --- helpers -------------------------------------------------------------
function authOk(req) {
  const h = req.headers['authorization'] || '';
  const given = h.slice(0, 7).toLowerCase() === 'bearer ' ? h.slice(7) : '';
  if (given.length !== SECRET.length) return false;
  try {
    return crypto.timingSafeEqual(Buffer.from(given), Buffer.from(SECRET));
  } catch (e) { return false; }
}

function json(res, code, obj) {
  const body = JSON.stringify(obj);
  res.writeHead(code, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function readBody(req, limit) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;
    req.on('data', (c) => {
      total += c.length;
      if (total > limit) { reject(new Error('too large')); req.destroy(); return; }
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Extension comes from our own allowlist, never from user input, and the
// filename is random - nothing user-controlled reaches the filesystem path.
function extFor(mime) {
  if (mime.indexOf('webm') !== -1) return '.webm';
  if (mime.indexOf('png') !== -1) return '.png';
  if (mime.indexOf('jpeg') !== -1 || mime.indexOf('jpg') !== -1) return '.jpg';
  if (mime.indexOf('ogg') !== -1) return '.ogg';
  if (mime.indexOf('mp4') !== -1) return '.mp4';
  return '.bin';
}

// --- routes --------------------------------------------------------------
async function handle(req, res) {
  const u = new URL(req.url, 'https://local');
  const p = u.pathname;

  if (p === '/health') return json(res, 200, { ok: true });
  if (!authOk(req)) return json(res, 401, { ok: false });

  // history
  if (req.method === 'GET' && p === '/messages') {
    const limit = Math.min(parseInt(u.searchParams.get('limit') || '500', 10) || 500, 2000);
    return json(res, 200, { ok: true, messages: store.recent(limit) });
  }

  // new text message
  if (req.method === 'POST' && p === '/messages') {
    let body;
    try { body = JSON.parse((await readBody(req, 1024 * 1024)).toString('utf8')); }
    catch (e) { return json(res, 400, { ok: false, error: 'bad json' }); }

    const sender = String(body.sender || '').toLowerCase();
    const type = String(body.type || 'text');
    const content = String(body.content || '').slice(0, MAX_TEXT);
    if (!VALID_SENDERS.has(sender) || !VALID_TYPES.has(type)) {
      return json(res, 400, { ok: false, error: 'bad sender/type' });
    }
    if (!content) return json(res, 400, { ok: false, error: 'empty' });

    const msg = store.append({
      sender: sender, type: type, content: content,
      mime: body.mime || null, timestamp: Number(body.timestamp) || Date.now()
    });
    return json(res, 200, { ok: true, message: msg });
  }

  // media upload
  if (req.method === 'POST' && p === '/media') {
    const sender = String(u.searchParams.get('sender') || '').toLowerCase();
    const kind = String(u.searchParams.get('kind') || '');
    const mime = String(u.searchParams.get('mime') || 'application/octet-stream').slice(0, 100);
    if (!VALID_SENDERS.has(sender) || !VALID_TYPES.has(kind) || kind === 'text') {
      return json(res, 400, { ok: false, error: 'bad sender/kind' });
    }
    let buf;
    try { buf = await readBody(req, MAX_MEDIA_BYTES); }
    catch (e) { return json(res, 413, { ok: false, error: 'too large' }); }
    if (!buf.length) return json(res, 400, { ok: false, error: 'empty body' });

    const mediaId = crypto.randomBytes(16).toString('hex') + extFor(mime);
    fs.writeFileSync(path.join(MEDIA_DIR, mediaId), buf);

    const msg = store.append({
      sender: sender, type: kind, content: mediaId,
      mime: mime, timestamp: Date.now()
    });
    return json(res, 200, { ok: true, message: msg });
  }

  // media download
  if (req.method === 'GET' && p.indexOf('/media/') === 0) {
    const id = p.slice('/media/'.length);
    if (!MEDIA_ID_RE.test(id)) { res.writeHead(400); return res.end(); }
    const file = path.join(MEDIA_DIR, id);
    if (!fs.existsSync(file)) { res.writeHead(404); return res.end(); }
    const rec = store.messages.find((m) => m.content === id);
    const stat = fs.statSync(file);
    res.writeHead(200, {
      'Content-Type': (rec && rec.mime) || 'application/octet-stream',
      'Content-Length': stat.size,
      'Cache-Control': 'private, max-age=31536000'
    });
    return fs.createReadStream(file).pipe(res);
  }

  json(res, 404, { ok: false });
}

if (!fs.existsSync(TLS_CERT) || !fs.existsSync(TLS_KEY)) {
  // Refuse to silently downgrade: messages would cross the public internet
  // in cleartext, which defeats the point of this whole project.
  console.error('[chat-api] TLS cert/key missing - refusing to start over plain HTTP.');
  process.exit(1);
}

https.createServer(
  { cert: fs.readFileSync(TLS_CERT), key: fs.readFileSync(TLS_KEY) },
  (req, res) => {
    handle(req, res).catch((err) => {
      console.error('[chat-api] handler error:', err && err.message);
      try { json(res, 500, { ok: false }); } catch (e) {}
    });
  }
).listen(PORT, '0.0.0.0', () => {
  console.log('[chat-api] HTTPS listening on :' + PORT);
  console.log('[chat-api] media=' + MEDIA_DIR + ' db=' + DB_PATH);
});
