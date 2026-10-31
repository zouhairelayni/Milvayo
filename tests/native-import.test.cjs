'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {readPickedJsonAsset,validatePickedAsset,userReadableImportError,MAX_IMPORT_BYTES}=require('../src/importFiles.cjs');

const doc={uri:'file:///data/user/0/com.niyarvo.projects/cache/demo.json',name:'demo.json',size:20};
const content={uri:'content://com.android.providers.downloads.documents/document/123',name:'mock.json',size:20};

test('document-picker cache file uses legacy UTF-8 reader, with no storage permission request',async()=>{
 let received;const result=await readPickedJsonAsset(doc,{legacy:{readAsStringAsync:async(uri,opts)=>{received={uri,opts};return '{"format":"niyarvo.project.v1"}';}}});
 assert.match(result,/niyarvo.project.v1/);assert.equal(received.uri,doc.uri);assert.equal(received.opts.encoding,'utf8');
});
test('Android content provider URI is copied into app cache and the original is preserved',async()=>{
 const calls=[];const legacy={cacheDirectory:'file:///app/cache/',copyAsync:async(o)=>calls.push(['copy',o]),readAsStringAsync:async(uri)=>{calls.push(['read',uri]);return '{"tasks":[]}';},deleteAsync:async(uri)=>calls.push(['delete',uri])};
 assert.equal(await readPickedJsonAsset(content,{legacy}),'{"tasks":[]}');
 assert.equal(calls[0][1].from,content.uri);assert.match(calls[0][1].to,/^file:\/\/\/app\/cache\/niyarvo-import-/);
 assert.equal(calls[1][1],calls[0][1].to);assert.equal(calls[2][1],calls[0][1].to);
 assert.ok(calls.every(c=>c[1]!==content.uri || c[0]==='copy'));
});
test('temporary file is removed even if import read fails',async()=>{
 const calls=[];const legacy={cacheDirectory:'file:///cache/',copyAsync:async(o)=>calls.push(['copy',o]),readAsStringAsync:async()=>{throw Error('Unreadable')},deleteAsync:async(u)=>calls.push(['delete',u])};
 await assert.rejects(readPickedJsonAsset(content,{legacy}),/Unreadable/);assert.equal(calls[1][0],'delete');assert.equal(calls[1][1],calls[0][1].to);
});
test('oversized picked document rejected before file access',async()=>{
 let reads=0;await assert.rejects(readPickedJsonAsset({...doc,size:MAX_IMPORT_BYTES+1},{legacy:{readAsStringAsync:async()=>{reads++;return ''}}}),/exceeds 5 MB/);assert.equal(reads,0);
});
test('oversized cache copy is rejected even if provider supplies no size',async()=>{
 let reads=0;await assert.rejects(readPickedJsonAsset({...doc,size:undefined},{legacy:{getInfoAsync:async()=>({size:MAX_IMPORT_BYTES+1}),readAsStringAsync:async()=>{reads++;return ''}}}),/exceeds 5 MB/);assert.equal(reads,0);
});
test('oversized returned text is rejected when metadata is absent',async()=>{
 await assert.rejects(readPickedJsonAsset({...doc,size:undefined},{legacy:{readAsStringAsync:async()=>'*'.repeat(101)},maxBytes:100}),/exceeds 5 MB/);
});
test('fallback File.text is used for local file only when legacy reader fails',async()=>{
 const result=await readPickedJsonAsset(doc,{legacy:{readAsStringAsync:async()=>{throw Error('Legacy unavailable')}},fileFactory:(uri)=>({text:async()=>uri===doc.uri?'ok':'bad'})});assert.equal(result,'ok');
});
test('permission errors explain Downloads retry and do not expose internal URI',async()=>{
 const message=userReadableImportError(new Error("Call to function 'FileSystemFile.text' has been rejected. Missing 'READ' permission"));assert.match(message,/Downloads/);assert.doesNotMatch(message,/FileSystemFile|content:\/\//);
 const legacy={readAsStringAsync:async()=>{throw Error("Missing 'READ' permission for accessing the file.")}};
 await assert.rejects(readPickedJsonAsset(doc,{legacy}),/The current workspace has not changed/);
});
test('unsupported arbitrary URI rejected without trying to read',()=>{
 assert.throws(()=>validatePickedAsset({uri:'https://example.com/untrusted.json'}),/no supported local file address/);
});
test('empty document result is handled without a crash',()=>{
 assert.throws(()=>validatePickedAsset(null),/no supported local file address/);
});

test('unavailable metadata does not block reading a picker-granted cache file',async()=>{
 const text=await readPickedJsonAsset({...doc,size:undefined},{legacy:{getInfoAsync:async()=>{throw Error('Stat unavailable')},readAsStringAsync:async()=>'{"ok":true}'}});
 assert.equal(text,'{"ok":true}');
});

const {pickAndroidJsonText}=require('../src/importFiles.cjs');

test('Android SAF picker reads directly from granted File instead of inaccessible DocumentPicker cache', async()=>{
 let options;
 const File={pickFileAsync:async o=>{options=o;return {canceled:false,result:{uri:'content://downloads/document/42',size:133,text:async()=>'\ufeff{"format":"niyarvo.project.v1"}'}}}};
 assert.match(await pickAndroidJsonText(File),/niyarvo.project.v1/);
 assert.equal(options.multipleFiles,false);
 assert.ok(options.mimeTypes.includes('*/*'));
});
test('Android SAF picker cancellation does not read or mutate anything',async()=>{
 assert.equal(await pickAndroidJsonText({pickFileAsync:async()=>({canceled:true,result:null})}),null);
});
test('Android SAF picker supports older bare File return',async()=>{
 assert.equal(await pickAndroidJsonText({pickFileAsync:async()=>({size:2,text:async()=>'{ }'})}),'{ }');
});
test('Android SAF picker refuses overlarge document without reading it',async()=>{
 let reads=0;
 await assert.rejects(pickAndroidJsonText({pickFileAsync:async()=>({result:{size:MAX_IMPORT_BYTES+1,text:async()=>{reads++;return '';}}})}),/exceeds 5 MB/);
 assert.equal(reads,0);
});
test('Android SAF picker refuses large text when provider reports no size',async()=>{
 await assert.rejects(pickAndroidJsonText({pickFileAsync:async()=>({result:{text:async()=>'*'.repeat(101)}})},100),/exceeds 5 MB/);
});
test('Android SAF picker surfaces sanitized access errors, no private cache paths',async()=>{
 await assert.rejects(pickAndroidJsonText({pickFileAsync:async()=>({result:{text:async()=>{throw Error("Location 'file:///data/user/0/host.exp.exponent/cache/DocumentPicker/foo.json' isn't readable")}}})}), e=>{
  assert.match(e.message,/Android could not read/);assert.doesNotMatch(e.message,/host\.exp|file:\/\//);return true;
 });
});
test('unsupported SDK lacking SAF picker has explicit compatibility error',async()=>{
 await assert.rejects(pickAndroidJsonText({}), e=>e.code==='NP_PICKER_UNAVAILABLE');
});
test('Android SAF failure does not hide size-limit rejection',async()=>{
 await assert.rejects(pickAndroidJsonText({pickFileAsync:async()=>({result:{size:0,text:async()=>{throw Error('File exceeds 5 MB size limit.')}}})}),/exceeds 5 MB/);
});

test('Android SAF file may be readable even if size metadata throws',async()=>{
 const file={get size(){throw Error('provider stat denied')},text:async()=>'{"ok":true}'};
 assert.equal(await pickAndroidJsonText({pickFileAsync:async()=>({canceled:false,result:file})}),'{"ok":true}');
});
