#!/usr/bin/env node
'use strict';

/**
 * Standalone TURN checker:  npm run check-turn
 *
 * Runs the same STUN + authenticated-Allocate test the server runs at
 * startup, but from wherever you run it - so you get an immediate verdict
 * after changing a firewall rule, without waiting for a Render redeploy.
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { makeTurnCredentials } = require('./turn');
const { runTurnSelfTest } = require('./turn-selftest');

const HOST = process.env.TURN_HOST || '141.148.243.201';
const PORT = parseInt(process.env.TURN_PORT || '3478', 10);
const REALM = process.env.TURN_REALM || 'silly-goober.turn';
const SECRET = process.env.TURN_SECRET || '';

(async () => {
  console.log('Checking TURN at %s:%d (realm %s)\n', HOST, PORT, REALM);

  if (!SECRET) {
    console.log('TURN_SECRET is not set in backend/.env - cannot test authentication.');
    process.exit(2);
  }

  const creds = makeTurnCredentials(SECRET, 120, 'check');
  const r = await runTurnSelfTest({
    host: HOST, port: PORT, realm: REALM,
    username: creds.username, credential: creds.credential,
    timeoutMs: 8000
  });

  if (r.stun.ok) {
    console.log('  [OK]   STUN binding      - server sees you as ' + r.stun.mapped);
  } else {
    console.log('  [FAIL] STUN binding      - ' + r.stun.error);
  }

  if (r.allocate.ok) {
    console.log('  [OK]   TURN allocate     - realm=' + r.allocate.challengeRealm + ' relay=' + r.allocate.relayed);
  } else {
    console.log('  [FAIL] TURN allocate     - ' + r.allocate.error);
  }

  console.log('');
  if (r.ok) {
    console.log('PASS - the relay is reachable and your TURN_SECRET matches.');
    console.log('Set TURN_SECRET in Render and redeploy.');
    process.exit(0);
  }

  // Targeted next step rather than a generic failure.
  if (!r.stun.ok) {
    console.log('FAIL - nothing is reaching the server on ' + PORT + '/udp.');
    console.log('');
    console.log('The instance firewall is already open and no NSG is attached, so this');
    console.log('is the OCI VCN Security List. In the OCI console check that the');
    console.log('INGRESS rules live on the security list actually attached to the');
    console.log('subnet holding this VNIC:');
    console.log('');
    console.log('  Region : eu-amsterdam-1');
    console.log('  Subnet : the one with CIDR 10.0.0.0/24 (private IP 10.0.0.60)');
    console.log('');
    console.log('  Needed, all Ingress / Stateful / Source CIDR 0.0.0.0/0:');
    console.log('    UDP 3478        UDP 49152-65535        TCP 3478');
    console.log('');
    console.log('Most common mistakes: rules added as Egress instead of Ingress, or');
    console.log('added to a security list that is not the one attached to this subnet.');
  } else if (/401/.test(r.allocate.error || '')) {
    console.log('FAIL - reachable, but the secret is wrong.');
    console.log('TURN_SECRET here does not match static-auth-secret in');
    console.log('/etc/turnserver.conf on the TURN host.');
  } else {
    console.log('FAIL - reachable, but allocate was refused: ' + r.allocate.error);
  }
  process.exit(1);
})();
