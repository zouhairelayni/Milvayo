// /tests/app/navigation-intent-0511.test.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
const {createNavigationIntent} = require('../../src/app/navigation/navigationIntent.cjs');
test('a current tab touch is accepted, but a release after navigation is stale', () => {
 const nav=createNavigationIntent(); const press=nav.begin('timeline');
 assert.equal(nav.accept(press,'timeline'),true);
 nav.advance(); assert.equal(nav.accept(press,'timeline'),false);
 assert.equal(nav.accept(nav.begin('board'),'board'),true);
});
test('missing touches and mismatched target releases cannot navigate',()=>{
 const nav=createNavigationIntent();
 assert.equal(nav.accept(null,'overview'),false);
 assert.equal(nav.accept(nav.begin('timeline'),'overview'),false);
});
