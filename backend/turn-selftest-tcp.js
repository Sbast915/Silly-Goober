'use strict';

/**
 * TURN-over-TCP check.
 *
 * The UDP self-test cannot tell us whether the TCP path works, and the TCP
 * path is the one that matters on networks that block or throttle UDP VoIP
 * (which is exactly the case we are working around by listening on 443).
 *
 * TURN over TCP carries the same STUN messages as UDP, just back-to-back on
 * a stream, so the message building is shared with turn-selftest.js.
 */

const net = require('net');
const crypto = require('crypto');

const MAGIC_COOKIE = 0x2112a442;
const METHOD = { ALLOCATE_REQUEST: 0x0003, ALLOCATE_SUCCESS: 0x0103 };
const ATTR = {
  USERNAME: 0x0006, MESSAGE_INTEGRITY: 0x0008, ERROR_CODE: 0x0009,
  REALM: 0x0014, NONCE: 0x0015, XOR_RELAYED_ADDRESS: 0x0016,
  REQUESTED_TRANSPORT: 0x0019
};

function pad4(n) { return (4 - (n % 4)) % 4; }

function buildMessage(type, txId, attrs, integrityKey) {
  const parts = [];
  for (const a of attrs) {
    const h = Buffer.alloc(4);
    h.writeUInt16BE(a.type, 0);
    h.writeUInt16BE(a.value.length, 2);
    parts.push(h, a.value, Buffer.alloc(pad4(a.value.length)));
  }
  let body = Buffer.concat(parts);

  if (integrityKey) {
    const h = Buffer.alloc(20);
    h.writeUInt16BE(type, 0);
    h.writeUInt16BE(body.length + 24, 2);
    h.writeUInt32BE(MAGIC_COOKIE, 4);
    txId.copy(h, 8);
    const mac = crypto.createHmac('sha1', integrityKey).update(Buffer.concat([h, body])).digest();
    const mh = Buffer.alloc(4);
    mh.writeUInt16BE(ATTR.MESSAGE_INTEGRITY, 0);
    mh.writeUInt16BE(20, 2);
    body = Buffer.concat([body, mh, mac]);
  }

  const h = Buffer.alloc(20);
  h.writeUInt16BE(type, 0);
  h.writeUInt16BE(body.length, 2);
  h.writeUInt32BE(MAGIC_COOKIE, 4);
  txId.copy(h, 8);
  return Buffer.concat([h, body]);
}

function parseMessage(buf) {
  if (buf.length < 20) return null;
  const type = buf.readUInt16BE(0);
  const length = buf.readUInt16BE(2);
  const attrs = {};
  let off = 20;
  const end = Math.min(20 + length, buf.length);
  while (off + 4 <= end) {
    const t = buf.readUInt16BE(off);
    const l = buf.readUInt16BE(off + 2);
    const s = off + 4;
    if (s + l > buf.length) break;
    attrs[t] = buf.slice(s, s + l);
    off = s + l + pad4(l);
  }
  return { type, length, attrs };
}

function decodeXorAddress(buf) {
  if (!buf || buf.length < 8) return null;
  if (buf.readUInt8(1) !== 0x01) return null;
  const port = buf.readUInt16BE(2) ^ (MAGIC_COOKIE >>> 16);
  const raw = buf.readUInt32BE(4) ^ MAGIC_COOKIE;
  return [(raw >>> 24) & 0xff, (raw >>> 16) & 0xff, (raw >>> 8) & 0xff, raw & 0xff].join('.') + ':' + port;
}

function decodeErrorCode(buf) {
  if (!buf || buf.length < 4) return null;
  return { code: buf.readUInt8(2) * 100 + buf.readUInt8(3), reason: buf.slice(4).toString('utf8') };
}

// Read exactly one STUN message off the stream (header says how long).
function readMessage(sock, timeoutMs) {
  return new Promise((resolve, reject) => {
    let buf = Buffer.alloc(0);
    const timer = setTimeout(() => { cleanup(); reject(new Error('timeout waiting for reply')); }, timeoutMs);
    function cleanup() { clearTimeout(timer); sock.removeListener('data', onData); sock.removeListener('error', onErr); }
    function onErr(e) { cleanup(); reject(e); }
    function onData(chunk) {
      buf = Buffer.concat([buf, chunk]);
      if (buf.length < 20) return;
      const need = 20 + buf.readUInt16BE(2);
      if (buf.length < need) return;
      cleanup();
      resolve(parseMessage(buf.slice(0, need)));
    }
    sock.on('data', onData);
    sock.on('error', onErr);
  });
}

async function runTurnTcpTest(opts) {
  const result = { ok: false, host: opts.host, port: opts.port, tcp: { ok: false }, allocate: { ok: false } };
  const timeoutMs = opts.timeoutMs || 8000;

  const sock = new net.Socket();
  try {
    await new Promise((resolve, reject) => {
      const t = setTimeout(() => { sock.destroy(); reject(new Error('TCP connect timeout')); }, timeoutMs);
      sock.connect(opts.port, opts.host, () => { clearTimeout(t); resolve(); });
      sock.on('error', (e) => { clearTimeout(t); reject(e); });
    });
    result.tcp.ok = true;

    const reqTransport = Buffer.alloc(4);
    reqTransport.writeUInt8(17, 0); // relay UDP, carried over our TCP control connection

    // 1) unauthenticated Allocate -> expect a 401 carrying realm + nonce
    const tx1 = crypto.randomBytes(12);
    sock.write(buildMessage(METHOD.ALLOCATE_REQUEST, tx1, [{ type: ATTR.REQUESTED_TRANSPORT, value: reqTransport }]));
    const challenge = await readMessage(sock, timeoutMs);
    const err = decodeErrorCode(challenge.attrs[ATTR.ERROR_CODE]);
    if (!err || err.code !== 401) {
      result.allocate.error = 'expected 401 challenge, got ' + (err ? err.code : 'type 0x' + challenge.type.toString(16));
      return result;
    }
    const realm = (challenge.attrs[ATTR.REALM] || Buffer.from(opts.realm)).toString('utf8');
    const nonce = challenge.attrs[ATTR.NONCE];
    result.allocate.challengeRealm = realm;
    if (!nonce) { result.allocate.error = 'challenge had no NONCE'; return result; }

    // 2) authenticated Allocate
    const key = crypto.createHash('md5').update(opts.username + ':' + realm + ':' + opts.credential).digest();
    const tx2 = crypto.randomBytes(12);
    sock.write(buildMessage(METHOD.ALLOCATE_REQUEST, tx2, [
      { type: ATTR.REQUESTED_TRANSPORT, value: reqTransport },
      { type: ATTR.USERNAME, value: Buffer.from(opts.username, 'utf8') },
      { type: ATTR.REALM, value: Buffer.from(realm, 'utf8') },
      { type: ATTR.NONCE, value: nonce }
    ], key));

    const reply = await readMessage(sock, timeoutMs);
    if (reply.type === METHOD.ALLOCATE_SUCCESS) {
      result.allocate.ok = true;
      result.allocate.relayed = decodeXorAddress(reply.attrs[ATTR.XOR_RELAYED_ADDRESS]);
    } else {
      const e2 = decodeErrorCode(reply.attrs[ATTR.ERROR_CODE]);
      result.allocate.error = e2 ? (e2.code + ' ' + e2.reason) : ('type 0x' + reply.type.toString(16));
    }

    result.ok = result.tcp.ok && result.allocate.ok;
    return result;
  } catch (e) {
    if (!result.tcp.ok) result.tcp.error = e.message;
    else result.allocate.error = e.message;
    return result;
  } finally {
    try { sock.destroy(); } catch (e) {}
  }
}

module.exports = { runTurnTcpTest };
