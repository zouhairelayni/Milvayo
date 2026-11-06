// /src/app/navigation/useBackNavigation.js
import {useCallback,useLayoutEffect,useMemo,useRef} from 'react';
import {BackHandler,Platform} from 'react-native';
const {createScreenHistory}=require('./screenHistory.cjs');
const {createBrowserBack}=require('./browserBack.cjs');
const {backEvents}=require('./backEvents.cjs');

export function useBackDismiss(visible,onClose,priority=20){
 const latest=useRef(onClose);latest.current=onClose;
 useLayoutEffect(()=>visible?backEvents.add(()=>latest.current(),priority):undefined,[visible,priority]);
}

export function useBackNavigation({scope,screen,go,isAvailable}){
 const history=useRef(null),browser=useRef(null),latest=useRef(null),scopeChanged=useRef(false);
 latest.current={go,isAvailable};
 if(!history.current)history.current=createScreenHistory(scope,screen);
 if(history.current.scope!==scope){history.current.reset(scope,screen);scopeChanged.current=true;}
 const back=useCallback(()=>{
  if(!history.current.canBack(latest.current.isAvailable))return false;
  if(browser.current?.usable){browser.current.back();return true;}
  const previous=history.current.back(latest.current.isAvailable);
  latest.current.go(previous.screen,'back navigation',false);return true;
 },[]);
 useLayoutEffect(()=>{
  const clear=backEvents.setRoot(back);
  const subscription=Platform.OS==='android'?BackHandler.addEventListener('hardwareBackPress',()=>backEvents.dispatch()):null;
  if(Platform.OS==='web'&&typeof window!=='undefined')browser.current=createBrowserBack(window,{
   history:history.current,events:backEvents,restore:id=>{
    const entry=history.current.restore(id,latest.current.isAvailable);
    if(!entry)return false;latest.current.go(entry.screen,'browser history',false);return true;
   },
  });
  return()=>{clear();subscription?.remove();browser.current?.stop();browser.current=null;};
 },[back]);
 useLayoutEffect(()=>{if(scopeChanged.current){scopeChanged.current=false;browser.current?.reset();}},[scope]);
 return useMemo(()=>({
  visit(target){const entry=history.current.push(target);browser.current?.visit(entry);},
  back:()=>backEvents.dispatch(),
 }),[]);
}
