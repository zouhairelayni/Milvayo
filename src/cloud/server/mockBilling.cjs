// /src/cloud/server/mockBilling.cjs
'use strict';
const crypto=require('node:crypto');
const {sign}=require('../mockPayments.cjs');
function verify(event,signature,now=Date.now()){
 if(!event||event.provider!=='mock'||!['capacity','refund','payment-failed','payment-recovered'].includes(event.type)||typeof event.id!=='string'||!/^[a-zA-Z0-9-]{1,100}$/.test(event.id)||!Number.isSafeInteger(event.at)||Math.abs(now-event.at)>300000)throw Error('Invalid or expired simulated payment event');
 if(typeof signature!=='string'||!(/^[a-f0-9]{64}$/).test(signature)||!crypto.timingSafeEqual(Buffer.from(signature,'hex'),Buffer.from(sign(event),'hex')))throw Error('Invalid simulated webhook signature');
 if(event.type==='capacity'&&(!Number.isInteger(event.capacity)||event.capacity<0||event.capacity>100000))throw Error('Invalid simulated capacity');return event;
}
module.exports={sign,verify};
