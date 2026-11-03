// /tests/app/inline-notice-0529.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { inlineErrorText } = require('../../src/components/notice/inlineNotice.cjs');
const read = (f) => fs.readFileSync(path.join(__dirname, '..', '..', f), 'utf8');

test('4: only a new error notice is shown inline', () => {
  assert.equal(inlineErrorText({ id: 'n2', type: 'error', text: 'Complete predecessors before verifying' }, 'n1'), 'Complete predecessors before verifying');
  assert.equal(inlineErrorText({ id: 'n1', type: 'error', text: 'old' }, 'n1'), ''); // already on screen when the surface opened
  assert.equal(inlineErrorText({ id: 'n3', type: 'success', text: 'Saved' }, 'n1'), '');
  assert.equal(inlineErrorText({ id: 'n4', type: 'info', text: 'No tasks matched.' }, undefined), '');
  assert.equal(inlineErrorText(null, undefined), '');
});

test('4: the Task Sheet and the phone side menu are native Modals and show errors inline', () => {
  // Evidence: both surfaces are native Modals, while the island is mounted in the app shell outside them.
  assert.match(read('src/ui/uiLayout.js'), /<Modal visible=\{visible\}/);
  assert.match(read('src/screens/tasks/TaskSheet.js'), /<Sheet visible=/);
  const menus = read('src/components/shell/Menus.js');
  const sideMenu = menus.slice(menus.indexOf('export function SideMenu'));
  assert.match(sideMenu, /<Modal visible=\{visible\}/);
  assert.match(sideMenu, /<WorkspaceDrawer inModal /);
  assert.match(sideMenu, /<ProjectDrawer inModal /);
  assert.equal((menus.match(/\{inModal \? <InlineNotice \/> : null\}/g) || []).length, 2);
  // The Task Sheet shows it in the footer, which stays visible while the sheet body scrolls.
  assert.match(read('src/screens/tasks/TaskSheet.js'), /const footer = t \? \(\n\s+<>\n\s+<InlineNotice \/>/);
  assert.match(read('src/components/notice/InlineNotice.js'), /onPress=\{dismissNotice\}/);
});
