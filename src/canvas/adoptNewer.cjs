// /src/canvas/adoptNewer.cjs
'use strict';
// Lets an open Canvas screen take the newer board when someone else's changes arrive (0.8.34, audit finding F12).
// The screen keeps its own copy of the board (`current`) and the revision it last saved (`expected`).
// In a cloud workspace the board revision goes up only when changes from ANOTHER person arrive (see src/cloud/canvasStale.cjs), and the screen's own saves keep it equal to `expected`.
// So "revision differs from what I last saved" means: my copy is out of date.
//   keep  = I have an unsaved local change; never replace it silently.
//   same  = nothing newer (a lower revision is never taken: it would bring an older copy back).
//   adopt = take the board from the workspace, drop undo/redo (they would bring the old copy back) and drop selections of things that are gone.
function decide({pending,expected,board}){
 if(!board)return 'same';
 if(pending)return 'keep';
 return board.revision>expected?'adopt':'same';
}
const keepSelection=(selected,board)=>{const ids=new Set((board.objects||[]).map(o=>o.id));return (selected||[]).filter(id=>ids.has(id));};
module.exports={decide,keepSelection};
