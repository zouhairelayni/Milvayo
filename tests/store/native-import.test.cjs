// /tests/store/native-import.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {tooBig,utf8Bytes,userReadableImportError,pickDocumentJsonText,pickAndroidJsonText,MAX_IMPORT_BYTES,parseBackupJson}=require('../../src/store/importFiles.cjs');


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
  assert.match(e.message,/selected file could not be read/);assert.match(e.message,/Downloads/);assert.doesNotMatch(e.message,/host\.exp|file:\/\//);return true;
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

test('permission errors explain Downloads retry and do not expose internal URI',()=>{
 const message=userReadableImportError(new Error("Call to function 'FileSystemFile.text' has been rejected. Missing 'READ' permission"));
 assert.match(message,/Downloads/);assert.doesNotMatch(message,/FileSystemFile|content:\/\//);
});
const pick=(asset)=>({canceled:false,assets:[asset]});
const File=(text)=>class{constructor(uri){this.uri=uri}async text(){return text}};
test('iOS document picker: cancel, wrong type, oversized file and oversized text are refused',async()=>{
 assert.equal(await pickDocumentJsonText({canceled:true},File('')),null);
 assert.equal(await pickDocumentJsonText({canceled:false,assets:[]},File('')),null);
 await assert.rejects(pickDocumentJsonText(pick({uri:'file:///a.txt',name:'a.txt'}),File('{}')),/\.json/);
 let reads=0;const Spy=class{async text(){reads++;return '{}'}};
 await assert.rejects(pickDocumentJsonText(pick({uri:'file:///a.json',name:'a.json',size:MAX_IMPORT_BYTES+1}),Spy),/exceeds 5 MB/);assert.equal(reads,0);
 await assert.rejects(pickDocumentJsonText(pick({uri:'file:///a.json',name:'A.JSON'}),File('*'.repeat(101)),100),/exceeds 5 MB/);
});
test('iOS document picker returns the text and strips a BOM',async()=>{
 assert.equal(await pickDocumentJsonText(pick({uri:'file:///a.json',name:'a.json',size:2}),File('\uFEFF{ }')),'{ }');
});

test('size limit counts UTF-8 bytes, not characters',async()=>{
 assert.equal(utf8Bytes('a'),1);assert.equal(utf8Bytes('é'),2);assert.equal(utf8Bytes('€'),3);assert.equal(utf8Bytes('😀'),4);
 const emoji='😀'.repeat(30); // 60 characters, 120 bytes
 assert.equal(tooBig(emoji,100),true);assert.equal(tooBig('😀'.repeat(25),100),false);assert.equal(tooBig('a'.repeat(101),100),true);
 await assert.rejects(pickDocumentJsonText(pick({uri:'file:///a.json',name:'a.json'}),File(emoji),100),/exceeds 5 MB/);
 await assert.rejects(pickAndroidJsonText({pickFileAsync:async()=>({result:{text:async()=>emoji}})},100),/exceeds 5 MB/);
});

test('JSON backup parsing distinguishes malformed JSON from invalid backup structure',()=>{
 for(const t of ['null','5','[]','"x"'])assert.throws(()=>parseBackupJson(t),e=>e.code==='BACKUP_STRUCTURE'&&/valid Milvayo backup/.test(e.message));
 assert.deepEqual(parseBackupJson('{"a":1}'),{a:1});
 assert.throws(()=>parseBackupJson('{'),e=>e.code==='BACKUP_JSON_CORRUPT'&&/malformed or damaged/.test(e.message));
});

test('web picker checks the file size before reading it',()=>{
 const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../../src/screens/workspace/Backup.js'),'utf8');
 assert.ok(src.indexOf('f.size > MAX_IMPORT_BYTES')>-1&&src.indexOf('f.size > MAX_IMPORT_BYTES')<src.indexOf('readAsArrayBuffer'));
});
