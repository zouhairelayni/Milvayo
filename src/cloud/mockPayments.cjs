// /src/cloud/mockPayments.cjs
'use strict';
const {sha256}=require('js-sha256'),{stable}=require('./schema.cjs');
// Public emulator fixture key, never a production secret or authorization grant.
const KEY='demo-milvayo-simulated-payment-provider';
const sign=event=>sha256.hmac(KEY,stable(event));
module.exports={KEY,sign};
