// /tests/store/crypto-migration-0554.test.cjs
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { createCipheriv, createDecipheriv, pbkdf2Sync, createHmac, randomBytes } = require('node:crypto');
const { createExpoAesGcm } = require('../../src/store/expoAesGcm.cjs');
const { createCodec } = require('../../src/store/niyav.cjs');
const { pbkdf2Chunked } = require('../../src/store/pbkdf2Chunked.cjs');
const zlib = require('node:zlib');
const root = path.join(__dirname, '../..');
const text = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

// Strict mock of the documented SDK 58 AES API: the encryption reference is independent Node crypto.
function expoMock() {
  const calls = [];
  return {
    calls,
    AESEncryptionKey: { import: async (bytes) => { assert.equal(bytes.length, 32); calls.push('import'); return Buffer.from(bytes); } },
    aesEncryptAsync: async (plain, key, options) => {
      assert.equal(options.tagLength, 16);
      assert.equal(options.nonce.bytes.length, 12);
      assert.ok(options.additionalData instanceof Uint8Array);
      calls.push('encrypt');
      const iv = Buffer.from(options.nonce.bytes);
      const c = createCipheriv('aes-256-gcm', key, iv);
      c.setAAD(Buffer.from(options.additionalData));
      const output = Buffer.concat([c.update(plain), c.final(), c.getAuthTag()]);
      return { ciphertext: async ({encoding,includeTag}) => {
        assert.equal(encoding, 'bytes'); assert.equal(includeTag, true);
        calls.push('ciphertext'); return new Uint8Array(output);
      } };
    },
    AESSealedData: { fromParts: (iv, sealed, tagLength) => {
      assert.equal(tagLength,16); calls.push('fromParts');
      return { iv: Buffer.from(iv), sealed: Buffer.from(sealed) };
    } },
    aesDecryptAsync: async (sealed, key, options) => {
      assert.equal(options.output, 'bytes');
      calls.push('decrypt');
      const d = createDecipheriv('aes-256-gcm', key, sealed.iv);
      d.setAAD(Buffer.from(options.additionalData));
      d.setAuthTag(sealed.sealed.subarray(-16));
      return new Uint8Array(Buffer.concat([d.update(sealed.sealed.subarray(0,-16)),d.final()]));
    },
  };
}

test('expo-crypto AES adapter matches the known-answer vector and native SDK call contract',async()=>{
 const api=expoMock(), aes=createExpoAesGcm(api);
 const key=new Uint8Array([...Array(32).keys()]);
 const nonce=new Uint8Array([...Array(12).keys()].map(i=>i+100));
 const aad=new TextEncoder().encode('niyav-kat-aad');
 const plain=new TextEncoder().encode('niyarvo known answer');
 const sealed=await aes.encrypt(key,nonce,aad,plain);
 assert.equal(Buffer.from(sealed).toString('hex'),'2672a7070b9f39be550c309fb4450b9331b56378f7de91ab205867a1295a7aeba0f1c13c');
 assert.equal(new TextDecoder().decode(await aes.decrypt(key,nonce,aad,sealed)), 'niyarvo known answer');
 assert.deepEqual(api.calls,['import','encrypt','ciphertext','import','fromParts','decrypt']);
 const bad=sealed.slice(); bad[0]^=1;
 await assert.rejects(()=>aes.decrypt(key,nonce,aad,bad));
 const badAAD=aad.slice(); badAAD[0]^=1;
 await assert.rejects(()=>aes.decrypt(key,nonce,badAAD,sealed));
 const badIV=nonce.slice(); badIV[0]^=1;
 await assert.rejects(()=>aes.decrypt(key,badIV,aad,sealed));
 await assert.rejects(()=>aes.decrypt(key,nonce,aad,new Uint8Array(8)),/authentication tag/);
 await assert.rejects(()=>aes.encrypt(new Uint8Array(16),nonce,aad,plain),/32-byte/);
});

test('migrated cipher reads legacy Node-crypto protected backups and writes Node-readable files',async()=>{
 const aes=createExpoAesGcm(expoMock());
 const p={
   strToU8:s=>new TextEncoder().encode(s),strFromU8:b=>new TextDecoder().decode(b),
   gzip:b=>new Uint8Array(zlib.gzipSync(b)),gunzip:b=>new Uint8Array(zlib.gunzipSync(b)),
   randomBytes:n=>new Uint8Array(randomBytes(n)),aesGcmEncrypt:aes.encrypt,aesGcmDecrypt:aes.decrypt,
   pbkdf2:(pw,salt,iterations,len)=>Promise.resolve(new Uint8Array(pbkdf2Sync(pw,salt,iterations,len,'sha256'))),
 };
 const codec=createCodec(p);
 const sample='{"project":"legacy","tasks":["alpha","beta"],"memo":"🔐"}';
 const password='full-size-backup-password';
 const made=await codec.encode(sample,{password,level:'low'});
 assert.equal(codec.sniff(made),'encrypted');
 const raw=Buffer.from(made),head=raw.subarray(0,40),salt=head.subarray(12,28),nonce=head.subarray(28,40);
 const iters=head.readUInt32BE(8),key=pbkdf2Sync(Buffer.from(password.normalize('NFKC'),'utf8'),salt,iters,32,'sha256');
 const d=createDecipheriv('aes-256-gcm',key,nonce);d.setAAD(head);d.setAuthTag(raw.subarray(-16));
 const plain=Buffer.concat([d.update(raw.subarray(40,-16)),d.final()]);
 assert.equal(zlib.gunzipSync(plain).toString(),sample);
 // Old format built by Node reference, not by the new adapter.
 const oldKey=pbkdf2Sync(Buffer.from(password.normalize('NFKC'),'utf8'),salt,iters,32,'sha256');
 const c=createCipheriv('aes-256-gcm',oldKey,nonce);c.setAAD(head);
 const gz=zlib.gzipSync(Buffer.from(sample));
 const legacy=Buffer.concat([head,c.update(gz),c.final(),c.getAuthTag()]);
 assert.equal(await codec.decode(legacy,{password}),sample);
 await assert.rejects(codec.decode(legacy,{password:'a-different-password'}),{code:'NIYAV_BAD_PASSWORD'});
 const forged=Buffer.from(legacy);forged[39]^=1;
 await assert.rejects(codec.decode(forged,{password}),{code:'NIYAV_BAD_PASSWORD'});
});

test('PBKDF2 HMAC-SHA256 remains byte-identical and cancellable',async()=>{
 const mac=key=>message=>new Uint8Array(createHmac('sha256',key).update(message).digest());
 const key=new TextEncoder().encode('password'),salt=new TextEncoder().encode('salt');
 const got=await pbkdf2Chunked(mac(key),salt,1000,32,{sliceMs:0,tick:async()=>{}});
 assert.equal(Buffer.from(got).toString('hex'),'632c2812e46d4604102ba7618e9d6d7d2f8128f6266b4a03264d2a0460b7dcb3');
 const ctl=new AbortController();ctl.abort();
 await assert.rejects(pbkdf2Chunked(mac(key),salt,1000,32,{signal:ctl.signal}),{code:'NIYAV_CANCELLED'});
});

test('No Noble direct or transitive dependency, and Expo Go supported AES remains the sole cipher',()=>{
 const pkg=require('../../package.json'),lock=require('../../package-lock.json');
 assert.equal(pkg.version,'0.5.59');
 assert.equal(pkg.dependencies['js-sha256'],'1.0.0');
 assert.ok(pkg.dependencies['expo-crypto'].includes('58.0.7'));
 assert.equal(lock.packages['node_modules/js-sha256'].version,'1.0.0');
 assert.equal(lock.packages[''].dependencies['js-sha256'],'1.0.0');
 assert.ok(!Object.keys(lock.packages).some(n=>n.includes('/@noble/')));
 assert.ok(!Object.keys(pkg.dependencies).some(n=>n.startsWith('@noble/')));
 const prim=text('src/store/niyavPrimitives.js');
 assert.match(prim,/from 'js-sha256'/);
 assert.match(prim,/sha256\.hmac\.create\(password\)\.update\(message\)\.array\(\)/);
 assert.match(prim,/createExpoAesGcm\(Crypto\)/);
 assert.match(prim,/selfTest\(base\.sniff\(bytes\) === 'encrypted'\)/);
 assert.match(prim,/const sealed = await primitives\.aesGcmEncrypt/);
 assert.match(prim,/await primitives\.aesGcmDecrypt\(key, nonce, aad, bad\)/);
 assert.doesNotMatch(prim,/@noble|\bgcm\(/);
});

test('password bytes are zeroed even when KDF rejects on create or restore',async()=>{
  const base={
    strToU8:s=>new TextEncoder().encode(s),strFromU8:b=>new TextDecoder().decode(b),
    gzip:b=>new Uint8Array(zlib.gzipSync(b)),gunzip:b=>new Uint8Array(zlib.gunzipSync(b)),
    randomBytes:n=>new Uint8Array(randomBytes(n)),
  };
  let captured;
  const broken=createCodec({ ...base, pbkdf2:async(pw)=>{captured=pw;throw new Error('KDF failed');} });
  await assert.rejects(broken.encode('backup',{password:'very long secure password',iterations:100000}),/KDF failed/);
  assert.equal(captured.every(b=>b===0),true,'create wipes password bytes after KDF failure');
  const valid=createCodec({ ...base,
    aesGcmEncrypt:createExpoAesGcm(expoMock()).encrypt,
    aesGcmDecrypt:createExpoAesGcm(expoMock()).decrypt,
    pbkdf2:(pw,salt,it,len)=>Promise.resolve(new Uint8Array(pbkdf2Sync(pw,salt,it,len,'sha256'))),
  });
  const sealed=await valid.encode('backup',{password:'very long secure password',iterations:100000});
  await assert.rejects(broken.decode(sealed,{password:'very long secure password'}),/KDF failed/);
  assert.equal(captured.every(b=>b===0),true,'restore wipes password bytes after KDF failure');
});
