// /src/diagnostics/monitor.js
// Local, bounded diagnostics. No analytics SDK, network calls or private workspace fields.
import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import core from './core.cjs';
import app from '../../app.json';
const KEY = '@milvayo/diagnostics/v1';
const VERSION = app.expo.version; // one place to bump per release
let state = core.fresh(`${Date.now().toString(36)}`, Date.now(), {platform: Platform.OS, os: String(Platform.Version), version: VERSION});
let booted = false;
let isActive = true;
let lastTick = Date.now();
let tickTimer = null;
let appSubscription = null;
let previousHandler = null;
let listener = null;
let originalWarn = null;
let originalError = null;
let ioGeneration = 0;
const writer = require('../store/latestWriter.cjs').createLatestWriter(generation =>
 generation === ioGeneration ? AsyncStorage.setItem(KEY,JSON.stringify(state)) : undefined);
function pushSave(){return writer.enqueue(ioGeneration);}
function safeEvent(type, detail) { core.addEvent(state,type,detail); pushSave(); notify(); }
function notify(){try {listener?.();} catch{}}
function captureError(err, source = 'error boundary', screen = state.screen, componentStack = '', fatal = false) {
  const exception = err instanceof Error ? err : {name:'Error',message: String(err), stack:''};
  core.addCrash(state, {source, name:exception.name || 'Error', message:exception.message || '',
    stack:exception.stack || '', screen, componentStack, fatal});
  pushSave(); notify();
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
  pushSave();notify();
}
async function start(){
  if(booted)return;
  booted = true;
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if(saved){
      const old = JSON.parse(saved);
      // Preserve reports for the previous run only. Never imply that Expo Go
      // being killed by Android was a proven app crash.
      state.previous = {active:!!old.active,updatedAt:old.updatedAt,runId:old.runId,version:old.version,
        crashes:Array.isArray(old.crashes)?old.crashes.slice(-12):[]};
      // Keep current-run counters and traces consistent. Previous-run status
      // stays in the explicitly labelled summary, never mixed into these arrays.
    }
  }catch { /* diagnostics must never block startup */ }
  safeEvent('run started','local diagnostics enabled');
  appSubscription = AppState.addEventListener('change',status=>{
    isActive = status === 'active';
    state.active = isActive;
    safeEvent('app state', status);
    lastTick = Date.now();
  });
  tickTimer = setInterval(()=>{
    const now = Date.now();
    const drift = Math.max(0, now - lastTick - 1000);
    lastTick = now;
    if (isActive && drift > 400 && drift < 30000) {
      state.freezeMs = Math.max(state.freezeMs, Math.round(drift));
      core.addSlow(state,'JS timer delay',state.screen,drift,now);
      pushSave();notify();
    }
  },1000);
  // Capture uncaught JS exceptions without suppressing React Native/Expo's handler.
  const errorUtils = global.ErrorUtils;
  if(errorUtils?.getGlobalHandler && errorUtils?.setGlobalHandler){
    previousHandler = errorUtils.getGlobalHandler();
    errorUtils.setGlobalHandler((error,isFatal)=>{
      try {captureError(error,'global JS handler',state.screen,'',!!isFatal);}catch{}
      previousHandler?.(error,isFatal);
    });
  }
  // Retain original console methods. Logs are sanitized before persistence.
  originalWarn = console.warn;
  originalError = console.error;
  console.warn = (...args)=>{try{state.warnings++;if(state.warnings <= 15)core.addEvent(state,'warning','console.warn (message withheld for privacy)');}catch{} originalWarn(...args);};
  console.error = (...args)=>{try{state.errors++;if(state.errors <= 15)core.addEvent(state,'console error','console.error (message withheld for privacy)');}catch{} originalError(...args);};
}
export const diagnosticMonitor = {start, recordScreen, recordAction, recordTransition,recordRender,captureError,snapshot,subscribe,clear,
  crashReport:()=>core.reportCrash(state),performanceReport:()=>core.reportPerf(state)};

// Fast Refresh should not stack global handlers or timers on each refresh.
if (module.hot) module.hot.dispose(() => {
  if (tickTimer) clearInterval(tickTimer);
  appSubscription?.remove?.();
  if (originalWarn) console.warn = originalWarn;
  if (originalError) console.error = originalError;
  if (previousHandler && global.ErrorUtils?.setGlobalHandler) global.ErrorUtils.setGlobalHandler(previousHandler);
  booted = false;
});
