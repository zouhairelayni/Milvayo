// /tests/domain/progress.test.cjs
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { progressOf } = require('../../src/utils/progress.cjs');
const model = require('../../src/domain/model.cjs');
const { projectMetric } = require('../../src/domain/governanceSummary.cjs');

const tasks = [{ status: 'Done', progress: 0 }, { status: 'In progress', progress: 50 }, { milestone: true, status: 'To do', progress: 0 }];
test('progressOf counts partial work and skips milestones', () => {
  assert.equal(progressOf(tasks), 0.75);
  assert.equal(progressOf([]), 0);
  assert.equal(progressOf([{ status: 'To do' }]), 0);
});
test('project summary uses the same progress as Overview', () => {
  const p = model.makeProject({ id: 'p1', name: 'P' });
  p.tasks = tasks.map((t, i) => ({ ...p.tasks[0], ...t, id: `t${i}` }));
  assert.equal(projectMetric(p).progress, progressOf(p.tasks));
});

test('projectMetric is cached per project object and recomputed for a new one',()=>{
 const {projectMetric}=require('../../src/domain/governanceSummary.cjs');
 const model=require('../../src/domain/model.cjs');
 const p=model.makeProject({id:'p1',name:'A',code:'A'});
 assert.equal(projectMetric(p),projectMetric(p));
 assert.notEqual(projectMetric({...p}),projectMetric(p));
});
