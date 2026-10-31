'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.join(__dirname, '..');
const nativeSource = fs.readFileSync(path.join(root, 'src/BrandMark.js'), 'utf8');
const webSource = fs.readFileSync(path.join(root, 'src/BrandMark.web.js'), 'utf8');
const appSource = fs.readFileSync(path.join(root, 'App.js'), 'utf8');

function renderWebBrandMark(props = {}, accent = '#D97757') {
  // Execute the real web implementation with just its import/export syntax
  // replaced, so no node_modules or browser is needed for this contract test.
  const expression = webSource
    .replace(/^import[^\n]*\n/gm, '')
    .replace('export default function BrandMark', 'function BrandMark')
    + '\nBrandMark;';
  const React = {createElement: (tag, attributes, ...children) => ({tag, attributes, children})};
  const BrandMark = vm.runInNewContext(expression, {React, design:{colors:{accent}}});
  return BrandMark(props);
}

test('Web BrandMark bypasses react-native-svg WebShape and uses native DOM SVG', () => {
  assert.match(appSource, /import BrandMark from '\.\/src\/BrandMark'/);
  assert.doesNotMatch(webSource, /react-native-svg|WebShape|<Svg|<Path/);
  const logo = renderWebBrandMark();
  assert.equal(logo.tag, 'svg');
  assert.equal(logo.attributes.role, 'img');
  assert.equal(logo.attributes['aria-label'], 'Niyarvo symbol');
  assert.equal(logo.attributes.viewBox, '0 0 800 760');
  assert.equal(logo.attributes.width, 36);
  assert.equal(logo.attributes.height, 36);
  assert.equal(logo.children.length, 4);
  assert.ok(logo.children.every(child => child.tag === 'path'));
});

test('Web and native Niyarvo brand marks preserve the same original centered geometry', () => {
  const original = [...nativeSource.matchAll(/<Path d="([^"]+)"/g)].map(m => m[1]);
  const web = renderWebBrandMark({size:48});
  assert.equal(original.length, 4);
  assert.deepEqual(web.children.map(x => x.attributes.d), original);
  assert.equal(web.attributes.width, 48);
  assert.equal(web.attributes.height, 48);
});

test('Web brand mark follows the configured accent or an explicitly supplied tint', () => {
  const selected = renderWebBrandMark({}, '#21B4A0');
  assert.ok(selected.children.every(x => x.attributes.fill === '#21B4A0'));
  const overridden = renderWebBrandMark({color:'#AABBCC'});
  assert.ok(overridden.children.every(x => x.attributes.fill === '#AABBCC'));
  assert.deepEqual(overridden.children.map(x => x.attributes.opacity), [0.93, 0.93, 0.93, undefined]);
});
