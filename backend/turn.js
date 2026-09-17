'use strict';

const crypto = require('crypto');

/**
 * Generate ephemeral TURN credentials using coturn's "TURN REST API" scheme
 * (draft-uberti-behave-turn-rest-00), which is what `use-auth-secret` +
 * `static-auth-secret` in turnserver.conf expects.
 *
 *   username   = <unix-expiry-timestamp>[:<label>]
 *   credential = base64( HMAC-SHA1( static-auth-secret, username ) )
 *
 * The server verifies this locally with the same shared secret, so there is
 * no API call and no third-party dependency: the secret never leaves the
 * backend and the browser only ever receives a short-lived derived password.
 */
function makeTurnCredentials(secret, ttlSeconds, label) {
  const expiry = Math.floor(Date.now() / 1000) + (ttlSeconds || 3600);
  const username = label ? expiry + ':' + label : String(expiry);
  const credential = crypto
    .createHmac('sha1', secret)
    .update(username)
    .digest('base64');
  return { username, credential, expiresAt: expiry };
}

/**
 * Build an RTCPeerConnection-ready iceServers array for our own coturn box.
 *
 * NOTE ON TLS: `turns:` (5349) is only included when TURN_TLS=1. coturn
 * refuses to open its TLS/DTLS listeners unless `cert=` and `pkey=` are set
 * in turnserver.conf, so advertising turns: without certificates would hand
 * the browser an endpoint that silently fails every candidate.
 */
function buildIceServers(opts) {
  const host = opts.host;
  const port = opts.port || 3478;
  const tlsPort = opts.tlsPort || 5349;
  const creds = makeTurnCredentials(opts.secret, opts.ttlSeconds, opts.label);

  const iceServers = [
    { urls: 'stun:' + host + ':' + port },
    {
      urls: [
        'turn:' + host + ':' + port + '?transport=udp',
        'turn:' + host + ':' + port + '?transport=tcp'
      ],
      username: creds.username,
      credential: creds.credential
    }
  ];

  if (opts.tlsEnabled) {
    iceServers.push({
      urls: 'turns:' + host + ':' + tlsPort + '?transport=tcp',
      username: creds.username,
      credential: creds.credential
    });
  }

  return { iceServers, expiresAt: creds.expiresAt };
}

module.exports = { makeTurnCredentials, buildIceServers };
