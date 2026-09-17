'use strict';

/**
 * Self-test for our own coturn server, speaking real STUN/TURN over UDP.
 *
 * Replaces the old Metered HTTP credential check, which only ever proved
 * that an API returned JSON - it never proved a relay could be allocated.
 * This does two things that actually matter:
 *
 *   1. STUN Binding  - proves 3478/udp is reachable and coturn answers,
 *                      and reports the public address it sees us from.
 *   2. TURN Allocate - proves the HMAC credentials derived from
 *                      static-auth-secret are accepted and a relay address
 *                      is actually handed out. This is the step that fails
 *                      if TURN_SECRET and turnserver.conf disagree.
 *
 * Refs: RFC 5389 (STUN), RFC 5766 (TURN).
 */

const dgram = require('dgram');
const crypto = require('crypto');

const MAGIC_COOKIE = 0x2112a442;

const METHOD = {
  BINDING_REQUEST: 0x0001,
  BINDING_SUCCESS: 0x0101,
  ALLOCATE_REQUEST: 0x0003,
  ALLOCATE_SUCCESS: 0x0103,
  ALLOCATE_ERROR: 0x0113
};

const ATTR = {
  USERNAME: 0x0006,
  MESSAGE_INTEGRITY: 0x0008,
  ERROR_CODE: 0x0009,
  REALM: 0x0014,
  NONCE: 0x0015,
  XOR_RELAYED_ADDRESS: 0x0016,
  REQUESTED_TRANSPORT: 0x0019,
  XOR_MAPPED_ADDRESS: 0x0020
};

function pad4(n) { return (4 - (n % 4)) % 4; }

function buildMessage(type, transactionId, attrs, integrityKey) {
  const parts = [];
  for (const a of attrs) {
    const header = Buffer.alloc(4);
    header.writeUInt16BE(a.type, 0);
    header.writeUInt16BE(a.value.length, 2);
    parts.push(header, a.value, Buffer.alloc(pad4(a.value.length)));
  }
  let body = Buffer.concat(parts);

  if (integrityKey) {
    // MESSAGE-INTEGRITY is an HMAC-SHA1 over the message as it would look
    // WITH the integrity attribute already appended, so the declared length
    // in the header must include those 24 bytes before we hash.
    const header = Buffer.alloc(20);
    header.writeUInt16BE(type, 0);
    header.writeUInt16BE(body.length + 24, 2);
    header.writeUInt32BE(MAGIC_COOKIE, 4);
    transactionId.copy(header, 8);

    const mac = crypto.createHmac('sha1', integrityKey)
      .update(Buffer.concat([header, body]))
      .digest();

    const miHeader = Buffer.alloc(4);
    miHeader.writeUInt16BE(ATTR.MESSAGE_INTEGRITY, 0);
    miHeader.writeUInt16BE(20, 2);
    body = Buffer.concat([body, miHeader, mac]);
  }

  const header = Buffer.alloc(20);
  header.writeUInt16BE(type, 0);
  header.writeUInt16BE(body.length, 2);
  header.writeUInt32BE(MAGIC_COOKIE, 4);
  transactionId.copy(header, 8);
  return Buffer.concat([header, body]);
}

function parseMessage(buf) {
  if (buf.length < 20) return null;
  const type = buf.readUInt16BE(0);
  const length = buf.readUInt16BE(2);
  const transactionId = buf.slice(8, 20);
  const attrs = {};
  let off = 20;
  const end = Math.min(20 + length, buf.length);
  while (off + 4 <= end) {
    const aType = buf.readUInt16BE(off);
    const aLen = buf.readUInt16BE(off + 2);
    const start = off + 4;
    if (start + aLen > buf.length) break;
    attrs[aType] = buf.slice(start, start + aLen);
    off = start + aLen + pad4(aLen);
  }
  return { type, transactionId, attrs };
}

function decodeXorAddress(buf) {
  if (!buf || buf.length < 8) return null;
  const family = buf.readUInt8(1);
  const port = buf.readUInt16BE(2) ^ (MAGIC_COOKIE >>> 16);
  if (family !== 0x01) return { family: 'ipv6', port, address: null };
  const raw = buf.readUInt32BE(4) ^ MAGIC_COOKIE;
  const address = [
    (raw >>> 24) & 0xff, (raw >>> 16) & 0xff, (raw >>> 8) & 0xff, raw & 0xff
  ].join('.');
  return { family: 'ipv4', address, port };
}

function decodeErrorCode(buf) {
  if (!buf || buf.length < 4) return null;
  const code = buf.readUInt8(2) * 100 + buf.readUInt8(3);
  return { code, reason: buf.slice(4).toString('utf8') };
}

// Send one datagram and wait for a matching transaction reply.
function request(sock, host, port, message, transactionId, timeoutMs) {
  return new Promise((resolve, reject) => {
    let done = false;
    const timer = setTimeout(() => {
      if (done) return;
      done = true;
      sock.removeListener('message', onMessage);
      reject(new Error('timeout after ' + timeoutMs + 'ms (no reply from ' + host + ':' + port + ')'));
    }, timeoutMs);

    function onMessage(msg) {
      const parsed = parseMessage(msg);
      if (!parsed || !parsed.transactionId.equals(transactionId)) return;
      if (done) return;
      done = true;
      clearTimeout(timer);
      sock.removeListener('message', onMessage);
      resolve(parsed);
    }

    sock.on('message', onMessage);
    sock.send(message, port, host, (err) => {
      if (err && !done) {
        done = true;
        clearTimeout(timer);
        sock.removeListener('message', onMessage);
        reject(err);
      }
    });
  });
}

/**
 * Run the full check. Resolves with a structured result; never throws.
 */
async function runTurnSelfTest(opts) {
  const host = opts.host;
  const port = opts.port || 3478;
  const realm = opts.realm;
  const timeoutMs = opts.timeoutMs || 5000;
  const result = {
    ok: false,
    host: host,
    port: port,
    stun: { ok: false },
    allocate: { ok: false }
  };

  const sock = dgram.createSocket('udp4');
  try {
    await new Promise((res, rej) => {
      sock.once('error', rej);
      sock.bind(0, res);
    });

    // ---- 1) STUN Binding ----
    const txId1 = crypto.randomBytes(12);
    const bindMsg = buildMessage(METHOD.BINDING_REQUEST, txId1, []);
    try {
      const reply = await request(sock, host, port, bindMsg, txId1, timeoutMs);
      if (reply.type === METHOD.BINDING_SUCCESS) {
        const mapped = decodeXorAddress(reply.attrs[ATTR.XOR_MAPPED_ADDRESS]);
        result.stun.ok = true;
        result.stun.mapped = mapped ? (mapped.address + ':' + mapped.port) : null;
      } else {
        result.stun.error = 'unexpected response type 0x' + reply.type.toString(16);
      }
    } catch (err) {
      result.stun.error = err.message;
      // No point attempting Allocate if the port is unreachable.
      result.allocate.error = 'skipped (STUN unreachable)';
      return result;
    }

    // ---- 2) TURN Allocate, unauthenticated -> expect 401 + realm/nonce ----
    const reqTransport = Buffer.alloc(4);
    reqTransport.writeUInt8(17, 0); // 17 = UDP

    const txId2 = crypto.randomBytes(12);
    const probe = buildMessage(METHOD.ALLOCATE_REQUEST, txId2, [
      { type: ATTR.REQUESTED_TRANSPORT, value: reqTransport }
    ]);

    let realmStr = realm;
    let nonceBuf = null;
    try {
      const reply = await request(sock, host, port, probe, txId2, timeoutMs);
      const err = decodeErrorCode(reply.attrs[ATTR.ERROR_CODE]);
      if (!err || err.code !== 401) {
        result.allocate.error = 'expected 401 challenge, got ' +
          (err ? err.code + ' ' + err.reason : 'type 0x' + reply.type.toString(16));
        return result;
      }
      if (reply.attrs[ATTR.REALM]) realmStr = reply.attrs[ATTR.REALM].toString('utf8');
      nonceBuf = reply.attrs[ATTR.NONCE] || null;
      result.allocate.challengeRealm = realmStr;
      if (!nonceBuf) {
        result.allocate.error = 'challenge had no NONCE';
        return result;
      }
    } catch (err) {
      result.allocate.error = 'challenge failed: ' + err.message;
      return result;
    }

    // ---- 3) TURN Allocate, authenticated with HMAC credentials ----
    const username = opts.username;
    const password = opts.credential;
    // Long-term credential key = MD5(username ":" realm ":" password)
    const key = crypto.createHash('md5')
      .update(username + ':' + realmStr + ':' + password)
      .digest();

    const txId3 = crypto.randomBytes(12);
    const authed = buildMessage(METHOD.ALLOCATE_REQUEST, txId3, [
      { type: ATTR.REQUESTED_TRANSPORT, value: reqTransport },
      { type: ATTR.USERNAME, value: Buffer.from(username, 'utf8') },
      { type: ATTR.REALM, value: Buffer.from(realmStr, 'utf8') },
      { type: ATTR.NONCE, value: nonceBuf }
    ], key);

    try {
      const reply = await request(sock, host, port, authed, txId3, timeoutMs);
      if (reply.type === METHOD.ALLOCATE_SUCCESS) {
        const relayed = decodeXorAddress(reply.attrs[ATTR.XOR_RELAYED_ADDRESS]);
        result.allocate.ok = true;
        result.allocate.relayed = relayed ? (relayed.address + ':' + relayed.port) : null;
      } else {
        const err = decodeErrorCode(reply.attrs[ATTR.ERROR_CODE]);
        result.allocate.error = err
          ? ('allocate rejected: ' + err.code + ' ' + err.reason)
          : ('unexpected type 0x' + reply.type.toString(16));
      }
    } catch (err) {
      result.allocate.error = 'authenticated allocate failed: ' + err.message;
    }

    result.ok = result.stun.ok && result.allocate.ok;
    return result;
  } catch (err) {
    result.fatal = err.message;
    return result;
  } finally {
    try { sock.close(); } catch (e) { /* already closed */ }
  }
}

module.exports = { runTurnSelfTest };
