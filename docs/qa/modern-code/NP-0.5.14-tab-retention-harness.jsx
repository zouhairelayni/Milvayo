import React,{createContext,useContext,useRef,useState,useMemo,memo,useEffect,Profiler} from 'react';
import {createRoot} from 'react-dom/client';
import {flushSync} from 'react-dom';
const {createFreezeCell}=require('/home/claude/np/src/freezeCell.cjs');
const {shouldRenderPage}=require('/home/claude/np/src/pageRetention.cjs');
const StoreContext=createContext(null);
// identical logic to StoreFreeze in src/store.js
function StoreFreeze({frozen,children}){const live=useContext(StoreContext);const cell=useRef(null);if(!cell.current)cell.current=createFreezeCell(live);return <StoreContext.Provider value={cell.current.resolve(live,!!frozen)}>{children}</StoreContext.Provider>;}
const renders={};
const mk=id=>function Screen({query}){const s=useContext(StoreContext);renders[id]=(renders[id]||0)+1;return <div id={id}>{id}:{s.rev}:{query}</div>;};
const SCREENS={board:mk('board'),timeline:mk('timeline')};
// identical structure to CachedPage in ModernApp.js
const CachedPage=memo(function CachedPage({pageId,active,openTask,go,query}){
 const S=SCREENS[pageId];
 const content=useMemo(()=><S openTask={openTask} go={go} query={query}/>,[pageId,S,openTask,go,query]);
 return <div style={{display:active?'block':'none'}}><StoreFreeze frozen={!active}>{content}</StoreFreeze></div>;
},(p,n)=>!shouldRenderPage(p,n));
let api;
const openTask=()=>{},go=()=>{};
function Shell(){
 const [rev,setRev]=useState(0),[screen,setScreen]=useState('board'),[query,setQuery]=useState(''),[visited,setVisited]=useState(['board']);
 api={bump:()=>setRev(r=>r+1),show:k=>{setVisited(v=>v.includes(k)?v:[...v,k]);setScreen(k)},type:q=>setQuery(q)};
 const ctx=useMemo(()=>({rev}),[rev]);
 return <StoreContext.Provider value={ctx}>{['board','timeline'].filter(id=>visited.includes(id)).map(id=><CachedPage key={id} pageId={id} active={screen===id} openTask={openTask} go={go} query={query}/>)}</StoreContext.Provider>;
}
const root=createRoot(document.getElementById('r'));
const run=fn=>flushSync(fn);
window.runAll=()=>{
 const out=[];const snap=()=>({...renders});const diff=(a,b)=>({board:(b.board||0)-(a.board||0),timeline:(b.timeline||0)-(a.timeline||0)});
 run(()=>root.render(<Shell/>));
 run(()=>api.show('timeline'));                      // first visit of timeline mounts it
 out.push(['mounted both',snap()]);
 run(()=>api.show('board'));let a=snap();            // board visible, timeline hidden
 run(()=>api.bump());run(()=>api.bump());run(()=>api.bump());
 out.push(['3 edits while timeline hidden',diff(a,snap())]);
 a=snap();run(()=>api.type('a'));run(()=>api.type('ab'));
 out.push(['typing while timeline hidden',diff(a,snap())]);
 a=snap();run(()=>api.show('timeline'));
 out.push(['show timeline after edits (store changed while hidden)',diff(a,snap()),document.getElementById('timeline').textContent]);
 a=snap();run(()=>api.show('board'));run(()=>api.show('timeline'));run(()=>api.show('board'));
 out.push(['3 tab switches, no store change',diff(a,snap())]);
 return out;
};
