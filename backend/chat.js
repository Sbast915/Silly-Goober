'use strict';

/**
 * Client for the chat API running on the Oracle VM.
 *
 * The VM uses a self-signed certificate (no domain, so no Let's Encrypt).
 * Rather than disabling verification, we pin that exact certificate as the
 * only trusted CA for these requests: real encryption plus a guarantee we
 * are talking to our own box, with no domain required.
 *
 * The browser never reaches this API. It calls Render, Render checks the
 * user's session token, and only then does Render use CHAT_API_SECRET here.
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const HOST = process.env.CHAT_API_HOST || process.env.TURN_HOST || '141.148.243.201';
const PORT = parseInt(process.env.CHAT_API_PORT || '4000', 10);
const SECRET = process.env.CHAT_API_SECRET || '';

let agent = null;
function getAgent() {
  if (agent) return agent;
  const certPath = path.join(__dirname, 'chat-api-cert.pem');
  const opts = { keepAlive: true };
  if (fs.existsSync(certPath)) {
    // Pin our own cert as the only trusted CA. No `servername` here: SNI
    // may not carry an IP literal (RFC 6066), and it is not needed - the
    // cert carries subjectAltName=IP:<host>, which Node validates against
    // the address we actually connected to.
    opts.ca = fs.readFileSync(certPath);
  }
  agent = new https.Agent(opts);
  return agent;
}

function request(method, reqPath, { body, headers, raw } = {}) {
  return new Promise((resolve, reject) => {
    if (!SECRET) return reject(new Error('CHAT_API_SECRET not set'));

    const req = https.request({
      host: HOST,
      port: PORT,
      path: reqPath,
      method: method,
      agent: getAgent(),
      timeout: 15000,
      headers: Object.assign({ 'Authorization': 'Bearer ' + SECRET }, headers || {})
    }, (res) => {
      const chunks = [];
      res.on('data', (c) => chunks.push(c));
      res.on('end', () => {
        const buf = Buffer.concat(chunks);
        if (res.statusCode < 200 || res.statusCode >= 300) {
          return reject(new Error('chat-api ' + res.statusCode + ': ' + buf.toString('utf8').slice(0, 200)));
        }
        if (raw) return resolve({ buffer: buf, contentType: res.headers['content-type'] });
        try { resolve(JSON.parse(buf.toString('utf8'))); }
        catch (e) { reject(new Error('chat-api returned non-JSON')); }
      });
    });

    req.on('timeout', () => { req.destroy(new Error('chat-api timeout')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function getHistory(limit) {
  return request('GET', '/messages?limit=' + (limit || 500));
}

function saveMessage(msg) {
  return request('POST', '/messages', {
    body: JSON.stringify(msg),
    headers: { 'Content-Type': 'application/json' }
  });
}

function uploadMedia(sender, kind, mime, buffer) {
  const q = '?sender=' + encodeURIComponent(sender) +
            '&kind=' + encodeURIComponent(kind) +
            '&mime=' + encodeURIComponent(mime);
  return request('POST', '/media' + q, {
    body: buffer,
    headers: { 'Content-Type': 'application/octet-stream', 'Content-Length': buffer.length }
  });
}

function fetchMedia(mediaId) {
  return request('GET', '/media/' + encodeURIComponent(mediaId), { raw: true });
}

function health() {
  return request('GET', '/health');
}

module.exports = { getHistory, saveMessage, uploadMedia, fetchMedia, health, HOST, PORT };
