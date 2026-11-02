// /tests/app/task-sheet-standard-0526.test.cjs
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {inline,lines}=require('../../src/ui/taskMarkdown.cjs');
const {COLORS,defaultColor,labelColor,normalizeLabelColors,textColor}=require('../../src/ui/labelPalette.cjs');
const model=require('../../src/domain/model.cjs');
const read=p=>fs.readFileSync(path.join(__dirname,'../..',p),'utf8');

test('Markdown read mode renders bold, italic, headings and bullet text without treating HTML as markup',()=>{
 const x=inline('Hello **bold** and *italic* plus `code`');
 assert.deepEqual(x.filter(t=>t.bold||t.italic||t.code).map(t=>[t.text,!!t.bold,!!t.italic,!!t.code]),[['bold',true,false,false],['italic',false,true,false],['code',false,false,true]]);
 const y=lines('# Heading\n- **Done**\n<fake>');assert.equal(y[0].kind,'heading');assert.equal(y[1].kind,'list');assert.equal(y[2].parts[0].text,'<fake>');
});
test('Label colors have a large deterministic palette, reject invalid values and survive project JSON normalization',()=>{
 assert.ok(COLORS.length>=20);assert.equal(defaultColor('Urgent'),defaultColor('Urgent'));
 assert.equal(labelColor('Urgent',{Urgent:'#112233'}),'#112233');assert.match(textColor('#FACC15'),/^#/);
 assert.deepEqual(normalizeLabelColors({Urgent:'#AABBCC',Injected:'javascript:alert(1)'}),{Urgent:'#AABBCC'});
 const p=model.makeProject({id:'label-proof',name:'Demo',code:'DEM',labelColors:{Urgent:'#FF0000'},tasks:[{id:'DEM-001',title:'Old task ID remains stable',labels:['Urgent'],description:'**Hello**'}]});
 const saved=model.importProject(JSON.parse(JSON.stringify(p)));
 assert.equal(saved.tasks[0].id,'DEM-001');assert.equal(saved.labelColors.Urgent,'#FF0000');assert.deepEqual(saved.tasks[0].labels,['Urgent']);
});
test('Standard task sheet is focused, Advanced retains original editors, and ID appears only in task footer',()=>{
 const sheet=read('src/screens/tasks/TaskSheet.js');
 assert.match(sheet,/options=\{\['Standard','Advanced'\]\}/);
 assert.match(sheet,/descriptionEditing\?<Card/);
 assert.match(sheet,/<TaskMarkdown source=\{t.description\}/);
 assert.match(sheet,/\{mode==='Advanced'\?<View/);
 assert.match(sheet,/row\('schedule', 'Schedule'/);
 for(const id of ['subtasks','custom','integrations','time','delete','stage','type','progress','parent','release','sprint','dependencies','verification','checks','attachments']) assert.match(sheet,new RegExp(`row\\('${id}'`));
 assert.match(sheet, /Activity · \{t.comments.length\} comments/, 'comments are always visible in Standard mode');
 assert.doesNotMatch(sheet,/title=\{t \? `Task \$\{t\.id/);
 assert.match(sheet,/<T size=\{11\} muted>Task \{t\.id\}/);
 const board=read('src/screens/board/Board.js');assert.doesNotMatch(board,/<T size=\{11\} muted>\{t\.id\.toUpperCase\(\)\}/);assert.match(board,/<TaskLabels labels=\{t\.labels\}/);
});
test('Colored labels survive gzip and password-protected .niyav project backups',async()=>{
 const codec=require('../../src/store/niyav.cjs');
 const instance=codec.createCodec(require('../helpers/niyavNodePrimitives.cjs'));
 const project=model.makeProject({id:'demo-code',name:'Demo',tasks:[{id:'DEMO-01',title:'Styled',labels:['Red']}],labelColors:{Red:'#DC2626'}});
 const encoded=JSON.stringify(project);
 for(const options of [{},{password:'sample-valid-password',iterations:codec.MIN_ITERATIONS}]) {
  const bytes=await instance.encode(encoded,options);
  const restored=model.importProject(JSON.parse(await instance.decode(bytes,options)));
  assert.deepEqual(restored.labelColors,project.labelColors);
  assert.deepEqual(restored.tasks[0].labels,['Red']);
 }
});
