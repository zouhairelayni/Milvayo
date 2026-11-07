// /src/cloud/batches.cjs
'use strict';
const {stable}=require('./schema.cjs'),{tooBig}=require('../store/importFiles.cjs');
function* batches(rows,maxRows=100,maxBytes=650000){let batch=[];for(const row of rows){if(tooBig(stable(row),maxBytes))throw Error('A cloud import record exceeds the batch budget');if(batch.length>=maxRows||tooBig(stable([...batch,row]),maxBytes)){yield batch;batch=[];}batch.push(row);}if(batch.length)yield batch;}
module.exports={batches};
