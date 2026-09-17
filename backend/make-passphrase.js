#!/usr/bin/env node
'use strict';

/**
 * Generate bcrypt hashes for the real + duress passphrases:
 *
 *   npm run make-passphrase
 *
 * Reads the passphrases from stdin so they are never typed as a shell
 * argument (shell history) and never pasted into a chat. Only the hashes
 * are printed - those are what go into Render's env vars.
 */

const readline = require('readline');
const bcrypt = require('bcryptjs');

function ask(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

(async () => {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

  console.log('Passphrase tips:');
  console.log('  - Pick something that looks like a plausible note search if someone');
  console.log('    is watching you type. Not "password", not anything call-related.');
  console.log('  - The duress one should be easy to hand over without hesitating.');
  console.log('');

  const real = (await ask(rl, 'REAL passphrase   : ')).trim();
  const decoy = (await ask(rl, 'DURESS passphrase : ')).trim();
  rl.close();

  if (!real || !decoy) {
    console.error('\nBoth passphrases are required.');
    process.exit(1);
  }
  if (real === decoy) {
    console.error('\nThe two passphrases must be different.');
    process.exit(1);
  }

  console.log('\nSet these in Render (Environment tab), then redeploy:\n');
  console.log('REAL_PASS_HASH=' + bcrypt.hashSync(real, 10));
  console.log('DECOY_PASS_HASH=' + bcrypt.hashSync(decoy, 10));
  console.log('\n(The passphrases themselves are not stored or printed anywhere.)');
})();
