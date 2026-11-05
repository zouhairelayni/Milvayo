#!/usr/bin/env node
// /scripts/ci/upload-android-signing-secrets.cjs
'use strict';
// One-time local helper. Runs on your own device, never in GitHub Actions.
// Reads EAS-exported credentials.json and its keystore, then sends four values
// directly to GitHub encrypted Actions secrets without printing their contents.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function loadSigningCredentials(filename) {
  const file = path.resolve(filename);
  const json = JSON.parse(fs.readFileSync(file, 'utf8'));
  const k = json?.android?.keystore;
  if (!k || typeof k.keystorePath !== 'string' || !k.keystorePath.trim()) {
    throw new Error('Missing android.keystore.keystorePath in credentials JSON.');
  }
  for (const key of ['keystorePassword', 'keyAlias', 'keyPassword']) {
    if (typeof k[key] !== 'string' || !k[key]) {
      throw new Error(`Missing android.keystore.${key} in credentials JSON.`);
    }
  }
  const keystorePath = path.resolve(path.dirname(file), k.keystorePath);
  const bytes = fs.readFileSync(keystorePath);
  if (bytes.length < 1000) throw new Error('Keystore is missing or unexpectedly small.');
  return {
    MILVAYO_ANDROID_KEYSTORE_BASE64: bytes.toString('base64'),
    MILVAYO_ANDROID_KEYSTORE_PASSWORD: k.keystorePassword,
    MILVAYO_ANDROID_KEY_ALIAS: k.keyAlias,
    MILVAYO_ANDROID_KEY_PASSWORD: k.keyPassword,
  };
}

function main() {
  const filename = process.argv[2];
  if (!filename) {
    throw new Error('Usage: node scripts/ci/upload-android-signing-secrets.cjs /path/to/credentials.json');
  }
  const repo = 'zouhairelayni/Milvayo';
  const secrets = loadSigningCredentials(filename);
  for (const [name, value] of Object.entries(secrets)) {
    const result = spawnSync('gh', ['secret', 'set', name, '--repo', repo], {
      input: value,
      encoding: 'utf8',
      stdio: ['pipe', 'inherit', 'inherit'],
    });
    if (result.error) throw new Error(`GitHub CLI failed: ${result.error.message}`);
    if (result.status !== 0) throw new Error(`Could not create GitHub secret ${name}.`);
    console.log(`Stored ${name}.`);
  }
  console.log('GitHub Android signing secrets configured. No secret values printed.');
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = { loadSigningCredentials };
