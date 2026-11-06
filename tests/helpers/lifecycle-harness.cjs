// /tests/helpers/lifecycle-harness.cjs
'use strict';
function lifecycleHarness(){
 const values=[],effects=[],pending=[];let cursor=0;
 const hooks={
  useState(initial){const i=cursor++;if(!(i in values))values[i]=typeof initial==='function'?initial():initial;return [values[i],v=>{values[i]=typeof v==='function'?v(values[i]):v;}];},
  useRef(initial){return hooks.useState(()=>({current:initial}))[0];},
  useMemo(fn,deps){const ref=hooks.useRef(null);if(!ref.current||deps.some((v,i)=>!Object.is(v,ref.current.deps[i])))ref.current={deps,value:fn()};return ref.current.value;},
  useCallback(fn,deps){return hooks.useMemo(()=>fn,deps);},
  useId(){return hooks.useRef('lifecycle-'+cursor).current;},
  useEffect(fn,deps=[]){const i=cursor++;if(!effects[i]||deps.some((v,n)=>!Object.is(v,effects[i].deps[n])))pending.push(()=>{effects[i]?.cleanup?.();effects[i]={deps,cleanup:fn()};});},
 };
 hooks.useLayoutEffect=hooks.useEffect;
 return {hooks,render(fn,props){cursor=0;pending.length=0;const tree=fn(props);pending.splice(0).forEach(f=>f());return tree;},unmount(){effects.forEach(e=>e?.cleanup?.());}};
}
function fakeClock(){
 let now=0,serial=0;const timers=new Map();
 return {
  setTimeout(fn,ms){timers.set(++serial,{fn,at:now+ms});return serial;},clearTimeout(id){timers.delete(id);},
  get size(){return timers.size;},
  advance(ms){const end=now+ms;let count=0;for(;;){const next=[...timers].sort((a,b)=>a[1].at-b[1].at)[0];if(!next||next[1].at>end)break;if(++count>100)throw Error('Unbounded test timer');now=next[1].at;timers.delete(next[0]);next[1].fn();}now=end;},
 };
}
module.exports={lifecycleHarness,fakeClock};
