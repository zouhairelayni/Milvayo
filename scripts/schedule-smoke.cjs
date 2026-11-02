// /scripts/schedule-smoke.cjs
'use strict';
// Read-only smoke test: uses isolated example tasks, never loads a user's workspace.
const scheduling=require('../src/domain/scheduling.cjs');
const project={id:'np-sched-smoke',tasks:[
 {id:'A',title:'Planning',start:'2026-11-02',due:'2026-11-06',dependsOn:[]},
 {id:'B',title:'Review',start:'2026-11-05',due:'2026-11-06',dependsOn:['A']},
 {id:'C',title:'Publish',start:'',due:'2026-11-06',milestone:true,dependsOn:['B']}
]};
const config={mode:'workdays',weekdays:[1,2,3,4,5],closed:['2026-11-09']};
const preview=scheduling.previewCascade(project,{changedTaskIds:['A'],calendar:config});
if(!preview.canApply)throw Error('Scheduling smoke preview blocked: '+JSON.stringify(preview.issues));
const updated=scheduling.applyCascade(project,preview,'2026-10-31T00:00:00.000Z');
const audit=scheduling.auditSchedule(updated,{calendar:config});
if(audit.issues.length)throw Error('Scheduling smoke audit found conflicts: '+JSON.stringify(audit.issues));
console.log(JSON.stringify({ok:true,mode:preview.mode,changed:preview.changes.map(c=>({taskId:c.taskId,start:c.newStart,due:c.newDue})),originalUnchanged:project.tasks[1].start==='2026-11-05',conflicts:audit.issues.length},null,2));
