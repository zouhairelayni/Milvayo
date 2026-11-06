// /tests/helpers/monitor-harness.cjs
'use strict';
const {load}=require('./diagram-harness.cjs');
function monitorHarness({read=async()=>null,platform='android',currentState='active',nativeExit=async()=>null}={}){
 let now=1000000,serial=0,fail=false,dispose=()=>{};
 const timers=new Map(),intervals=new Map(),writes=[],listeners=new Set(),browser=new Map(),io=[],originalCalls={warn:[],error:[],fatal:[]};
 const FakeDate=class extends Date{static now(){return now;}};
 const originalHandler=(...args)=>originalCalls.fatal.push(args);let handler=originalHandler;
 const appState={currentState,addEventListener:(_event,fn)=>{listeners.add(fn);return {remove:()=>listeners.delete(fn)};}};
 const storage={getItem:()=>{io.push('read');return read();},setItem:async(key,value)=>{io.push('write');if(fail)throw Error('storage unavailable');writes.push(JSON.parse(value));}};
 const logger={warn:(...args)=>originalCalls.warn.push(args),error:(...args)=>originalCalls.error.push(args)};
 const originalWarn=logger.warn,originalError=logger.error;
 const window={addEventListener:(name,fn)=>browser.set(name,fn),removeEventListener:(name,fn)=>{if(browser.get(name)===fn)browser.delete(name);}};
 const module=load('src/diagnostics/monitor.js',{
  'react-native':{Platform:{OS:platform,Version:35},AppState:appState},
  '@react-native-async-storage/async-storage':storage,'./nativeExit':{readNativeExit:nativeExit},'../../app.json':require('../../app.json'),
 },[],{Date:FakeDate,Error,global:{ErrorUtils:{getGlobalHandler:()=>handler,setGlobalHandler:next=>{handler=next;}}},window,console:logger,
  setTimeout:(fn,wait)=>{timers.set(++serial,{fn,at:now+wait});return serial;},clearTimeout:id=>timers.delete(id),
  setInterval:fn=>{intervals.set(++serial,fn);return serial;},clearInterval:id=>intervals.delete(id),
 },{hot:{dispose:fn=>{dispose=fn;}}});
 const drain=async()=>{for(let i=0;i<20;i++)await Promise.resolve();};
 const state=status=>{appState.currentState=status;listeners.forEach(fn=>fn(status));};
 return {monitor:module.diagnosticMonitor,writes,timers,intervals,browser,io,originalCalls,drain,
  setFail:value=>{fail=value;},state,background:()=>state('background'),resume:()=>state('active'),
  fatal:(...args)=>handler(...args),warn:(...args)=>logger.warn(...args),error:(...args)=>logger.error(...args),
  page:name=>browser.get(name)?.(),tick:()=>intervals.forEach(fn=>fn()),dispose:()=>dispose(),
  restored:()=>handler===originalHandler&&logger.warn===originalWarn&&logger.error===originalError,
  async advance(ms){now+=ms;for(const [id,timer]of [...timers])if(timer.at<=now){timers.delete(id);timer.fn();}await drain();},
 };
}
module.exports={monitorHarness};
