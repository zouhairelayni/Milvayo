'use strict';
// Independent board workspaces. Statuses remain globally defined; board membership is orthogonal.
const DEFAULT_BOARD_ID='board-default';
function normalizedBoards(project={}) {
 const input=Array.isArray(project.boards)?project.boards:[];
 if(input.length>16)throw Error('Maximum 16 Kanban boards per project');
 const out=[{id:DEFAULT_BOARD_ID,name:'Main board'},...input.filter(x=>x&&x.id!==DEFAULT_BOARD_ID).map(x=>({id:String(x.id||''),name:String(x.name||'').trim()}))];
 if(out.some(x=>!x.id||!x.name||x.name.length>80)||new Set(out.map(x=>x.id)).size!==out.length)throw Error('Invalid or duplicate Kanban board');
 return out;
}
function effectiveBoard(task){return task.boardId||DEFAULT_BOARD_ID}
function tasksForBoard(project,boardId){const boards=normalizedBoards(project);if(!boards.some(b=>b.id===boardId))throw Error('Board not found');return (project.tasks||[]).filter(t=>effectiveBoard(t)===boardId)}
function createBoard(project,name){const n=String(name||'').trim();if(!n||n.length>80)throw Error('Board name must contain 1–80 characters');const boards=normalizedBoards(project);if(boards.length>=16)throw Error('Maximum 16 boards');if(boards.some(b=>b.name.toLowerCase()===n.toLowerCase()))throw Error('Board name already exists');return {...project,boards:[...boards,{id:'board-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name:n}]};}
function renameBoard(project,boardId,name){const n=String(name||'').trim();if(!n||n.length>80)throw Error('Invalid board name');if(boardId===DEFAULT_BOARD_ID)throw Error('Main board name is reserved');const boards=normalizedBoards(project);if(!boards.some(x=>x.id===boardId))throw Error('Board not found');if(boards.some(x=>x.id!==boardId&&x.name.toLowerCase()===n.toLowerCase()))throw Error('Board name already exists');return {...project,boards:boards.map(x=>x.id===boardId?{...x,name:n}:x)};}
function deleteBoard(project,boardId){if(boardId===DEFAULT_BOARD_ID)throw Error('Main board cannot be deleted');const boards=normalizedBoards(project);if(!boards.some(x=>x.id===boardId))throw Error('Board not found');return {...project,boards:boards.filter(x=>x.id!==boardId),powerUps:Object.fromEntries(Object.entries(project.powerUps||{}).filter(([id])=>id!==boardId)),automationCommands:(project.automationCommands||[]).map(c=>c.boardId===boardId?{...c,enabled:false,boardId:''}:c),tasks:project.tasks.map(t=>effectiveBoard(t)===boardId?{...t,boardId:DEFAULT_BOARD_ID}:t)};}
function assignBoard(project,taskId,boardId){if(!normalizedBoards(project).some(x=>x.id===boardId))throw Error('Board not found');if(!project.tasks.some(t=>t.id===taskId))throw Error('Task not found');return {...project,tasks:project.tasks.map(t=>t.id===taskId?{...t,boardId,updatedAt:new Date().toISOString()}:t)};}
function validateBoards(p){const known=new Set(normalizedBoards(p).map(x=>x.id));for(const t of p.tasks||[])if(!known.has(effectiveBoard(t)))throw Error('Task references missing Kanban board: '+t.id);return true;}
module.exports={DEFAULT_BOARD_ID,normalizedBoards,effectiveBoard,tasksForBoard,createBoard,renameBoard,deleteBoard,assignBoard,validateBoards};
