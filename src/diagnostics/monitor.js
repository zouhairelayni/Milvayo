// /src/diagnostics/monitor.js
// Local, bounded diagnostics. No analytics SDK, network calls or private workspace fields.
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import core from './core.cjs';
import { readNativeExit } from './nativeExit';
import app from '../../app.json';
const KEY = '@milvayo/diagnostics/v1';
const VERSION = app.expo.version; // one place to bump per release
let state = core.fresh(`${Date.now().toString(36)}`, Date.now(), {platform: Platform.OS, os: String(Platform.Version), version: VERSION});
let booted = false;
let isActive = AppState.currentState == null || AppState.currentState === 'active';
state.active = isActive;
let disposed = false;
let pageHideHandler = null;
let pageShowHandler = null;
let lastTick = Date.now();
let tickTimer = null;
let appSubscription = null;
let previousHandler = null;
let listener = null;
let originalWarn = null;
let originalError = null;
let ioGeneration = 0;
let saveTimer = null;
const writer = require('../store/latestWriter.cjs').createLatestWriter(generation =>
 generation === ioGeneration ? AsyncStorage.setItem(KEY,JSON.stringify(state)) : undefined);
// Ordinary breadcrumbs share one bounded 200ms window; critical evidence bypasses it.
function pushSave(immediate=false){
 if(disposed)return;
 if(immediate||!isActive){if(saveTimer!==null)clearTimeout(saveTimer);saveTimer=null;return writer.enqueue(ioGeneration);}
 if(saveTimer===null)saveTimer=setTimeout(()=>{saveTimer=null;void writer.enqueue(ioGeneration);},200);
}
function safeEvent(type, detail, immediate=false) { core.addEvent(state,type,detail); pushSave(immediate); notify(); }
function notify(){try {listener?.();} catch{}}
function captureError(err, source = 'error boundary', screen = state.screen, componentStack = '', fatal = false) {
  const exception = err && typeof err === 'object' ? err : {name:'Error',message:String(err),stack:''};
  core.addCrash(state, {source, name:exception.name || 'Error', message:exception.message || '',
    stack:exception.stack || '', screen, componentStack, fatal});
  pushSave(true); notify();
}
function recordScreen(screen){
  state.screen = String(screen);
  state.screenOpens[screen] = (state.screenOpens[screen] || 0) + 1;
  safeEvent('screen opened',screen);
}
function recordAction(action){safeEvent('action',action);}
function recordTransition(screen,ms){ if (ms >= 180) {core.addSlow(state,'navigation',screen,ms);pushSave();notify();} }
function recordRender(screen, duration){
  if (!Number.isFinite(duration)) return;
  const v = state.render[screen] || {count:0,sum:0,max:0};
  v.count += 1; v.sum += duration; v.max = Math.max(v.max,duration);
  state.render[screen] = v;
  if (duration > 100) {core.addSlow(state,'React render',screen,duration);pushSave();}
}
function snapshot(){return JSON.parse(JSON.stringify(state));}
function subscribe(fn){listener = fn;return () => {if(listener===fn) listener=null;};}
function clear(){
  ioGeneration += 1;
  state = core.fresh(`${Date.now().toString(36)}`, Date.now(),{platform:Platform.OS,os:String(Platform.Version),version:VERSION});
  state.active = isActive;
  lastTick = Date.now();
  pushSave(true);notify();
}
async function start(){
  if(booted||disposed)return;
  booted = true;
  const generation = ioGeneration;
  // Request the old report before any new write, without delaying capture hooks.
  let previousRead;
  try{previousRead=AsyncStorage.getItem(KEY);}catch{previousRead=Promise.resolve(null);}

  const errorUtils = global.ErrorUtils;
  if(errorUtils?.getGlobalHandler && errorUtils?.setGlobalHandler){
    previousHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error,isFatal)=>{
      try {captureError(error,'global JS handler',state.screen,'',!!isFatal);}catch{}
      previousHandler?.(error,isFatal);
    });
  }
  originalWarn = console.warn;
  originalError = console.error;
  console.warn = (...args)=>{try{state.warnings++;const kind=core.warningKind(args);state.warningKinds[kind]=(state.warningKinds[kind]||0)+1;if(state.warnings <= 15)core.addEvent(state,'warning','console.warn (message withheld for privacy)');pushSave();}catch{} originalWarn(...args);};
  console.error = (...args)=>{try{state.errors++;if(state.errors <= 15)core.addEvent(state,'console error','console.error (message withheld for privacy)');pushSave(true);notify();}catch{} originalError(...args);};

  const onAppState=status=>{
    isActive = status === 'active';
    state.active = isActive;
    safeEvent('app state',status,!isActive);
    lastTick = Date.now();
  };
  appSubscription = AppState.addEventListener('change',onAppState);
  if(AppState.currentState!=null){isActive=AppState.currentState==='active';state.active=isActive;}
  if(Platform.OS==='web'&&typeof window!=='undefined'){
    pageHideHandler=()=>onAppState('background');
    pageShowHandler=()=>onAppState(AppState.currentState||'active');
    window.addEventListener('pagehide',pageHideHandler);
    window.addEventListener('pageshow',pageShowHandler);
  }
  lastTick=Date.now();
  tickTimer = setInterval(()=>{
    const now = Date.now();
    const drift = Math.max(0,now-lastTick-1000);
    lastTick = now;
    if(isActive&&drift>400&&drift<30000){
      state.freezeMs=Math.max(state.freezeMs,Math.round(drift));
      core.addSlow(state,'JS timer delay',state.screen,drift,now);
      pushSave();notify();
    }
  },1000);
  safeEvent('run started','local diagnostics enabled');

  try{
    const saved=await previousRead;
    if(disposed||generation!==ioGeneration)return;
    if(saved){
      const old=JSON.parse(saved);
      state.previous={active:!!old.active,updatedAt:old.updatedAt,runId:old.runId,version:old.version,
        events:Array.isArray(old.events)?old.events.slice(-16):[],
        crashes:Array.isArray(old.crashes)?old.crashes.slice(-12):[]};
    }
  }catch{ /* a failed report read must never block capture or startup */ }
  if(disposed||generation!==ioGeneration)return;
  pushSave();
  Promise.resolve().then(readNativeExit).then(exit=>{
    if(exit&&!disposed&&generation===ioGeneration){state.nativeExit=exit;pushSave();notify();}
  }).catch(()=>{});
}
export const diagnosticMonitor = {start, recordScreen, recordAction, recordTransition,recordRender,captureError,snapshot,subscribe,clear,
  crashReport:()=>core.reportCrash(state),performanceReport:()=>core.reportPerf(state)};

// Fast Refresh should not stack global handlers or timers on each refresh.
if (module.hot) module.hot.dispose(() => {
  if(saveTimer!==null)pushSave(true);
  disposed = true;
  if (tickTimer!==null) clearInterval(tickTimer);
  appSubscription?.remove?.();
  if(typeof window!=='undefined'){
    if(pageHideHandler)window.removeEventListener('pagehide',pageHideHandler);
    if(pageShowHandler)window.removeEventListener('pageshow',pageShowHandler);
  }
  if (originalWarn) console.warn = originalWarn;
  if (originalError) console.error = originalError;
  if (previousHandler && global.ErrorUtils?.setGlobalHandler) global.ErrorUtils.setGlobalHandler(previousHandler);
  booted = false;
});
