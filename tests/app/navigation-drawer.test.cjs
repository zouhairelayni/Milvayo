// /tests/app/navigation-drawer.test.cjs
 'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const s=require('../helpers/shell-source.cjs')();
test('one modern drawer handles navigation and project switching',()=>{assert.match(s,/function SideMenu/);assert.match(s,/function ProjectDrawer/);assert.match(s,/setMenu\(false\)/);assert.match(s,/switchProject/)});
test('all original capability groups have modern navigation destinations',()=>{for(const x of ['scheduling','collaboration','specifications','resources','automations','projects','portfolios','programs','settings'])assert.match(s,new RegExp(`['"]${x}['"]`))});
test('modern shell never mounts retired ClassicApp',()=>{assert.doesNotMatch(s,/ClassicApp|advanced workspace/i);assert.match(s,/function Shell/)});
