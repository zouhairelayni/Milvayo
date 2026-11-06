// /tests/app/sprints-navigation-047.test.cjs
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const src=file=>fs.readFileSync(path.join(__dirname,'..', '..',file),'utf8');
test('modern sprint management uses original agile lifecycle; sprint goals are prose not oversized Stat values',()=>{
 const screen=src('src/screens/delivery/Delivery.js');
 const store=src('src/store/store.js');
 const agile=src('src/domain/agile.cjs');
 assert.match(screen, /createSprint\(draft\)/);
 assert.match(screen, /updateSprint\(selected\.id, draft\)/);
 assert.match(screen, /deleteSprint\(selected\.id\)/);
 assert.match(screen, /startSprint\(selected\.id\)/);
 assert.match(screen, /finishSprint\(selected\.id\)/);
 assert.match(screen, /assignSprintTask\(t\.id, selected\.id\)/);
 assert.match(screen, /size=\{14\} style=\{\{ lineHeight: 22, letterSpacing: 0 \}\}/);
 assert.doesNotMatch(screen,/Stat label="Sprint goal"/);
 assert.match(store,/model\.agile\.createSprint/);
 assert.match(store,/model\.agile\.updatePlannedSprint/);
 assert.match(store,/model\.agile\.deleteSprint/);
 assert.match(agile,/function updatePlannedSprint/);
});

test('native Kanban scroll can own swipes before a hold, unlike prior responder-capturing release',()=>{
 const board=src('src/screens/board/Board.js');
 const gestures=src('src/board/boardGesture.native.js');
 assert.doesNotMatch(board,/disableScrollViewPanResponder/);
 assert.match(board,/nestedScrollEnabled/);
 assert.match(gestures,/onStartShouldSetPanResponder: \(\) => false/);
 assert.match(gestures,/onTouchStart: beginTouch/);
 assert.match(gestures,/onTouchMove: moveTouch/);
 assert.match(gestures,/pendingHolds\.forEach/);
 assert.match(gestures,/setInterval\(sync, TICK_MS\)/);
});
